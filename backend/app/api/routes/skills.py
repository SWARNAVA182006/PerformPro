from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.skill import Skill as SkillModel
from app.models.employee import Employee as EmployeeModel
from app.schemas import Skill, SkillCreate
from typing import List

router = APIRouter()

@router.post("/", response_model=Skill)
def add_skill(skill: SkillCreate, db: Session = Depends(get_db)):
    employee = db.query(EmployeeModel).filter(EmployeeModel.id == skill.employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    db_skill = db.query(SkillModel).filter(
        SkillModel.employee_id == skill.employee_id,
        SkillModel.skill_name.ilike(skill.skill_name)
    ).first()

    if db_skill:
        db_skill.proficiency_level = skill.proficiency_level
    else:
        db_skill = SkillModel(**skill.dict())
        db.add(db_skill)
    
    db.commit()
    db.refresh(db_skill)
    return db_skill

@router.get("/", response_model=List[Skill])
def get_skills(employee_id: int, db: Session = Depends(get_db)):
    return db.query(SkillModel).filter(SkillModel.employee_id == employee_id).all()
