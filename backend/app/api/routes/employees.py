from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from typing import Optional
from app.database import get_db
from app.models.employee import Employee
from app.models.user import User, RoleEnum
from app.api.dependencies import get_current_user, require_role
from pydantic import BaseModel, EmailStr
from datetime import datetime

router = APIRouter()

class EmployeeResponseData(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    department_id: Optional[int]
    manager_id: Optional[int]
    status: str
    performance_score: float
    date_joined: datetime
    
    class Config:
        from_attributes = True

class EmployeeCreate(BaseModel):
    name: str
    email: EmailStr
    role: str
    department_id: Optional[int] = None
    manager_id: Optional[int] = None

@router.post("/", response_model=dict)
def create_employee(
    emp: EmployeeCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([RoleEnum.ADMIN, RoleEnum.MANAGER]))
):
    existing = db.query(Employee).filter(Employee.email == emp.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Employee with this email already exists")
        
    db_emp = Employee(**emp.dict())
    db.add(db_emp)
    db.commit()
    db.refresh(db_emp)
    return {
        "success": True,
        "data": EmployeeResponseData.from_orm(db_emp).dict(),
        "message": "Employee created successfully",
        "pagination": None
    }

@router.get("/", response_model=dict)
def get_employees(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    department_id: Optional[int] = None,
    sort_by: str = Query("id", regex="^(id|name|performance_score|date_joined)$"),
    sort_desc: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Employee)
    
    # Filtering
    if search:
        query = query.filter(Employee.name.ilike(f"%{search}%") | Employee.email.ilike(f"%{search}%"))
    if department_id:
        query = query.filter(Employee.department_id == department_id)
        
    # Sorting
    sort_column = getattr(Employee, sort_by)
    if sort_desc:
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(asc(sort_column))
        
    total = query.count()
    employees = query.offset(skip).limit(limit).all()
    
    return {
        "success": True,
        "data": [EmployeeResponseData.from_orm(emp).dict() for emp in employees],
        "message": "Employees retrieved successfully",
        "pagination": {
            "total": total,
            "skip": skip,
            "limit": limit
        }
    }

@router.get("/{emp_id}", response_model=dict)
def get_employee(
    emp_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    emp = db.query(Employee).filter(Employee.id == emp_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    # Employees can only view their own profile, unless they are Admin/Manager
    if current_user.role == RoleEnum.EMPLOYEE and current_user.employee_profile and current_user.employee_profile.id != emp_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this profile")
        
    return {
        "success": True,
        "data": EmployeeResponseData.from_orm(emp).dict(),
        "message": "Employee retrieved successfully",
        "pagination": None
    }
