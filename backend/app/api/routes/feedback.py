# Simple sentiment analysis logic (to be moved to services later)
def analyze_sentiment(text: str) -> str:
    text = text.lower()
    positive = ["good", "excellent", "great", "well", "outstanding", "nice"]
    negative = ["bad", "poor", "worst", "delay", "issue", "problem"]
    pos = sum(word in text for word in positive)
    neg = sum(word in text for word in negative)
    if pos > neg: return "Positive"
    elif neg > pos: return "Negative"
    return "Neutral"

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.feedback import Feedback as FeedbackModel
from app.models.employee import Employee as EmployeeModel
from app.schemas import Feedback, FeedbackCreate
from typing import List

router = APIRouter()

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
    return db_feedback

@router.get("/{employee_id}", response_model=List[Feedback])
def get_feedback(employee_id: int, db: Session = Depends(get_db)):
    return db.query(FeedbackModel).filter(FeedbackModel.employee_id == employee_id).all()
