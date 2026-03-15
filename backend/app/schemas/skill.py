from pydantic import BaseModel
from typing import Optional

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
