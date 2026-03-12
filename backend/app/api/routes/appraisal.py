from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.api.dependencies import get_current_user, require_role
from app.models.user import User, RoleEnum
from app.schemas.appraisal import SelfAppraisalCreate, ManagerReviewCreate, AppraisalResponse
from app.services.appraisal_service import appraisal_service

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
    
    return {
        "success": True,
        "data": AppraisalResponse.from_orm(appraisal).dict(),
        "message": f"Appraisal {appraisal.status.lower()} successfully",
        "pagination": None
    }
