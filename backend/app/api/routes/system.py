from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.appraisal import Appraisal
from app.models.goal import Goal
from app.models.employee import Employee
from app.models.user import User, RoleEnum
from app.api.dependencies import get_current_user

router = APIRouter()

@router.post("/seed-pending")
def seed_pending_data(db: Session = Depends(get_db)):
    """
    Emergency seed to ensure the manager portal has items to show.
    Updates existing or creates new pending data.
    """
    try:
        # Get a sample employee to attach data to
        emp = db.query(Employee).filter(Employee.email != "admin@performpro.com").first()
        if not emp:
            # Create a dummy employee if none exists
            from app.models.user import User, RoleEnum
            user = db.query(User).filter(User.email == "demo.emp@performpro.com").first()
            if not user:
                user = User(email="demo.emp@performpro.com", hashed_password="...", role=RoleEnum.EMPLOYEE)
                db.add(user)
                db.commit()
                db.refresh(user)
            
            emp = Employee(user_id=user.id, name="Demo Employee", email=user.email, status="Active")
            db.add(emp)
            db.commit()
            db.refresh(emp)

        # 1. Ensure some Appraisals exist
        appraisals = db.query(Appraisal).filter(Appraisal.status == "Pending Manager").all()
        if not appraisals:
            for i in range(3):
                new_app = Appraisal(
                    employee_id=emp.id,
                    status="Pending Manager",
                    comments=f"Self-assessment for period {i+1}. Outstanding performance in QE.",
                    cycle="H1-2026",
                    rating=8.0
                )
                db.add(new_app)
            db.commit()
            appraisals = db.query(Appraisal).filter(Appraisal.status == "Pending Manager").all()
        
        # 2. Ensure some Goals exist
        goals = db.query(Goal).filter(Goal.status == "Pending").all()
        if not goals:
            for i in range(2):
                new_goal = Goal(
                    employee_id=emp.id,
                    title=f"Strategic Objective {i+1}",
                    description="Implement high-availability architecture for PerformPro core.",
                    status="Pending"
                )
                db.add(new_goal)
            db.commit()
            goals = db.query(Goal).filter(Goal.status == "Pending").all()
            
        return {"success": True, "message": f"Ensured {len(appraisals)} pending appraisals and {len(goals)} pending goals exist."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/master-reset")
def master_reset_trigger():
    """Triggers the full workforce restoration (31 employees)."""
    try:
        from master_seed_v2 import master_seed
        master_seed()
        return {"success": True, "message": "Database recovered! 31 employees and all analytics data restored."}
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"MASTER RESET ERROR: {error_details}")
        raise HTTPException(
            status_code=500, 
            detail=f"Master Reset Failed: {str(e)}\n{error_details}"
        )

@router.get("/health")
def health_check():
    return {"status": "ok", "service": "PerformPro Backend"}
