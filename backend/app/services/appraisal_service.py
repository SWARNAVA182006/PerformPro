from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime
from app.models.appraisal import Appraisal
from app.models.employee import Employee
from app.models.kpi import KPI

class AppraisalService:
    @staticmethod
    def create_manager_appraisal(db: Session, employee_id: int, manager_id: int, review_period: str, remarks: str) -> Appraisal:
        appraisal = Appraisal(
            employee_id=employee_id,
            manager_id=manager_id,
            rating=8.0, # Default or calculated
            comments=remarks,
            status="Approved", # Manager initiated reviews are auto-approved for now
            cycle=review_period,
            date=datetime.utcnow()
        )
        db.add(appraisal)
        
        # Update employee score if it's an appraisal
        emp = db.query(Employee).filter(Employee.id == employee_id).first()
        if emp:
            current_score = emp.performance_score or 0
            emp.performance_score = (current_score * 0.7) + (appraisal.rating * 10 * 0.3)
            
        db.commit()
        db.refresh(appraisal)
        return appraisal

    @staticmethod
    def submit_appraisal(db: Session, employee_id: int, self_rating: float, self_comments: str) -> Appraisal:
        # User defined cycle logic for current period
        cycle = "H1-2026"
        
        appraisal = Appraisal(
            employee_id=employee_id,
            rating=self_rating,
            comments=f"Self: {self_comments}",
            status="Pending",
            cycle=cycle,
            date=datetime.utcnow()
        )
        db.add(appraisal)
        db.commit()
        db.refresh(appraisal)
        return appraisal

    @staticmethod
    def review_appraisal(db: Session, appraisal_id: int, manager_id: int, manager_rating: float, manager_comments: str, approved: bool) -> Appraisal:
        appraisal = db.query(Appraisal).filter(Appraisal.id == appraisal_id).first()
        if not appraisal:
            raise HTTPException(status_code=404, detail="Appraisal not found")
            
        appraisal.manager_id = manager_id
        appraisal.rating = (appraisal.rating + manager_rating) / 2.0
        appraisal.comments += f" | Manager: {manager_comments}"
        appraisal.status = "Approved" if approved else "Rejected"
        
        if approved:
            # Update employee performance score directly based on final appraisal rating
            emp = db.query(Employee).filter(Employee.id == appraisal.employee_id).first()
            if emp:
                # Update KPI achieves 
                current_score = emp.performance_score or 0
                emp.performance_score = (current_score * 0.7) + (appraisal.rating * 10 * 0.3)
        
        db.commit()
        db.refresh(appraisal)
        return appraisal

appraisal_service = AppraisalService()
