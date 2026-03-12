import os
import sys
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models.user import User, RoleEnum
from app.models.department import Department
from app.models.employee import Employee
from app.core.security import get_password_hash

def seed_database():
    print("Initiating database seed process...")
    db = SessionLocal()
    try:
        # Check if admin already exists
        admin_user = db.query(User).filter(User.email == "admin@performpro.com").first()
        if not admin_user:
            print("Creating Admin user...")
            admin_user = User(
                email="admin@performpro.com",
                hashed_password=get_password_hash("Admin@123"),
                role=RoleEnum.ADMIN
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
        else:
            print("Admin user already exists.")

        # Create Departments
        engineering = db.query(Department).filter(Department.name == "Engineering").first()
        if not engineering:
            print("Creating Engineering department...")
            engineering = Department(name="Engineering", description="Software Development Team")
            db.add(engineering)
            db.commit()
            db.refresh(engineering)
            
        sales = db.query(Department).filter(Department.name == "Sales").first()
        if not sales:
            print("Creating Sales department...")
            sales = Department(name="Sales", description="Enterprise Sales Team")
            db.add(sales)
            db.commit()
            db.refresh(sales)

        # Create Managers
        eng_manager = db.query(User).filter(User.email == "eng.manager@performpro.com").first()
        if not eng_manager:
            print("Creating Engineering Manager...")
            eng_manager = User(
                email="eng.manager@performpro.com",
                hashed_password=get_password_hash("Manager@123"),
                role=RoleEnum.MANAGER
            )
            db.add(eng_manager)
            db.commit()
            db.refresh(eng_manager)
            
            eng_mgr_profile = Employee(
                user_id=eng_manager.id,
                department_id=engineering.id,
                name="Sarah Connor",
                email="eng.manager@performpro.com",
                role="Engineering Manager",
                status="Active"
            )
            db.add(eng_mgr_profile)
            db.commit()
            db.refresh(eng_mgr_profile)

        sales_manager = db.query(User).filter(User.email == "sales.manager@performpro.com").first()
        if not sales_manager:
            print("Creating Sales Manager...")
            sales_manager = User(
                email="sales.manager@performpro.com",
                hashed_password=get_password_hash("Manager@123"),
                role=RoleEnum.MANAGER
            )
            db.add(sales_manager)
            db.commit()
            db.refresh(sales_manager)
            
            sales_mgr_profile = Employee(
                user_id=sales_manager.id,
                department_id=sales.id,
                name="John Smith",
                email="sales.manager@performpro.com",
                role="Sales Director",
                status="Active"
            )
            db.add(sales_mgr_profile)
            db.commit()
            db.refresh(sales_mgr_profile)

        # Create Employees
        eng_dev = db.query(User).filter(User.email == "dev1@performpro.com").first()
        if not eng_dev:
            print("Creating Engineering Employee 1...")
            eng_dev = User(
                email="dev1@performpro.com",
                hashed_password=get_password_hash("Employee@123"),
                role=RoleEnum.EMPLOYEE
            )
            db.add(eng_dev)
            db.commit()
            db.refresh(eng_dev)
            
            # Fetch the manager profile ID correctly
            eng_mgr_profile = db.query(Employee).filter(Employee.user_id == eng_manager.id).first()
            
            dev1_profile = Employee(
                user_id=eng_dev.id,
                department_id=engineering.id,
                manager_id=eng_mgr_profile.id if eng_mgr_profile else None,
                name="Robert Downey",
                email="dev1@performpro.com",
                role="Senior Developer",
                status="Active",
                performance_score=85.5
            )
            db.add(dev1_profile)
            db.commit()

        print("Database seeding completed successfully.")

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
