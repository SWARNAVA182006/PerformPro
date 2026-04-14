"""
Sahayak Chatbot API – /chatbot/query
Provides live summarized data for the intelligent frontend chat assistant.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
import datetime

from app.database import get_db
from app.api.dependencies import get_current_user

router = APIRouter()


class ChatbotQueryRequest(BaseModel):
    intent: str  # "goals" | "appraisals" | "dashboard" | "notifications" | "performance"


@router.post("/query")
def chatbot_query(
    body: ChatbotQueryRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Returns summarized live data for the Sahayak frontend brain.
    All data is scoped to the authenticated user's permissions.
    """
    intent = body.intent.lower()

    # ── Goals ─────────────────────────────────────────────────────────────
    if intent == "goals":
        try:
            from app.models import Goal, Employee
            emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
            if not emp:
                return {"intent": "goals", "data": {"total": 0, "pending": 0, "in_progress": 0, "completed": 0}}

            # Employees see only their goals; managers/admins see team goals
            if current_user.role in ("Admin", "Manager"):
                goals_q = db.query(Goal)
                if current_user.role == "Manager":
                    # Only goals of employees in same department
                    dept_emps = db.query(Employee).filter(Employee.department_id == emp.department_id).all()
                    emp_ids = [e.id for e in dept_emps]
                    goals_q = goals_q.filter(Goal.employee_id.in_(emp_ids))
            else:
                goals_q = db.query(Goal).filter(Goal.employee_id == emp.id)

            all_goals = goals_q.all()
            return {
                "intent": "goals",
                "data": {
                    "total":       len(all_goals),
                    "pending":     sum(1 for g in all_goals if g.status and g.status.lower() in ("pending", "pending approval")),
                    "in_progress": sum(1 for g in all_goals if g.status and g.status.lower() in ("in progress", "in_progress", "active", "approved")),
                    "completed":   sum(1 for g in all_goals if g.status and g.status.lower() in ("completed", "complete", "done")),
                    "denied":      sum(1 for g in all_goals if g.status and g.status.lower() in ("denied", "rejected")),
                }
            }
        except Exception as e:
            return {"intent": "goals", "data": {}, "error": str(e)}

    # ── Appraisals ────────────────────────────────────────────────────────
    elif intent == "appraisals":
        try:
            from app.models import Appraisal, Employee
            emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
            if not emp:
                return {"intent": "appraisals", "data": {"total": 0, "pending": 0, "approved": 0}}

            if current_user.role in ("Admin", "Manager"):
                appr_q = db.query(Appraisal)
                if current_user.role == "Manager":
                    dept_emps = db.query(Employee).filter(Employee.department_id == emp.department_id).all()
                    emp_ids = [e.id for e in dept_emps]
                    appr_q = appr_q.filter(Appraisal.employee_id.in_(emp_ids))
            else:
                appr_q = db.query(Appraisal).filter(Appraisal.employee_id == emp.id)

            all_appr = appr_q.all()
            ratings  = [a.rating for a in all_appr if a.rating is not None]
            avg_rating = round(sum(ratings) / len(ratings), 1) if ratings else None

            return {
                "intent": "appraisals",
                "data": {
                    "total":       len(all_appr),
                    "pending":     sum(1 for a in all_appr if a.status and "pending" in a.status.lower()),
                    "approved":    sum(1 for a in all_appr if a.status and a.status.lower() == "approved"),
                    "rejected":    sum(1 for a in all_appr if a.status and a.status.lower() in ("rejected", "denied")),
                    "avg_rating":  avg_rating,
                }
            }
        except Exception as e:
            return {"intent": "appraisals", "data": {}, "error": str(e)}

    # ── Notifications ─────────────────────────────────────────────────────
    elif intent == "notifications":
        try:
            from app.models import Notification
            unread = db.query(Notification).filter(
                Notification.user_id == current_user.id,
                Notification.is_read == False
            ).count()
            return {"intent": "notifications", "data": {"unread": unread}}
        except Exception as e:
            return {"intent": "notifications", "data": {"unread": 0}, "error": str(e)}

    # ── Dashboard Summary ──────────────────────────────────────────────────
    elif intent == "dashboard":
        try:
            from app.models import Employee, Goal, Appraisal
            emp_count  = db.query(Employee).count()
            goal_count = db.query(Goal).count()
            appr_count = db.query(Appraisal).count()
            return {
                "intent": "dashboard",
                "data": {
                    "total_employees":  emp_count,
                    "total_goals":      goal_count,
                    "total_appraisals": appr_count,
                }
            }
        except Exception as e:
            return {"intent": "dashboard", "data": {}, "error": str(e)}

    # ── Unknown intent ─────────────────────────────────────────────────────
    return {
        "intent": intent,
        "data": {},
        "message": f"Intent '{intent}' not handled server-side — frontend brain handles this."
    }


@router.get("/ping")
def chatbot_health():
    """Health check for the chatbot endpoint."""
    return {"status": "Sahayak online", "timestamp": datetime.datetime.utcnow().isoformat()}
