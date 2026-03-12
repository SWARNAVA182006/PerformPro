from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class EmployeeBase(BaseModel):
    name: str
    email: EmailStr
    role: str
    department_id: Optional[int] = None
    manager_id: Optional[int] = None
    status: str = "Active"

class EmployeeCreate(EmployeeBase):
    user_id: Optional[int] = None

class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    department_id: Optional[int] = None
    manager_id: Optional[int] = None
    status: Optional[str] = None

class EmployeeResponse(EmployeeBase):
    id: int
    user_id: Optional[int]
    performance_score: float
    date_joined: datetime

    class Config:
        from_attributes = True

class StandardResponse(BaseModel):
    success: bool
    data: Any
    message: str
    pagination: Optional[dict] = None
