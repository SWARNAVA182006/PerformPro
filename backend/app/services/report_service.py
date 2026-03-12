import csv
import io
from sqlalchemy.orm import Session
from app.models.employee import Employee
from app.models.department import Department
from typing import List

class ReportService:
    @staticmethod
    def generate_employee_performance_csv(db: Session, department_id: int = None) -> str:
        query = db.query(Employee, Department.name.label('department_name')).outerjoin(Department, Employee.department_id == Department.id)
        if department_id:
            query = query.filter(Employee.department_id == department_id)
            
        employees = query.all()
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow(['Employee ID', 'Name', 'Email', 'Role', 'Department', 'Date Joined', 'Performance Score', 'Status'])
        
        # Rows
        for emp, dept_name in employees:
            writer.writerow([
                emp.id,
                emp.name,
                emp.email,
                emp.role,
                dept_name or 'Unassigned',
                emp.date_joined.strftime("%Y-%m-%d"),
                emp.performance_score,
                emp.status
            ])
            
        return output.getvalue()

report_service = ReportService()
