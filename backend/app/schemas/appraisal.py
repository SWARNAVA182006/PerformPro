from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class SelfAppraisalCreate(BaseModel):
    employee_id: int
    self_rating: float = Field(..., ge=1, le=10, description="Rating from 1 to 10")
    self_comments: str
    
class ManagerReviewCreate(BaseModel):
    appraisal_id: int
    manager_rating: float = Field(..., ge=1, le=10, description="Manager rating from 1 to 10")
    manager_comments: str
    approved: bool

class AppraisalResponse(BaseModel):
    id: int
    employee_id: int
    date: datetime
    rating: float
    comments: str
    status: str
    
    class Config:
        from_attributes = True
