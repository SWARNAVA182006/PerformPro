from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.employee import Employee
from app.models.appraisal import Appraisal
from app.models.goal import Goal

class DashboardService:
    @staticmethod
    def get_metrics(db: Session):
        total_workforce = db.query(func.count(Employee.id)).scalar() or 0
        active_appraisals = db.query(func.count(Appraisal.id)).filter(Appraisal.status.in_(["Pending Manager", "Pending Admin"])).scalar() or 0
        active_goals = db.query(func.count(Goal.id)).filter(Goal.status != "Completed").scalar() or 0
        avg_kpi = db.query(func.avg(Employee.performance_score)).scalar() or 0
        
        top_performer_emp = db.query(Employee).order_by(Employee.performance_score.desc()).first()
        top_performer = top_performer_emp.name if top_performer_emp else "N/A"
        
        # Simplified engagement: % of employees with approved appraisals
        total_with_appraisal = db.query(func.count(func.distinct(Appraisal.employee_id))).filter(Appraisal.status == "Approved").scalar() or 0
        dept_engagement = (total_with_appraisal / total_workforce * 100) if total_workforce > 0 else 0
        
        return {
            "total_workforce": total_workforce,
            "active_appraisals": active_appraisals,
            "active_goals": active_goals,
            "avg_kpi": round(float(avg_kpi), 1),
            "top_performer": top_performer,
            "department_engagement": f"{round(float(dept_engagement), 1)}%"
        }

dashboard_service = DashboardService()
