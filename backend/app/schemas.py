from pydantic import BaseModel
from typing import List, Optional

# --- EMPLOYEE ---
class EmployeeBase(BaseModel):
    name: str
    role: str
    department: str

class EmployeeCreate(EmployeeBase):
    pass

class Employee(EmployeeBase):
    id: int

    class Config:
        from_attributes = True

# --- FEEDBACK ---
class FeedbackBase(BaseModel):
    feedback_text: str
    given_by: str

class FeedbackCreate(FeedbackBase):
    employee_id: int

class Feedback(FeedbackBase):
    id: int
    employee_id: int
    sentiment: str

    class Config:
        from_attributes = True

# --- SKILL ---
class SkillBase(BaseModel):
    skill_name: str
    proficiency_level: str

class SkillCreate(SkillBase):
    employee_id: int

class Skill(SkillBase):
    id: int
    employee_id: int

    class Config:
        from_attributes = True

# --- KPI ---
class KPI(BaseModel):
    id: int
    employee_id: int
    skill_score: int
    feedback_score: int
    final_kpi_score: int

    class Config:
        from_attributes = True

# --- APPRAISAL ---
class AppraisalCreate(BaseModel):
    employee_id: int
    review_period: str
    manager_remarks: str

class Appraisal(BaseModel):
    id: int
    employee_id: int
    review_period: str
    final_rating: str
    manager_remarks: str

    class Config:
        from_attributes = True
