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
        {"email": "client@performpro.com", "role": RoleEnum.CLIENT, "name": "External Client"},
    ]
    
    password = "Admin123!"
    hashed_password = get_password_hash(password)
    
    print("--- Setting up Role Credentials ---")
    for acc in accounts:
        user = db.query(User).filter(User.email == acc["email"]).first()
        if not user:
            user = User(email=acc["email"], hashed_password=hashed_password, role=acc["role"])
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"Created User: {acc['email']} with role: {acc['role']}")
        else:
            user.hashed_password = hashed_password
            user.role = acc["role"]
            db.commit()
            print(f"Updated User: {acc['email']} with role: {acc['role']}")
            
        # Ensure Employee Profile exists for all roles if necessary (or just link it)
        emp = db.query(Employee).filter(Employee.user_id == user.id).first()
        if not emp:
            emp = Employee(
                user_id=user.id,
                email=acc["email"],
                name=acc["name"],
                role=acc["role"].value if acc["role"] != RoleEnum.CLIENT else "Client",
                status="Active",
                performance_score=80.0
            )
            db.add(emp)
            db.commit()
            print(f"Created Profile for: {acc['email']}")
        else:
            emp.name = acc["name"]
            emp.role = acc["role"].value if acc["role"] != RoleEnum.CLIENT else "Client"
            db.commit()
            print(f"Updated Profile for: {acc['email']}")

    print("--- Credentials Standardized Successfully ---")

except Exception as e:
    print(f"Error: {e}")
    db.rollback()
finally:
    db.close()
