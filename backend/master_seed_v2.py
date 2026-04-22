import sys
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
        # 1. Clear existing data to avoid conflicts
        print("🗑 Cleaning database for fresh start...")
        db.query(Appraisal).delete()
        db.query(Goal).delete()
        db.query(Employee).delete()
        db.query(User).filter(User.role != RoleEnum.ADMIN).delete()
        db.commit()

        # 2. Re-create Admin (if missing)
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
            u = User(email=email, hashed_password=get_password_hash("Admin123!"), role=RoleEnum.MANAGER)
            db.add(u)
            db.commit()
            db.refresh(u)
            e = Employee(user_id=u.id, department_id=d_id, name=name, email=email, role=role, status="Active")
            db.add(e)
            db.commit()
            db.refresh(e)
            managers.append(e)

        # 5. Create 31 realistic Employees
        print(f"👥 Generating 31 employees across {len(depts)} departments...")
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
                role=f"Professional Level {random.randint(1,4)}", 
                status="Active",
                performance_score=random.uniform(70.0, 95.0),
                date_joined=datetime.now() - timedelta(days=random.randint(30, 365))
            )
            db.add(e)
            db.commit()
            db.refresh(e)
            all_emps.append(e)

        # 6. Seed Appraisals (Pending Manager and Approved)
        print("📝 Seeding Appraisals and Goals...")
        for e in all_emps[:15]:
            status = "Pending Manager" if random.random() > 0.4 else "Approved"
            app = Appraisal(
                employee_id=e.id,
                status=status,
                comments=f"Review for Q1 2026. Performing well in core tasks.",
                cycle="Q1 2026",
                rating=8.0 if status == "Approved" else None
            )
            db.add(app)
        
        # 7. Seed Goals
        for e in all_emps:
            goal = Goal(
                employee_id=e.id,
                title=f"Strategic Objective for {e.name}",
                description="Contribute to organizational growth through excellence.",
                status="Pending" if random.random() > 0.5 else "In Progress"
            )
            db.add(goal)

        db.commit()
        print(f"✅ Success! Master Seed complete. Database now has 31+ employees, {len(managers)} managers, and full data.")

    except Exception as e:
        print(f"❌ Error during master seed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    master_seed()
