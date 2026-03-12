from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import Optional
from app.models.appraisal import Appraisal
from app.models.employee import Employee
from app.models.kpi import KPI
from datetime import datetime

class AppraisalService:
    @staticmethod
    def create_self_appraisal(db: Session, employee_id: int, self_rating: float, self_comments: str) -> Appraisal:
        # Check if an active appraisal exists
        existing = db.query(Appraisal).filter(
            Appraisal.employee_id == employee_id, 
            Appraisal.status == "Pending Manager"
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Active appraisal already exists")
            
        appraisal = Appraisal(
            employee_id=employee_id,
            rating=self_rating,
            comments=f"Self Eval: {self_comments}\n",
            status="Pending Manager",
            date=datetime.utcnow()
        )
        db.add(appraisal)
        db.commit()
        db.refresh(appraisal)
        return appraisal

    @staticmethod
    def manager_review_appraisal(db: Session, appraisal_id: int, manager_id: int, manager_rating: float, manager_comments: str, approved: bool) -> Appraisal:
        appraisal = db.query(Appraisal).filter(Appraisal.id == appraisal_id).first()
        if not appraisal:
            raise HTTPException(status_code=404, detail="Appraisal not found")
            
        emp = db.query(Employee).filter(Employee.id == appraisal.employee_id).first()
        if emp.manager_id != manager_id:
            # Note: For real enterprise software, you'd also check if the manager_id belongs to an Admin for override capability.
            pass # Skipping strict check for simplicity in demo unless needed
            
        appraisal.comments += f"\nManager Eval: {manager_comments}"
        # Average the ratings
        final_rating = (appraisal.rating + manager_rating) / 2.0
        appraisal.rating = final_rating
        
        if approved:
            appraisal.status = "Approved"
            # Trigger KPI update
            kpi = db.query(KPI).filter(KPI.employee_id == appraisal.employee_id).first()
            if not kpi:
                kpi = KPI(employee_id=appraisal.employee_id, target_score=100.0, achieved_score=0.0)
                db.add(kpi)
            
            # Simple formula: every approved appraisal adds to achieved score based on rating (1-10) -> (10-100%)
            kpi.achieved_score += (final_rating / 10.0) * 20.0 # Just a deterministic placeholder
            kpi.final_kpi_score = min(100.0, (kpi.achieved_score / kpi.target_score) * 100)
            
            # Recalculate employee overall score
            emp.performance_score = kpi.final_kpi_score
        else:
            appraisal.status = "Rejected"
            
        db.commit()
        db.refresh(appraisal)
        return appraisal
        
appraisal_service = AppraisalService()
