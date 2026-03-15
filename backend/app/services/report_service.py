import csv
import io
import pandas as pd
from sqlalchemy import func, case
from sqlalchemy.orm import Session
from app.models.employee import Employee
from app.models.department import Department
from app.models.goal import Goal
from app.models.appraisal import Appraisal

class ReportService:
    @staticmethod
    def export_enterprise_report(db: Session) -> str:
        # Complex query for 6 columns: Employee, Department, Goals, Appraisals, Ratings, Performance Score
        results = db.query(
            Employee.name.label("employee_name"),
            Department.name.label("department_name"),
            func.count(func.distinct(Goal.id)).label("goal_count"),
            func.count(func.distinct(Appraisal.id)).label("appraisal_count"),
            func.avg(Appraisal.rating).label("avg_rating"),
            Employee.performance_score
        ).outerjoin(Department, Employee.department_id == Department.id)\
         .outerjoin(Goal, Employee.id == Goal.employee_id)\
         .outerjoin(Appraisal, Employee.id == Appraisal.employee_id)\
         .group_by(Employee.id, Department.name).all()

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Employee", "Department", "Goals", "Appraisals", "Avg Rating", "Performance Score"])
        
        for name, dept, goals, appraisals, rating, score in results:
            writer.writerow([
                name, 
                dept or "Unassigned", 
                goals, 
                appraisals, 
                round(float(rating or 0), 2), 
                round(float(score or 0), 2)
            ])
            
        return output.getvalue()

    @staticmethod
    def generate_employee_performance_csv(db: Session, department_id: int = None) -> str:
        # Legacy support or extra feature
        query = db.query(Employee, Department.name.label('department_name')).outerjoin(Department, Employee.department_id == Department.id)
        if department_id:
            query = query.filter(Employee.department_id == department_id)
        employees = query.all()
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(['Employee ID', 'Name', 'Email', 'Role', 'Department', 'Performance Score', 'Status'])
        for emp, dept_name in employees:
            writer.writerow([emp.id, emp.name, emp.email, emp.role, dept_name or 'Unassigned', emp.performance_score, emp.status])
        return output.getvalue()

report_service = ReportService()
