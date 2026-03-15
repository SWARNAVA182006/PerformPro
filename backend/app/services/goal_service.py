from sqlalchemy.orm import Session
from datetime import datetime
from app.models.goal import Goal

class GoalService:
    @staticmethod
    def create_goal(db: Session, employee_id: int, title: str, target: str, deadline: datetime) -> Goal:
        goal = Goal(
            employee_id=employee_id,
            title=title,
            target=target,
            deadline=deadline,
            progress=0,
            status="Pending",
            created_at=datetime.utcnow()
        )
        db.add(goal)
        db.commit()
        db.refresh(goal)
        return goal

    @staticmethod
    def update_goal_progress(db: Session, goal_id: int, progress: int) -> Goal:
        goal = db.query(Goal).filter(Goal.id == goal_id).first()
        if goal:
            goal.progress = progress
            if progress >= 100:
                goal.status = "Completed"
            db.commit()
            db.refresh(goal)
        return goal

goal_service = GoalService()
