from app.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

db = SessionLocal()
try:
    user = db.query(User).filter(User.email == "admin@performpro.com").first()
    if user:
        user.hashed_password = get_password_hash("Admin123!")
        db.commit()
        print("Password reset success for admin@performpro.com")
    else:
        print("User not found")
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
