from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.employee import Employee
from app.models.kpi import KPI
from app.models.skill import Skill
from app.models.feedback import Feedback
from app.services.activity_service import activity_service

router = APIRouter()

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_employees = db.query(Employee).count()
    
    # Average KPI score
    avg_performance = db.query(func.avg(KPI.final_kpi_score)).scalar() or 0
    
    total_skills = db.query(Skill).count()
    total_feedback = db.query(Feedback).count()
    
    # Recent activities (powered by AuditLog)
    activities = activity_service.get_recent_activities(db, limit=5)

    return {
        "stats": [
            {"title": "Total Employees", "value": str(total_employees), "trend": "up", "trendValue": "100%"},
            {"title": "Avg Performance", "value": f"{round(avg_performance)}%", "trend": "up", "trendValue": "5%"},
            {"title": "Skills Tracked", "value": str(total_skills), "trend": "up", "trendValue": "New"},
            {"title": "Recent Feedback", "value": str(total_feedback), "trend": "up", "trendValue": "New"},
        ],
        "activities": activities,
        "trends": [
            {"name": "Jan", "performance": 65},
            {"name": "Feb", "performance": 75},
            {"name": "Mar", "performance": 85},
            {"name": "Apr", "performance": 80},
            {"name": "May", "performance": 90},
            {"name": "Jun", "performance": avg_performance or 88}
        ]
    }
