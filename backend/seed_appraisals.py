import os
import random
from datetime import datetime, timedelta
from app.database import SessionLocal
from app.models.employee import Employee
from app.models.department import Department
from app.models.appraisal import Appraisal
from app.models.kpi import KPI
from app.models.user import User

db = SessionLocal()

def generate_data():
    # Make sure we have some departments
    dept_names = ["Engineering", "Sales", "Marketing", "HR"]
    departments = []
    for dname in dept_names:
        dept = db.query(Department).filter(Department.name == dname).first()
        if not dept:
            dept = Department(name=dname)
            db.add(dept)
            db.commit()
            db.refresh(dept)
        departments.append(dept)

    # Some basic employees
    existing_emps = db.query(Employee).all()
    if len(existing_emps) < 10:
        names = ["Alice Smith", "Bob Jones", "Charlie Brown", "Diana Prince", "Eve Adams", "Frank Castle", "George Lucas", "Hannah Montana"]
        for name in names:
            emp = db.query(Employee).filter(Employee.name == name).first()
            if not emp:
                dept = random.choice(departments)
                new_emp = Employee(
                    email=f"{name.split()[0].lower()}@performpro.com",
                    name=name,
                    role="Staff",
                    status="Active",
                    department_id=dept.id,
                    performance_score=random.uniform(55.0, 95.0)
                )
                db.add(new_emp)
        db.commit()
    
    # Check existing employees, assign department if none
    employees = db.query(Employee).all()
    for emp in employees:
        if emp.department_id is None:
            emp.department_id = random.choice(departments).id
        if emp.performance_score is None:
            emp.performance_score = random.uniform(60.0, 90.0)
    db.commit()
    
    # Generate past 12 months of appraisals for ALL employees
    employees = db.query(Employee).all()
    today = datetime.utcnow()
    for i in range(12):
        month_date = today - timedelta(days=30.44 * i)
        for emp in employees:
            if random.random() < 0.8:  # 80% chance to have an appraisal that month
                rating = random.uniform(50.0, 95.0) / 10.0 # Rating typically 0-10 based on frontend expect? Frontend Trend chart uses domain 0-100? Wait.
                # In backend analytics_service.py: "month_scores[key].append(float(rating))", "avg = sum(ratings) / len(ratings)", 
                # "result.append({"month": month_abbr, "score": round(avg * 10, 1)})" --> meaning backend rating is 0-10, and it multiplies by 10 to get 0-100!
                appraisal_rating = random.uniform(5.5, 9.8) 
                
                appr = Appraisal(
                    employee_id=emp.id,
                    rating=appraisal_rating,
                    status="Approved",
                    cycle=f"M-{month_date.strftime('%Y-%m')}",
                    date=month_date,
                    created_at=month_date
                )
                db.add(appr)
    
    # Create some KPIs
    for emp in employees:
        k = KPI(
            employee_id=emp.id, 
            skill_score=random.randint(60, 98), 
            feedback_score=random.randint(60, 98), 
            final_kpi_score=random.randint(60, 95)
        )
        db.add(k)
        
    db.commit()
    print("Seed complete.")
    
try:
    db.query(Appraisal).delete()
    db.query(KPI).delete()
    db.commit()
    generate_data()
finally:
    db.close()
