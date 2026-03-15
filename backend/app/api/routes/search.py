from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.employee import Employee
from app.models.department import Department
from app.models.goal import Goal
from app.models.appraisal import Appraisal

router = APIRouter()

@router.get("/", response_model=dict)
def search_global(
    q: str = Query("", alias="query"), 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    if not q:
        return {"success": True, "data": []}
        
    search_term = f"%{q}%"
    results = []

    # 1. Employees (name, email)
    employees = db.query(Employee).filter(
        or_(Employee.name.ilike(search_term), Employee.email.ilike(search_term))
    ).limit(5).all()
    
    for emp in employees:
        results.append({
            "type": "Employee",
            "id": emp.id,
            "title": emp.name,
            "subtitle": emp.role,
            "detail": emp.email
        })

    # 2. Departments
    depts = db.query(Department).filter(
        or_(Department.name.ilike(search_term), Department.description.ilike(search_term))
    ).limit(3).all()
    for d in depts:
        results.append({
            "type": "Department",
            "id": d.id,
            "title": d.name,
            "subtitle": d.code,
            "detail": d.description[:30] + "..." if d.description else ""
        })

    # 3. Goals
    goals = db.query(Goal).filter(
        or_(Goal.title.ilike(search_term), Goal.target.ilike(search_term))
    ).limit(3).all()
    for g in goals:
        results.append({
            "type": "Goal",
            "id": g.id,
            "title": g.title,
            "subtitle": g.status,
            "detail": g.target
        })
        
    # 4. Appraisals
    appraisals = db.query(Appraisal).filter(
        or_(Appraisal.comments.ilike(search_term), Appraisal.status.ilike(search_term))
    ).limit(3).all()
    for a in appraisals:
        results.append({
            "type": "Appraisal",
            "id": a.id,
            "title": f"Review {a.cycle}",
            "subtitle": a.status,
            "detail": a.comments[:30] + "..." if a.comments else ""
        })


    return {"success": True, "data": results}
