import csv
import io
import pandas as pd
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle
from reportlab.lib import colors
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

    @staticmethod
    def _get_employee_data(db: Session, department_id: int = None):
        query = db.query(Employee, Department.name.label('department_name')).outerjoin(Department, Employee.department_id == Department.id)
        if department_id:
            query = query.filter(Employee.department_id == department_id)
        return query.all()

    @staticmethod
    def generate_employee_performance_excel(db: Session, department_id: int = None) -> bytes:
        employees = ReportService._get_employee_data(db, department_id)
        data = []
        for emp, dept_name in employees:
            data.append({
                'Employee ID': emp.id,
                'Name': emp.name,
                'Email': emp.email,
                'Role': emp.role,
                'Department': dept_name or 'Unassigned',
                'Date Joined': emp.date_joined.strftime("%Y-%m-%d"),
                'Performance Score': emp.performance_score,
                'Status': emp.status
            })
            
        df = pd.DataFrame(data)
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='PerformPro Report')
        return output.getvalue()

    @staticmethod
    def generate_employee_performance_pdf(db: Session, department_id: int = None) -> bytes:
        employees = ReportService._get_employee_data(db, department_id)
        
        output = io.BytesIO()
        doc = SimpleDocTemplate(output, pagesize=letter)
        elements = []
        
        # Data
        data = [['ID', 'Name', 'Role', 'Dept', 'Score', 'Status']]
        for emp, dept_name in employees:
            data.append([
                str(emp.id),
                emp.name,
                emp.role,
                dept_name or 'Unassigned',
                str(emp.performance_score),
                emp.status
            ])
            
        t = Table(data)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.grey),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0,0), (-1,0), 12),
            ('BACKGROUND', (0,1), (-1,-1), colors.beige),
            ('GRID', (0,0), (-1,-1), 1, colors.black)
        ]))
        
        elements.append(t)
        doc.build(elements)
        return output.getvalue()

report_service = ReportService()
