import sys
import os
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models.user import User, RoleEnum
from app.models.department import Department
from app.models.employee import Employee
from app.models.appraisal import Appraisal
from app.models.goal import Goal
from app.core.security import get_password_hash
import random
from datetime import datetime, timedelta

def master_seed():
    print("🚀 Starting Master Seed (Full Production Recovery)...")
    db = SessionLocal()
    try:
        # 1. Clear existing data in CORRECT ORDER to avoid FK errors
        print("🗑 Cleaning database for fresh start...")
        db.query(Appraisal).delete()
        db.query(Goal).delete()
        
        # Clear other tables if they exist
        try:
            from app.models.feedback import Feedback
            db.query(Feedback).delete()
        except: pass
        
        try:
            from app.models.notification import Notification
            db.query(Notification).delete()
        except: pass

        db.query(Employee).delete()
        # Delete everyone except the main admin we are logged in with
        db.query(User).filter(User.email != "admin@performpro.com").delete()
        db.commit()

        # 2. Ensure Departments exist
        depts = []
        dept_names = [
            ("Engineering", "Software Engineering & Architecture"),
            ("Sales", "Global Enterprise Sales"),
            ("Human Resources", "People & Culture"),
            ("Marketing", "Digital Growth & Brand"),
            ("Finance", "Fiscal Operations")
        ]
        for name, desc in dept_names:
            d = db.query(Department).filter(Department.name == name).first()
            if not d:
                d = Department(name=name, description=desc)
                db.add(d)
                db.commit()
                db.refresh(d)
            depts.append(d)

        # 3. Create Managers
        managers = []
        mgr_data = [
            ("Sarah Connor", "eng.manager@performpro.com", depts[0].id, "Engineering Manager"),
            ("John Smith", "sales.manager@performpro.com", depts[1].id, "Sales Director"),
            ("Team Manager", "manager@performpro.com", depts[0].id, "Squad Leader")
        ]
        for name, email, d_id, role in mgr_data:
            u = db.query(User).filter(User.email == email).first()
            if not u:
                u = User(email=email, hashed_password=get_password_hash("Admin123!"), role=RoleEnum.MANAGER)
                db.add(u)
                db.commit()
                db.refresh(u)
            
            e = db.query(Employee).filter(Employee.user_id == u.id).first()
            if not e:
                e = Employee(user_id=u.id, department_id=d_id, name=name, email=email, role=role, status="Active")
                db.add(e)
                db.commit()
                db.refresh(e)
            managers.append(e)

        # 4. Create 31 realistic Employees
        names = ["Alice", "Bob", "Charlie", "David", "Eve", "Frank", "Grace", "Heidi", "Ivan", "Judy", "Karl", "Leo", "Mona", "Nate", "Olivia", "Paul", "Quinn", "Rose", "Steve", "Tara", "Uma", "Victor", "Wendy", "Xander", "Yara", "Zack", "Liam", "Emma", "Noah", "Olivia", "Ava"]
        
        all_emps = []
        for i in range(len(names)):
            email = f"emp{i+1}@performpro.com"
            u = User(email=email, hashed_password=get_password_hash("Employee@123"), role=RoleEnum.EMPLOYEE)
            db.add(u)
            db.commit()
            db.refresh(u)
            
            dept = random.choice(depts)
            mgr = random.choice(managers)
            
            e = Employee(
                user_id=u.id, 
                department_id=dept.id, 
                manager_id=mgr.id, 
                name=names[i], 
                email=email, 
                role=f"Staff Level {random.randint(1,4)}", 
                status="Active",
                performance_score=random.uniform(70.0, 95.0),
                date_joined=datetime.now() - timedelta(days=random.randint(30, 365))
            )
            db.add(e)
            db.commit()
            db.refresh(e)
            all_emps.append(e)

        # 5. Seed Appraisals
        for e in all_emps[:20]:
            status = "Pending Manager" if random.random() > 0.4 else "Approved"
            app = Appraisal(
                employee_id=e.id,
                status=status,
                comments=f"Self-assessment for 2026. Performing exceeding expectations.",
                cycle="Q1 2026",
                rating=8.5 if status == "Approved" else None,
                date=datetime.now() - timedelta(days=random.randint(1, 60))
            )
            db.add(app)
        
        # 6. Seed Goals
        for e in all_emps:
            goal = Goal(
                employee_id=e.id,
                title=f"Global KPI {random.randint(100,999)}",
                description="Restore enterprise-grade performance tracking.",
                status="Pending" if random.random() > 0.5 else "In Progress"
            )
            db.add(goal)

        db.commit()
        print(f"✅ Success! Master Seed complete. 31 Employees restored.")

    except Exception as e:
        print(f"❌ Error during master seed: {e}")
        db.rollback()
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    master_seed()
