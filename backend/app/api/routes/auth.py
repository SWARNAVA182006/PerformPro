from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, RoleEnum
from app.schemas.user import UserCreate, UserResponse, Token
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token
from app.api.dependencies import get_current_user
from app.core.config import settings
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from app.models.employee import Employee
from typing import Optional

GOOGLE_CLIENT_ID = settings.GOOGLE_CLIENT_ID

router = APIRouter()

class GoogleLoginData(BaseModel):
    credential: str

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    profile_image_url: Optional[str] = None

@router.post("/signup", response_model=UserResponse)
def signup(user_in: UserCreate, db: Session = Depends(get_db)):
    # In a real SaaS, this might be restricted to Admin or Manager invitations
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    print(f"DEBUG: Password length is {len(user_in.password)} bytes. Value: {user_in.password!r}")
    hashed_password = get_password_hash(user_in.password)
    new_user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        role=user_in.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

class LoginData(BaseModel):
    email: str
    password: str

@router.post("/login", response_model=dict)
def login(login_data: LoginData, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)
    
    return {
        "success": True,
        "data": {
            "token": access_token,
            "role": user.role.value
        },
        "message": "Login successful"
    }

@router.post("/google", response_model=dict)
def google_auth(data: GoogleLoginData, db: Session = Depends(get_db)):
    try:
        # 1. Verify Google ID token
        idinfo = id_token.verify_oauth2_token(
            data.credential, 
            google_requests.Request(), 
            GOOGLE_CLIENT_ID
        )

        # 2. Extract user information
        email = idinfo['email']
        provider_id = idinfo['sub']
        email_verified = idinfo.get('email_verified', False)

        # 3. Reject login if email not verified
        if not email_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google email not verified"
            )

        # 4. Check if user exists
        user = db.query(User).filter(User.email == email).first()

        if user:
            # Account handling logic
            if user.provider == "google":
                # Existing Google user
                if user.provider_id != provider_id:
                    # Optional: handle if sub changes, usually shouldn't
                    user.provider_id = provider_id
                    db.commit()
            else:
                # Link Google provider to existing local account
                user.provider = "google"
                user.provider_id = provider_id
                db.commit()
        else:
            # Create a new user
            user = User(
                email=email,
                provider="google",
                provider_id=provider_id,
                role=RoleEnum.EMPLOYEE,
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # Issue standard JWT token
        access_token = create_access_token(subject=user.id, provider="google")
        
        return {
            "success": True,
            "data": {
                "token": access_token,
                "role": user.role.value
            },
            "message": "Google login successful"
        }

    except ValueError:
        # Invalid token
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google credentials"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/me", response_model=dict)
def read_users_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    
    return {
        "success": True,
        "data": {
            "id": current_user.id,
            "email": current_user.email,
            "role": current_user.role.value,
            "employee_id": employee.id if employee else None,
            "name": employee.name if employee else "",
            "phone": employee.phone if employee else "",
            "bio": employee.bio if employee else "",
            "profile_image_url": employee.profile_image_url if employee else "",
            "department_id": employee.department_id if employee else None,
            "designation": employee.role if employee else ""
        },
        "message": "User profile retrieved",
    }

@router.put("/me", response_model=dict)
def update_users_me(
    profile_data: UserProfileUpdate, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    employee = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    
    if not employee:
        # Create an employee profile if one doesn't exist
        employee = Employee(
            user_id=current_user.id,
            email=current_user.email,
            name=profile_data.name or current_user.email.split('@')[0],
            role=current_user.role.value,
        )
        db.add(employee)
    
    if profile_data.name is not None:
        employee.name = profile_data.name
    if profile_data.phone is not None:
        employee.phone = profile_data.phone
    if profile_data.bio is not None:
        employee.bio = profile_data.bio
    if profile_data.profile_image_url is not None:
        employee.profile_image_url = profile_data.profile_image_url
        
    db.commit()
    db.refresh(employee)
    
    return {
        "success": True,
        "data": {
            "id": current_user.id,
            "name": employee.name,
            "phone": employee.phone,
            "bio": employee.bio,
            "profile_image_url": employee.profile_image_url
        },
        "message": "Profile updated successfully"
    }
