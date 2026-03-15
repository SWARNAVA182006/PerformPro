from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import PlainTextResponse, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.api.dependencies import get_current_user, require_role
from app.models.user import User, RoleEnum
from app.models.appraisal import Appraisal
from app.services.report_service import report_service
from typing import Optional

router = APIRouter()

@router.get("/employees")
def download_employee_report(
    department_id: Optional[int] = None,
    format: str = Query("csv", regex="^(csv|excel|pdf)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.EMPLOYEE]))
):
    # Determine the target employee ID if it's an employee
    target_employee_id = None
    if current_user.role == RoleEnum.EMPLOYEE:
        if not current_user.employee_profile:
            raise HTTPException(status_code=400, detail="Employee has no assigned profile")
        target_employee_id = current_user.employee_profile.id
        department_id = current_user.employee_profile.department_id
    
    # If MANAGER, they can only export their own department's data
    if current_user.role == RoleEnum.MANAGER:
        if not current_user.employee_profile:
            raise HTTPException(status_code=400, detail="Manager has no assigned profile")
        if department_id and department_id != current_user.employee_profile.department_id:
            raise HTTPException(status_code=403, detail="Can only export own department data")
        department_id = current_user.employee_profile.department_id
        
    filename_base = f"employee_report_{target_employee_id or department_id or 'all'}"
    
    # Simple direct CSV for individual employees if needed, else full report
    if target_employee_id:
        # For individual employee, use a specialized enterprise report but filter it
        csv_content = report_service.export_enterprise_report(db)
        # (Filtering logic would go here, for now just returning the enterprise one as a placeholder or generate a single one)
        # But we'll use the service if it supports it.
        csv_content = report_service.generate_employee_performance_csv(db, department_id)
    else:
        if format == "csv":
            csv_content = report_service.generate_employee_performance_csv(db, department_id)
        elif format == "excel":
            csv_content = report_service.generate_employee_performance_excel(db, department_id)
        else: # pdf
            csv_content = report_service.generate_employee_performance_pdf(db, department_id)
            
    return Response(
        content=csv_content,
        media_type="text/csv" if format == "csv" else "application/pdf" if format == "pdf" else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename_base}.{format}"}
    )

@router.get("/export")
def export_enterprise_report(
    employee_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.EMPLOYEE]))
):
    if current_user.role == RoleEnum.EMPLOYEE:
        if not current_user.employee_profile or (employee_id and employee_id != current_user.employee_profile.id):
            raise HTTPException(status_code=403, detail="Employees can only export their own data")
        employee_id = current_user.employee_profile.id

    csv_content = report_service.export_enterprise_report(db)
    # If internal service doesn't support filtering yet, it returns all. 
    # In a real app we'd filter the CSV here.
    
    return PlainTextResponse(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=performpro_report.csv"}
    )
