from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from typing import Optional
from app.database import get_db
from app.models.employee import Employee
from app.models.user import User, RoleEnum
from app.api.dependencies import get_current_user, require_role
from app.services.notification_service import notification_service
from pydantic import BaseModel, EmailStr
from datetime import datetime

router = APIRouter()

class EmployeeResponseData(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    phone: Optional[str] = None
    bio: Optional[str] = None
    profile_image_url: Optional[str] = None
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
    phone: Optional[str] = None
    bio: Optional[str] = None
    profile_image_url: Optional[str] = None
    department_id: Optional[int] = None
    manager_id: Optional[int] = None

class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    profile_image_url: Optional[str] = None
    department_id: Optional[int] = None
    manager_id: Optional[int] = None
    status: Optional[str] = None

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
    
    # Try to notify if user is already linked (unlikely at employee creation but possible if done during signup)
    if db_emp.user_id:
        notification_service.create_notification(
            db=db,
            user_id=db_emp.user_id,
            title="Welcome to PerformPro!",
            message="Your employee profile has been created and linked to your account."
        )
        
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

@router.get("/me", response_model=dict)
def get_my_employee_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.employee_profile:
        raise HTTPException(status_code=400, detail="Employee profile not found for this user")
        
    return {
        "success": True,
        "data": EmployeeResponseData.from_orm(current_user.employee_profile).dict(),
        "message": "My profile retrieved successfully"
    }

@router.put("/me", response_model=dict)
def update_my_employee_profile(
    emp_update: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    emp = current_user.employee_profile
    if not emp:
        raise HTTPException(status_code=400, detail="Employee profile not found")
        
    # Security: users can update name, phone, bio, image, but not their own department/manager/status
    update_data = emp_update.dict(exclude_unset=True)
    allowed_fields = {'name', 'phone', 'bio', 'profile_image_url', 'department_id', 'role'}
    
    for key, value in update_data.items():
        if key in allowed_fields:
            setattr(emp, key, value)
            
    db.commit()
    db.refresh(emp)
    
    return {
        "success": True,
        "data": EmployeeResponseData.from_orm(emp).dict(),
        "message": "Profile updated successfully"
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

@router.put("/{emp_id}", response_model=dict)
def update_employee(
    emp_id: int, 
    emp_update: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([RoleEnum.ADMIN, RoleEnum.MANAGER]))
):
    emp = db.query(Employee).filter(Employee.id == emp_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    update_data = emp_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(emp, key, value)
        
    db.commit()
    db.refresh(emp)
    
    return {
        "success": True,
        "data": EmployeeResponseData.from_orm(emp).dict(),
        "message": "Employee updated successfully",
        "pagination": None
    }
