from app.database import SessionLocal
from app.models.user import User, RoleEnum
from app.models.employee import Employee
from app.core.security import get_password_hash

db = SessionLocal()
try:
    accounts = [
        {"email": "admin@performpro.com", "role": RoleEnum.ADMIN, "name": "System Admin"},
        {"email": "manager@performpro.com", "role": RoleEnum.MANAGER, "name": "Team Manager"},
        {"email": "employee@performpro.com", "role": RoleEnum.EMPLOYEE, "name": "Regular Employee"},
    ]
    
    password = "Admin123!"
    hashed_password = get_password_hash(password)
    
    print("--- Standardizing Credentials ---")
    for acc in accounts:
        user = db.query(User).filter(User.email == acc["email"]).first()
        if not user:
            user = User(email=acc["email"], hashed_password=hashed_password, role=acc["role"])
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"Created User: {acc['email']}")
        else:
            user.hashed_password = hashed_password
            user.role = acc["role"]
            db.commit()
            print(f"Updated User: {acc['email']}")
            
        # Ensure Employee Profile exists
        emp = db.query(Employee).filter(Employee.user_id == user.id).first()
        if not emp:
            # Check if an employee with this email already exists but unlinked
            emp = db.query(Employee).filter(Employee.email == acc["email"]).first()
            if emp:
                emp.user_id = user.id
                emp.name = acc["name"]
                emp.role = acc["role"].value
            else:
                emp = Employee(
                    user_id=user.id,
                    email=acc["email"],
                    name=acc["name"],
                    role=acc["role"].value,
                    status="Active",
                    performance_score=75.0 if acc["role"] == RoleEnum.EMPLOYEE else 85.0
                )
                db.add(emp)
            db.commit()
            print(f"Linked/Created Employee Profile for: {acc['email']}")
        else:
            emp.name = acc["name"]
            emp.role = acc["role"].value
            db.commit()
            print(f"Confirmed Employee Profile for: {acc['email']}")

except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
