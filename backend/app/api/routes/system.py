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
    Emergency seed to ensure the manager portal has items to show in the deployed version.
    Sets 5 appraisals to 'Pending Manager' and 3 goals to 'Pending'.
    """
    try:
        # 1. Update Appraisals
        appraisals = db.query(Appraisal).limit(5).all()
        for a in appraisals:
            a.status = "Pending Manager"
            a.rating = None
            a.comments = "Awaiting manager review (System Seeded)"
        
        # 2. Update Goals
        goals = db.query(Goal).limit(3).all()
        for g in goals:
            g.status = "Pending"
            
        db.commit()
        return {"success": True, "message": f"Updated {len(appraisals)} appraisals and {len(goals)} goals to Pending status."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
def health_check():
    return {"status": "ok", "service": "PerformPro Backend"}
