from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.goal import Goal
from app.models.appraisal import Appraisal
from app.models.feedback import Feedback
from app.models.employee import Employee
from typing import Dict

class PerformanceService:
    @staticmethod
    def calculate_kpi(db: Session, employee_id: int) -> Dict:
        # 1. Goal Progress (40%)
        avg_progress = db.query(func.avg(Goal.progress)).filter(Goal.employee_id == employee_id).scalar() or 0
        
        # 2. Appraisal Rating (40%) - Appraisal rating is 1-10, scale to 0-100
        avg_rating = db.query(func.avg(Appraisal.rating)).filter(Appraisal.employee_id == employee_id, Appraisal.status == "Approved").scalar() or 0
        rating_score = avg_rating * 10
        
        # 3. Manager Feedback (20%) - Sentiment based: Positive=100, Neutral=50, Negative=0
        feedbacks = db.query(Feedback.sentiment).filter(Feedback.employee_id == employee_id).all()
        if feedbacks:
            sentiment_map = {"Positive": 100, "Neutral": 50, "Negative": 0}
            total_feedback_score = sum(sentiment_map.get(f[0], 50) for f in feedbacks)
            avg_feedback_score = total_feedback_score / len(feedbacks)
        else:
            avg_feedback_score = 50 # Default to neutral
            
        kpi_score = (avg_progress * 0.4) + (rating_score * 0.4) + (avg_feedback_score * 0.2)
        
        # Update employee record with raw score
        emp = db.query(Employee).filter(Employee.id == employee_id).first()
        if emp:
            emp.performance_score = round(float(kpi_score), 2)
            db.commit()
            
        return {
            "employee_id": employee_id,
            "kpi_score": round(float(kpi_score), 2),
            "breakdown": {
                "goals": round(float(avg_progress), 2),
                "appraisals": round(float(rating_score), 2),
                "feedback": round(float(avg_feedback_score), 2)
            }
        }

performance_service = PerformanceService()
