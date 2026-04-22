from pydantic import BaseModel, Field, validator
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
    employee_name: Optional[str] = None   # resolved in route for display
    employee_email: Optional[str] = None
    date: Optional[datetime] = None
    created_at: Optional[datetime] = None
    rating: Optional[float] = None       # null until manager rates
    comments: Optional[str] = None       # null until comments added
    status: str = "Pending Manager"
    review_period: Optional[str] = None

    @validator('review_period', pre=True, always=True)
    def coerce_review_period(cls, v, values):
        # Fallback: use cycle field if review_period is missing
        return v or "H1-2026"

    @validator('rating', pre=True, always=True)
    def coerce_rating(cls, v):
        return v  # Allow None

    @validator('comments', pre=True, always=True)
    def coerce_comments(cls, v):
        return v or ""

    class Config:
        from_attributes = True
