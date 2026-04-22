from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.api.dependencies import get_current_user, require_role
from app.models.user import User, RoleEnum
from app.models.employee import Employee
from app.models.goal import Goal
from app.services.goal_service import goal_service
from app.services.performance_service import performance_service
from app.services.notification_service import notification_service
from app.services.audit_service import audit_service

from pydantic import BaseModel, validator
from datetime import datetime
from typing import List, Optional

router = APIRouter()

class GoalCreate(BaseModel):
    employee_id: int
    title: str
    target: str
    deadline: datetime

class GoalUpdate(BaseModel):
    title: Optional[str] = None
    target: Optional[str] = None
    deadline: Optional[datetime] = None
    progress: Optional[int] = None
    status: Optional[str] = None

class GoalResponse(BaseModel):
    id: int
    employee_id: int
    title: str
    target: str
    progress: int = 0
    deadline: datetime
    status: str
    created_at: datetime

    @validator('progress', pre=True, always=True)
    def coerce_progress(cls, v):
        return v if v is not None else 0

    class Config:
        from_attributes = True

@router.post("/", response_model=dict)
def create_goal(
    goal_in: GoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.EMPLOYEE]))
):
    deadline_date = goal_in.deadline
    if isinstance(deadline_date, str):
        try:
            deadline_date = datetime.fromisoformat(deadline_date.replace('Z', '+00:00'))
        except Exception:
            try:
                deadline_date = datetime.strptime(deadline_date, "%Y-%m-%d")
            except Exception:
                raise HTTPException(status_code=400, detail="Invalid deadline format. Use YYYY-MM-DD.")

    goal = goal_service.create_goal(
        db=db,
        employee_id=goal_in.employee_id,
        title=goal_in.title,
        target=goal_in.target,
        deadline=deadline_date
    )
    goal.status = "Pending"
    db.commit()
    db.refresh(goal)
    
    # Notify Manager
    emp = db.query(Employee).filter(Employee.id == goal.employee_id).first()
    if emp and emp.manager_id:
        mgr = db.query(Employee).filter(Employee.id == emp.manager_id).first()
        if mgr and mgr.user_id:
            notification_service.create_notification(
                db, 
                user_id=mgr.user_id, 
                title="New Goal Created", 
                message=f"{emp.name} created a new goal: {goal.title}"
            )
            
    # Audit Log
    audit_service.log_action(db, current_user.id, "created", "Goal", goal.id, {"title": goal.title})

    return {"success": True, "data": GoalResponse.from_orm(goal).dict(), "message": "Goal created and pending approval"}

@router.get("/", response_model=dict)
def get_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([RoleEnum.ADMIN, RoleEnum.MANAGER]))
):
    if current_user.role == RoleEnum.ADMIN:
        # Admins see everything
        goals = db.query(Goal).order_by(Goal.created_at.desc()).all()
    elif current_user.role == RoleEnum.MANAGER and current_user.employee_profile:
        emp_id = current_user.employee_profile.id
        dept_id = current_user.employee_profile.department_id
        from sqlalchemy import or_

        # Manager Visibility Algorithm (3-tier):
        # Tier 1: Employees who explicitly report to this manager
        # Tier 2: Employees in same department (if dept is set)
        # Tier 3: Employees with NO manager assigned (unassigned pool) — visible to all managers
        conditions = [Employee.manager_id == emp_id, Employee.manager_id.is_(None)]
        if dept_id:
            conditions.append(Employee.department_id == dept_id)

        goals = db.query(Goal).join(Employee).filter(
            or_(*conditions)
        ).order_by(Goal.created_at.desc()).all()
    else:
        goals = []

    return {"success": True, "data": [GoalResponse.from_orm(g).dict() for g in goals], "message": "Goals retrieved"}

@router.get("/my", response_model=dict)
def get_my_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.employee_profile:
        raise HTTPException(status_code=400, detail="Employee profile not found")
    
    goals = db.query(Goal).filter(Goal.employee_id == current_user.employee_profile.id).all()
    return {"success": True, "data": [GoalResponse.from_orm(g).dict() for g in goals], "message": "My goals retrieved"}

