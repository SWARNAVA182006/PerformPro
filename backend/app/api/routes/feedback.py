from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.feedback import Feedback as FeedbackModel
from app.models.employee import Employee as EmployeeModel
from app.schemas import Feedback, FeedbackCreate
from typing import List
from app.services.notification_service import notification_service
from app.models.user import User as UserModel

router = APIRouter()

def analyze_sentiment(text: str) -> str:
    text = text.lower()
    positive = ["good", "excellent", "great", "well", "outstanding", "nice", "superb", "fantastic", "impressive"]
    negative = ["bad", "poor", "worst", "delay", "issue", "problem", "fail", "terrible", "disappointing"]
    pos = sum(word in text for word in positive)
    neg = sum(word in text for word in negative)
    if pos > neg: return "Positive"
    elif neg > pos: return "Negative"
    return "Neutral"

@router.post("/", response_model=Feedback)
def create_feedback(feedback: FeedbackCreate, db: Session = Depends(get_db)):
    employee = db.query(EmployeeModel).filter(EmployeeModel.id == feedback.employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    sentiment = analyze_sentiment(feedback.feedback_text)
    db_feedback = FeedbackModel(
        **feedback.dict(),
        sentiment=sentiment
    )
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)

    # Notify employee
    if employee.user_id:
        notification_service.create_notification(
            db,
            user_id=employee.user_id,
            title="New Feedback Received",
            message=f"You have received new feedback: '{feedback.feedback_text[:50]}...'"
        )

    return db_feedback

@router.get("/", response_model=List[Feedback])
def get_feedback(employee_id: int, db: Session = Depends(get_db)):
    return db.query(FeedbackModel).filter(FeedbackModel.employee_id == employee_id).all()
