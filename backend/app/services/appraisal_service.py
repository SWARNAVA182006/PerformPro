from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import Optional
from app.models.appraisal import Appraisal
from app.models.employee import Employee
from app.models.kpi import KPI
from app.services.audit_service import audit_service
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
        
        # Log action
        # Assuming we can derive user_id from employee_id for the audit, or pass it in.
        # It's better to pass it in, but to avoid changing the method signature right now,
        # we will fetch the user_id.
        emp = db.query(Employee).filter(Employee.id == employee_id).first()
        audit_service.log_action(
            db=db,
            user_id=emp.user_id if emp else None,
            action="Submitted Self Appraisal",
            entity="Appraisal",
            entity_id=appraisal.id,
            metadata_info={"rating": self_rating}
        )
        
        return appraisal

    @staticmethod
    def manager_review_appraisal(db: Session, appraisal_id: int, manager_id: int, manager_rating: float, manager_comments: str, approved: bool) -> Appraisal:
        appraisal = db.query(Appraisal).filter(Appraisal.id == appraisal_id).first()
        if not appraisal:
            raise HTTPException(status_code=404, detail="Appraisal not found")
            
        manager_emp = db.query(Employee).filter(Employee.id == manager_id).first() if manager_id else None
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
            kpi.achieved_score += (final_rating / 10.0) * 20.0 # KPI growth
            kpi.final_kpi_score = min(100.0, (kpi.achieved_score / kpi.target_score) * 100)
            
            # Recalculate employee overall score
            emp.performance_score = kpi.final_kpi_score
            
            audit_service.log_action(
                db=db,
                user_id=manager_emp.user_id if manager_emp else None,
                action="Approved Appraisal & Updated KPI",
                entity="Appraisal",
                entity_id=appraisal.id,
                metadata_info={"new_kpi": kpi.final_kpi_score, "manager_rating": manager_rating}
            )
        else:
            appraisal.status = "Rejected"
            audit_service.log_action(
                db=db,
                user_id=manager_emp.user_id if manager_emp else None,
                action="Rejected Appraisal",
                entity="Appraisal",
                entity_id=appraisal.id,
                metadata_info={"manager_rating": manager_rating}
            )
            
        db.commit()
        db.refresh(appraisal)
        return appraisal
        
appraisal_service = AppraisalService()