@router.put("/{goal_id}", response_model=dict)
def update_goal(
    goal_id: int,
    goal_update: GoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    is_admin_or_manager = current_user.role in [RoleEnum.ADMIN, RoleEnum.MANAGER]

    # Explicitly load the employee profile from DB to avoid lazy-load failures
    employee_profile = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    is_owner = employee_profile is not None and employee_profile.id == goal.employee_id

    # Employees can only update their own goals
    if not is_admin_or_manager and not is_owner:
        raise HTTPException(status_code=403, detail="Not authorized to update this goal")

    # Employees can only update progress on Approved goals
    if not is_admin_or_manager:
        if goal.status != "Approved":
            raise HTTPException(status_code=403, detail="You can only update progress on Approved goals")
        # Strip any fields employees cannot change (only progress allowed)
        allowed = {"progress"}
        forbidden = set(goal_update.dict(exclude_unset=True).keys()) - allowed
        if forbidden:
            raise HTTPException(status_code=403, detail=f"Employees cannot update fields: {', '.join(forbidden)}")

    # Validate progress bounds
    if goal_update.progress is not None:
        if goal_update.progress < 0 or goal_update.progress > 100:
            raise HTTPException(status_code=400, detail="Progress must be between 0 and 100")
        goal_service.update_goal_progress(db, goal_id, goal_update.progress)
        goal = db.query(Goal).filter(Goal.id == goal_id).first()
        # Trigger KPI update (non-blocking)
        try:
            performance_service.calculate_kpi(db, goal.employee_id)
        except Exception:
            pass

    update_data = goal_update.dict(exclude_unset=True)
    if "progress" in update_data:
        del update_data["progress"]

    for key, value in update_data.items():
        setattr(goal, key, value)

    db.commit()
    db.refresh(goal)
    return {"success": True, "data": GoalResponse.from_orm(goal).dict(), "message": "Goal updated"}

@router.put("/{goal_id}/approve", response_model=dict)
def approve_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([RoleEnum.ADMIN, RoleEnum.MANAGER]))
):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    goal.status = "Approved"
    db.commit()
    db.refresh(goal)

    # Notify Employee (non-blocking)
    try:
        emp = db.query(Employee).filter(Employee.id == goal.employee_id).first()
        if emp and emp.user_id:
            notification_service.create_notification(
                db,
                user_id=emp.user_id,
                title="Goal Approved",
                message=f"Your goal '{goal.title}' has been approved and is now active."
            )
    except Exception:
        pass

    # Audit Log (non-blocking)
    try:
        audit_service.log_action(db, current_user.id, "approved", "Goal", goal.id, {"title": goal.title})
    except Exception:
        pass

    return {"success": True, "data": GoalResponse.from_orm(goal).dict(), "message": "Goal approved"}

@router.put("/{goal_id}/deny", response_model=dict)
def deny_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([RoleEnum.ADMIN, RoleEnum.MANAGER]))
):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    goal.status = "Rejected"
    db.commit()
    db.refresh(goal)

    # Notify Employee (non-blocking)
    try:
        emp = db.query(Employee).filter(Employee.id == goal.employee_id).first()
        if emp and emp.user_id:
            notification_service.create_notification(
                db,
                user_id=emp.user_id,
                title="Goal Rejected",
                message=f"Your goal '{goal.title}' has been rejected by your manager."
            )
    except Exception:
        pass

    # Audit Log (non-blocking)
    try:
        audit_service.log_action(db, current_user.id, "rejected", "Goal", goal.id, {"title": goal.title})
    except Exception:
        pass

    return {"success": True, "data": GoalResponse.from_orm(goal).dict(), "message": "Goal rejected"}

@router.put("/{goal_id}/complete", response_model=dict)
def complete_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
        
    goal.status = "Completed"
    goal.progress = 100
    db.commit()
    
    # Trigger KPI update
    performance_service.calculate_kpi(db, goal.employee_id)

    # Audit Log
    audit_service.log_action(db, current_user.id, "completed", "Goal", goal.id, {"title": goal.title})

    return {"success": True, "data": GoalResponse.from_orm(goal).dict(), "message": "Goal marked as completed"}

@router.delete("/{goal_id}", response_model=dict)
def delete_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
        
    is_admin_or_manager = current_user.role in [RoleEnum.ADMIN, RoleEnum.MANAGER]
    is_owner = current_user.employee_profile and current_user.employee_profile.id == goal.employee_id
    
    if not is_admin_or_manager:
        if not is_owner:
            raise HTTPException(status_code=403, detail="Not authorized to delete this goal")
        if goal.status != "Pending":
            raise HTTPException(status_code=403, detail="Employees can only withdraw Pending goals")
            
    db.delete(goal)
    db.commit()
    return {"success": True, "data": None, "message": "Goal deleted successfully"}
