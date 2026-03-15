from app.database import SessionLocal
from app.models.user import User
from app.models.employee import Employee
from app.models.appraisal import Appraisal

db = SessionLocal()
try:
    users = db.query(User).limit(5).all()
    print("--- RECENT USERS ---")
    for u in users:
        print(f"Email: {u.email}, Role: {u.role}")
    
    employees = db.query(Employee).limit(5).all()
    print("\n--- RECENT EMPLOYEES ---")
    for e in employees:
        print(f"ID: {e.id}, Name: {e.name}, Score: {e.performance_score}")

    appraisals = db.query(Appraisal).limit(5).all()
    print("\n--- RECENT APPRAISALS ---")
    for a in appraisals:
        print(f"ID: {a.id}, EmpID: {a.employee_id}, Rating: {a.rating}")

except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
