from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, unique=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    manager_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    
    # Profile Info
    name = Column(String, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    role = Column(String, nullable=False) # e.g., Developer, QA (Designation)
    phone = Column(String, nullable=True)
    bio = Column(String, nullable=True)
    profile_image_url = Column(String, nullable=True)
    date_joined = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="Active")
    performance_score = Column(Float, default=0.0)
    
    # Relationships
    user = relationship("User", back_populates="employee_profile")
    department = relationship("Department", back_populates="employees")
    manager = relationship("Employee", remote_side=[id], backref="direct_reports")
    
    feedbacks = relationship("Feedback", back_populates="employee", cascade="all, delete-orphan")
    skills = relationship("Skill", back_populates="employee", cascade="all, delete-orphan")
    appraisals = relationship("Appraisal", back_populates="employee", cascade="all, delete-orphan")
    kpis = relationship("KPI", back_populates="employee", cascade="all, delete-orphan")
