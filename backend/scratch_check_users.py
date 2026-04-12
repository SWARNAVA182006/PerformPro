from app.database import SessionLocal
from app.models.user import User, RoleEnum

db = SessionLocal()
try:
    roles_found = db.query(User.role).distinct().all()
    print("Roles found in database:", [r[0] for r in roles_found])
    
    users = db.query(User).all()
    for user in users:
        print(f"Email: {user.email}, Role: {user.role}")
finally:
    db.close()
