from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.api.dependencies import get_current_user, require_role
from app.models.user import User, RoleEnum
from app.services.report_service import report_service
from typing import Optional

router = APIRouter()

@router.get("/employees/csv")
def download_employee_report(
    department_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([RoleEnum.ADMIN, RoleEnum.MANAGER]))
):
    # If MANAGER, they can only export their own department's data
    if current_user.role == RoleEnum.MANAGER:
        if not current_user.employee_profile:
            raise HTTPException(status_code=400, detail="Manager has no assigned profile")
        if department_id and department_id != current_user.employee_profile.department_id:
            raise HTTPException(status_code=403, detail="Can only export own department data")
        department_id = current_user.employee_profile.department_id
        
    csv_content = report_service.generate_employee_performance_csv(db, department_id)
    
    return PlainTextResponse(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=employee_report_{department_id or 'all'}.csv"}
    )
