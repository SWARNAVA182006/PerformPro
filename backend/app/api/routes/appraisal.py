from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.api.dependencies import get_current_user, require_role
from app.models.user import User, RoleEnum
from app.models.employee import Employee
from app.models.appraisal import Appraisal
from app.schemas.appraisal import SelfAppraisalCreate, AppraisalResponse
from app.services.appraisal_service import appraisal_service
from app.services.performance_service import performance_service
from app.services.notification_service import notification_service
from app.services.audit_service import audit_service
from pydantic import BaseModel

router = APIRouter()

class ManagerAppraisalCreate(BaseModel):
    employee_id: int
    review_period: str
    manager_remarks: str

class AppraisalReview(BaseModel):
    manager_rating: float
    manager_comments: str

@router.post("/", response_model=dict)
def submit_appraisal(
    eval_data: dict, # Support flexible input for now
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Determine if it's a manager review or self-appraisal
    if "manager_remarks" in eval_data:
        # Manager review flow
        if current_user.role not in [RoleEnum.ADMIN, RoleEnum.MANAGER]:
            raise HTTPException(status_code=403, detail="Only managers can submit reviews")
            
        appraisal = appraisal_service.create_manager_appraisal(
            db=db,
            employee_id=eval_data["employee_id"],
            manager_id=current_user.employee_profile.id if current_user.employee_profile else None,
            review_period=eval_data["review_period"],
            remarks=eval_data["manager_remarks"]
        )
        msg = "Performance appraisal submitted by manager."
    else:
        # Self-appraisal flow
        appraisal = appraisal_service.submit_appraisal(
            db=db,
            employee_id=eval_data["employee_id"],
            self_rating=eval_data.get("self_rating", 5.0),
            self_comments=eval_data.get("self_comments", "")
        )
        msg = "Self appraisal submitted."
    
    # Notify Manager
    emp = db.query(Employee).filter(Employee.id == appraisal.employee_id).first()
    if emp and emp.manager_id:
        mgr = db.query(Employee).filter(Employee.id == emp.manager_id).first()
        if mgr and mgr.user_id:
            notification_service.create_notification(
                db, 
                user_id=mgr.user_id, 
                title="Appraisal Submitted", 
                message=f"{emp.name} submitted a new self-appraisal."
            )

    # Audit Log
    audit_service.log_action(db, current_user.id, "submitted", "Appraisal", appraisal.id, {"period": appraisal.review_period})

    return {
        "success": True, 
        "data": AppraisalResponse.from_orm(appraisal).dict(), 
        "message": msg
    }

@router.get("/", response_model=dict)
def get_appraisals(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([RoleEnum.ADMIN, RoleEnum.MANAGER]))
):
    if current_user.role == RoleEnum.ADMIN:
        appraisals = db.query(Appraisal).order_by(Appraisal.created_at.desc()).all()
    elif current_user.role == RoleEnum.MANAGER and current_user.employee_profile:
        emp_id = current_user.employee_profile.id
        appraisals = db.query(Appraisal).join(Employee, Appraisal.employee_id == Employee.id).filter(
            Employee.manager_id == emp_id
        ).order_by(Appraisal.created_at.desc()).all()
    else:
        appraisals = []

    return {"success": True, "data": [AppraisalResponse.from_orm(a).dict() for a in appraisals]}

@router.get("/my", response_model=dict)
def get_my_appraisals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.employee_profile:
        raise HTTPException(status_code=400, detail="Employee profile not found")
        
    appraisals = db.query(Appraisal).filter(Appraisal.employee_id == current_user.employee_profile.id).order_by(Appraisal.created_at.desc()).all()
    return {"success": True, "data": [AppraisalResponse.from_orm(a).dict() for a in appraisals]}

@router.put("/{appraisal_id}/approve", response_model=dict)
def approve_appraisal(
    appraisal_id: int,
    review_data: AppraisalReview,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([RoleEnum.MANAGER, RoleEnum.ADMIN]))
):
    appraisal = db.query(Appraisal).filter(Appraisal.id == appraisal_id).first()
    if not appraisal:
        raise HTTPException(status_code=404, detail="Appraisal not found")

    target_status = "Approved"
    if current_user.role == RoleEnum.MANAGER:
        target_status = "Pending Admin"
    
    appraisal = appraisal_service.review_appraisal(
        db=db,
        appraisal_id=appraisal_id,
        manager_id=manager_emp_id,
        manager_rating=review_data.manager_rating,
        manager_comments=review_data.manager_comments,
        approved=True
    )
    # Update to specific multi-stage status
    appraisal.status = target_status
    db.commit()

    # Trigger KPI update only if fully approved
    if target_status == "Approved":
        performance_service.calculate_kpi(db, appraisal.employee_id)

    # Notify next stakeholder
    if target_status == "Pending Admin":
        # Notify Admins
        admins = db.query(User).filter(User.role == RoleEnum.ADMIN).all()
        for admin in admins:
            notification_service.create_notification(
                db, 
                user_id=admin.id, 
                title="Appraisal Review Complete", 
                message=f"Manager has reviewed appraisal for ID #{appraisal.employee_id}. Awaiting final admin approval."
            )
    else: # Approved
        emp_user = db.query(User).join(Employee, Employee.user_id == User.id).filter(Employee.id == appraisal.employee_id).first()
        if emp_user:
            notification_service.create_notification(
                db, 
                user_id=emp_user.id, 
                title="Appraisal Approved", 
                message="Your performance appraisal has been finalized and approved."
            )

    # Audit Log
    audit_service.log_action(db, current_user.id, "approved/reviewed", "Appraisal", appraisal.id, {"status": target_status})

    return {"success": True, "data": AppraisalResponse.from_orm(appraisal).dict()}

@router.put("/{appraisal_id}/reject", response_model=dict)
def reject_appraisal(
    appraisal_id: int,
    review_data: AppraisalReview,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([RoleEnum.MANAGER, RoleEnum.ADMIN]))
):
    manager_emp_id = current_user.employee_profile.id if current_user.employee_profile else None
    
    appraisal = appraisal_service.review_appraisal(
        db=db,
        appraisal_id=appraisal_id,
        manager_id=manager_emp_id,
        manager_rating=review_data.manager_rating,
        manager_comments=review_data.manager_comments,
        approved=False
    )
    # Trigger KPI update
    performance_service.calculate_kpi(db, appraisal.employee_id)

    
    return {"success": True, "data": AppraisalResponse.from_orm(appraisal).dict()}
