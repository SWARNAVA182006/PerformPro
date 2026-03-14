from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import PlainTextResponse, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.api.dependencies import get_current_user, require_role
from app.models.user import User, RoleEnum
from app.services.report_service import report_service
from typing import Optional

router = APIRouter()

@router.get("/employees")
def download_employee_report(
    department_id: Optional[int] = None,
    format: str = Query("csv", regex="^(csv|excel|pdf)$"),
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
        
    filename_base = f"employee_report_{department_id or 'all'}"
    
    if format == "csv":
        csv_content = report_service.generate_employee_performance_csv(db, department_id)
        return PlainTextResponse(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename_base}.csv"}
        )
    elif format == "excel":
        excel_content = report_service.generate_employee_performance_excel(db, department_id)
        return Response(
            content=excel_content,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename_base}.xlsx"}
        )
    elif format == "pdf":
        pdf_content = report_service.generate_employee_performance_pdf(db, department_id)
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename_base}.pdf"}
        )
