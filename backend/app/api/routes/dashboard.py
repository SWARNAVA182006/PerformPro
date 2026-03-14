from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.employee import Employee
from app.models.kpi import KPI
from app.models.skill import Skill
from app.models.feedback import Feedback
from app.models.appraisal import Appraisal
from app.models.department import Department
from app.services.activity_service import activity_service

router = APIRouter()

@router.get("/dashboard")
def get_dashboard_analytics(db: Session = Depends(get_db)):
    workforce_total = db.query(Employee).filter(Employee.status == "Active").count()
    
    # Average KPI score
    avg_kpi = db.query(func.avg(KPI.final_kpi_score)).scalar() or 0
    
    # Active Appraisals
    active_appraisals = db.query(Appraisal).filter(Appraisal.status.in_(["Pending Manager", "Pending self_review"])).count()
    
    # Top Performers
    top_performers_db = db.query(Employee).order_by(Employee.performance_score.desc()).limit(5).all()
    top_performers = [{"id": emp.id, "name": emp.name, "score": emp.performance_score, "role": emp.role} for emp in top_performers_db]

    return {
        "success": True,
        "data": {
            "workforce_total": workforce_total,
            "avg_kpi": round(avg_kpi, 1),
            "active_appraisals": active_appraisals,
            "top_performers": top_performers
        }
    }

@router.get("/performance-trends")
def get_performance_trends(db: Session = Depends(get_db)):
    # Simulating monthly aggregation due to SQLite limitations with date truncation.
    # In a production PostgreSQL DB, you'd use `date_trunc('month', date)`.
    # For now, we will return a static set of historical data + the current Live Avg KPI.
    
    avg_kpi = db.query(func.avg(KPI.final_kpi_score)).scalar() or 88
    
    return {
        "success": True,
        "data": [
            {"name": "Jan", "performance": 65},
            {"name": "Feb", "performance": 75},
            {"name": "Mar", "performance": 85},
            {"name": "Apr", "performance": 80},
            {"name": "May", "performance": 90},
            {"name": "Jun", "performance": round(avg_kpi, 1)}
        ]
    }

@router.get("/activity-feed")
def get_activity_feed(db: Session = Depends(get_db)):
    activities = activity_service.get_recent_activities(db, limit=10)
    return {
        "success": True,
        "data": activities
    }

@router.get("/department-engagement")
def get_department_engagement(db: Session = Depends(get_db)):
    departments = db.query(Department).all()
    data = []
    
    for dept in departments:
        # Calculate avg performance for this department
        dept_avg = db.query(func.avg(Employee.performance_score)).filter(Employee.department_id == dept.id).scalar() or 0
        
        data.append({
            "name": dept.name,
            "engagement": min(100, round(dept_avg + 5, 1)), # Mock engagement based on performance
            "performance": round(dept_avg, 1)
        })
        
    # If no departments, provide dummy fallback so the chart doesn't crash during development
    if not data:
        data = [
            {"name": "Engineering", "engagement": 85, "performance": 90},
            {"name": "Sales", "engagement": 78, "performance": 82},
            {"name": "HR", "engagement": 92, "performance": 88}
        ]
        
    return {
        "success": True,
        "data": data
    }
