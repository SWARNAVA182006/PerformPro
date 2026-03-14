from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.api.dependencies import get_current_user, require_role
from app.models.user import User, RoleEnum
from app.models.employee import Employee
from app.models.appraisal import Appraisal
from app.schemas.appraisal import SelfAppraisalCreate, ManagerReviewCreate, AppraisalResponse
from app.services.appraisal_service import appraisal_service
from app.services.notification_service import notification_service

router = APIRouter()

@router.post("/self-evaluation", response_model=dict)
def submit_self_appraisal(
    eval_data: SelfAppraisalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([RoleEnum.EMPLOYEE, RoleEnum.MANAGER]))
):
    # Ensure they are appraising themselves
    if current_user.employee_profile and current_user.employee_profile.id != eval_data.employee_id:
        # Give grace if Admin
        if current_user.role != RoleEnum.ADMIN:
            raise HTTPException(status_code=403, detail="Cannot self-appraise for another employee")
            
    appraisal = appraisal_service.create_self_appraisal(
        db=db,
        employee_id=eval_data.employee_id,
        self_rating=eval_data.self_rating,
        self_comments=eval_data.self_comments
    )
    
    # Notify Manager
    emp = db.query(Employee).filter(Employee.id == eval_data.employee_id).first()
    if emp and emp.manager_id:
        manager_emp = db.query(Employee).filter(Employee.id == emp.manager_id).first()
        if manager_emp and manager_emp.user_id:
            notification_service.create_notification(
                db=db,
                user_id=manager_emp.user_id,
                title="New Appraisal Pending Review",
                message=f"{emp.name} has submitted their self-appraisal and is waiting for your review."
            )
    
    return {
        "success": True,
        "data": AppraisalResponse.from_orm(appraisal).dict(),
        "message": "Self appraisal submitted. Pending manager review.",
        "pagination": None
    }

@router.post("/manager-review", response_model=dict)
def submit_manager_review(
    review_data: ManagerReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([RoleEnum.MANAGER, RoleEnum.ADMIN]))
):
    manager_emp_id = current_user.employee_profile.id if current_user.employee_profile else None
    
    if not manager_emp_id and current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=400, detail="Logging in user has no active employee profile linking")
        
    appraisal = appraisal_service.manager_review_appraisal(
        db=db,
        appraisal_id=review_data.appraisal_id,
        manager_id=manager_emp_id,
        manager_rating=review_data.manager_rating,
        manager_comments=review_data.manager_comments,
        approved=review_data.approved
    )
    
    # Notify Employee
    emp = db.query(Employee).filter(Employee.id == appraisal.employee_id).first()
    if emp and emp.user_id:
        status_text = "approved" if review_data.approved else "rejected"
        notification_service.create_notification(
            db=db,
            user_id=emp.user_id,
            title=f"Appraisal {status_text.capitalize()}",
            message=f"Your manager has {status_text} your latest performance appraisal."
        )
    
    return {
        "success": True,
        "data": AppraisalResponse.from_orm(appraisal).dict(),
        "message": f"Appraisal {appraisal.status.lower()} successfully",
        "pagination": None
    }

@router.get("/", response_model=dict)
def get_appraisals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Admins see all
    if current_user.role == RoleEnum.ADMIN:
        appraisals = db.query(Appraisal).order_by(Appraisal.created_at.desc()).all()
    # Managers see their own and their direct reports
    elif current_user.role == RoleEnum.MANAGER and current_user.employee_profile:
        emp_id = current_user.employee_profile.id
        appraisals = db.query(Appraisal).join(Employee, Appraisal.employee_id == Employee.id).filter(
            (Appraisal.employee_id == emp_id) | (Employee.manager_id == emp_id)
        ).order_by(Appraisal.created_at.desc()).all()
    # Employees see only their own
    elif current_user.employee_profile:
        appraisals = db.query(Appraisal).filter(Appraisal.employee_id == current_user.employee_profile.id).order_by(Appraisal.created_at.desc()).all()
    else:
        appraisals = []

    return {
        "success": True,
        "data": [AppraisalResponse.from_orm(a).dict() for a in appraisals],
        "message": "Appraisals retrieved successfully",
        "pagination": None
    }
