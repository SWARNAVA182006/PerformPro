from pydantic import BaseModel
from typing import Optional

class FeedbackBase(BaseModel):
    feedback_text: str
    given_by: str

class FeedbackCreate(FeedbackBase):
    employee_id: int

class Feedback(FeedbackBase):
    id: int
    employee_id: int
    sentiment: str

    class Config:
        from_attributes = True
