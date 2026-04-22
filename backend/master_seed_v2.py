import sys
import os
from sqlalchemy.orm import Session
from sqlalchemy import text
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
    print("🚀 Starting Hardened Master Seed (Full Production Recovery)...")
    db = SessionLocal()
    try:
        # 1. Clear existing data in CORRECT ORDER to avoid FK errors
        # Using execute(text(...)) to handle dependencies safely
        print("🗑 Cleaning database for fresh start...")
        
        # Disable FK checks for the wipe (SQLite specific, but safe for Postgres if done by table)
        # For Postgres we just delete in order.
        tables = ["appraisals", "goals", "feedback", "notifications", "employees"]
        for table in tables:
            try:
                db.execute(text(f"DELETE FROM {table}"))
                print(f"  - Cleared {table}")
            except Exception as e:
                print(f"  - Skip {table} (likely missing): {e}")
        
        # Delete everyone except the main admin
        db.query(User).filter(User.email != "admin@performpro.com").delete(synchronize_session=False)
        db.commit()

        # 2. Re-create main Admin if missing (Password: Admin@123)
        admin = db.query(User).filter(User.email == "admin@performpro.com").first()
        if not admin:
            admin = User(email="admin@performpro.com", hashed_password=get_password_hash("Admin@123"), role=RoleEnum.ADMIN)
            db.add(admin)
            db.commit()
            db.refresh(admin)

        # 3. Create Departments
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

        # 4. Create Managers
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

        # 5. Create 31 realistic Employees
        print(f"👥 Generating 31 employees...")
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
                role=f"Staff Scientist {random.randint(1,4)}", 
                status="Active",
                performance_score=random.uniform(75.0, 98.0),
                date_joined=datetime.now() - timedelta(days=random.randint(30, 730))
            )
            db.add(e)
            db.commit()
            db.refresh(e)
            all_emps.append(e)

        # 6. Seed Appraisals and Goals (to populate those graphs!)
        print("📊 Seeding Appraisals/Goals for analytics...")
        for e in all_emps:
            # Add an appraisal for everyone to show data on charts
            app = Appraisal(
                employee_id=e.id,
                status="Approved" if random.random() > 0.3 else "Pending Manager",
                comments=f"Review for {e.name}. Great teamwork.",
                cycle="Q1 2026",
                rating=random.uniform(7.5, 9.5),
                date=datetime.now() - timedelta(days=random.randint(1, 90))
            )
            db.add(app)
            
            goal = Goal(
                employee_id=e.id,
                title=f"KPI Progress {random.randint(100,500)}",
                description="Maintain high engagement scores.",
                status="In Progress",
                due_date=datetime.now() + timedelta(days=90)
            )
            db.add(goal)

        db.commit()
        print(f"✅ FINAL SUCCESS! Database restored with 31+ employees and full matching data.")

    except Exception as e:
        print(f"❌ Master Seed FAILED: {e}")
        db.rollback()
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    master_seed()
