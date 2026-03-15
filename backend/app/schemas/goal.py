from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class GoalBase(BaseModel):
    title: str
    target: str
    deadline: datetime

class GoalCreate(GoalBase):
    pass

class GoalUpdate(BaseModel):
    title: Optional[str] = None
    target: Optional[str] = None
    progress: Optional[int] = None
    status: Optional[str] = None
    deadline: Optional[datetime] = None

class GoalResponse(GoalBase):
    id: int
    employee_id: int
    progress: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
