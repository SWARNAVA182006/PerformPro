from pydantic import BaseModel, EmailStr
from typing import Optional
from app.models.user import RoleEnum
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    role: RoleEnum = RoleEnum.EMPLOYEE

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
