from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.api.dependencies import get_current_user, require_role
from app.models.user import User, RoleEnum
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

class DepartmentCreate(BaseModel):
    name: str
    description: Optional[str] = None

@router.get("/", response_model=dict)
def get_departments(db: Session = Depends(get_db)):
    deps = db.query(Department).all()
    return {
        "success": True,
        "data": [DepartmentResponse.from_orm(d).dict() for d in deps],
        "message": "Departments retrieved",
        "pagination": None
    }

@router.post("/", response_model=dict)
def create_department(
    dept_in: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([RoleEnum.ADMIN]))
):
    existing = db.query(Department).filter(Department.name == dept_in.name).first()
    if existing:
        return {
            "success": True,
            "data": DepartmentResponse.from_orm(existing).dict(),
            "message": "Department already exists"
        }
    dept = Department(name=dept_in.name, description=dept_in.description)
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return {
        "success": True,
        "data": DepartmentResponse.from_orm(dept).dict(),
        "message": "Department created successfully"
    }
