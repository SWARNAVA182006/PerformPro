from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.department import Department
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter()

class DepartmentResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

@router.get("/", response_model=dict)
def get_departments(db: Session = Depends(get_db)):
    # Everyone can view departments
    deps = db.query(Department).all()
    
    return {
        "success": True,
        "data": [DepartmentResponse.from_orm(d).dict() for d in deps],
        "message": "Departments retrieved",
        "pagination": None
    }
