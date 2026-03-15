from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.employee import Employee
from app.models.appraisal import Appraisal
from app.models.department import Department
from app.api.dependencies import get_current_user
from app.models.user import User
from app.services.analytics_service import analytics_service
import calendar

router = APIRouter()

@router.get("/performance")
def get_performance_analytics(db: Session = Depends(get_db)):
    data = analytics_service.get_performance_trends(db)
    return {"success": True, "data": data}

@router.get("/departments")
def get_department_analytics(db: Session = Depends(get_db)):
    data = analytics_service.get_department_performance(db)
    return {"success": True, "data": data}

@router.get("/appraisals")
def get_appraisal_analytics(db: Session = Depends(get_db)):
    results = db.query(
        func.strftime('%m', Appraisal.date).label('month_num'),
        func.count(Appraisal.id).label('count')
    ).group_by('month_num').order_by('month_num').all()

    data = []
    for r in results:
        if r.month_num:
            month_abbr = calendar.month_abbr[int(r.month_num)]
            data.append({"month": month_abbr, "count": r.count})

    return {"success": True, "data": data}

@router.get("/top-performers")
def get_top_performers_analytics(db: Session = Depends(get_db)):
    top = db.query(Employee).order_by(Employee.performance_score.desc()).limit(5).all()
    data = [{"name": emp.name, "score": emp.performance_score, "role": emp.role} for emp in top]
    return {"success": True, "data": data}

@router.get("/predict/{employee_id}")
def get_ai_prediction(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    AI-powered individual performance prediction.
    Uses linear regression on historical appraisals + feedback sentiment.
    """
    from app.models.user import RoleEnum
    # Access control: employees can only predict themselves
    if current_user.role == RoleEnum.EMPLOYEE:
        if not current_user.employee_profile or current_user.employee_profile.id != employee_id:
            raise HTTPException(status_code=403, detail="Can only predict your own performance")

    result = analytics_service.get_ai_prediction(db, employee_id)
    if not result:
        raise HTTPException(status_code=404, detail="Employee not found")

    return {"success": True, "data": result}

@router.get("/predict-me")
def get_my_ai_prediction(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """AI prediction for the currently authenticated user."""
    if not current_user.employee_profile:
        raise HTTPException(status_code=400, detail="No employee profile found")

    result = analytics_service.get_ai_prediction(db, current_user.employee_profile.id)
    if not result:
        raise HTTPException(status_code=404, detail="Could not generate prediction")

    return {"success": True, "data": result}

@router.get("/org-insights")
def get_org_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Organization-wide AI insights for admin/manager dashboards."""
    data = analytics_service.get_org_ai_insights(db)
    return {"success": True, "data": data}
