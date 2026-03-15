from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.employee import Employee
from app.models.kpi import KPI
from app.models.appraisal import Appraisal
from app.services.dashboard_service import dashboard_service

router = APIRouter()

@router.get("/metrics")
def get_dashboard_metrics(db: Session = Depends(get_db)):
    metrics = dashboard_service.get_metrics(db)
    return {
        "success": True,
        "data": metrics,
        "message": "Dashboard metrics retrieved",
        "pagination": None
    }

@router.get("/activity")
def get_dashboard_activity(
    db: Session = Depends(get_db),
    limit: int = 10
):
    from app.models.notification import Notification
    activities = db.query(Notification).order_by(Notification.created_at.desc()).limit(limit).all()
    
    return {
        "success": True,
        "data": [
            {
                "action": a.title,
                "entity": "System",
                "entity_id": a.id,
                "timestamp": a.created_at
            } for a in activities
        ]
    }
