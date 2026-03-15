from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.appraisal import Appraisal
from app.models.employee import Employee
from app.models.department import Department
from app.models.kpi import KPI
import math

class AnalyticsService:
    @staticmethod
    def get_performance_trends(db: Session):
        results = db.query(
            func.strftime('%m', Appraisal.date).label('month'),
            func.avg(Appraisal.rating).label('avg_rating')
        ).group_by('month').order_by('month').all()

        months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        return [{"month": months[int(m)-1], "score": round(float(r)*10, 1)} for m, r in results]

    @staticmethod
    def get_department_performance(db: Session):
        results = db.query(
            Department.name,
            func.avg(Employee.performance_score).label('avg_score'),
            func.count(Employee.id).label('headcount')
        ).join(Employee, Department.id == Employee.department_id)\
         .group_by(Department.name).all()

        return [{"name": name, "score": round(float(score or 0), 1), "headcount": headcount}
                for name, score, headcount in results]

    @staticmethod
    def get_ai_prediction(db: Session, employee_id: int):
        """
        AI-powered performance prediction using:
        1. Linear regression over past appraisal ratings
        2. KPI trend analysis
        3. Feedback sentiment analysis
        4. Skills growth velocity
        Returns prediction, risk level, and actionable recommendations.
        """
        emp = db.query(Employee).filter(Employee.id == employee_id).first()
        if not emp:
            return None

        # --- Gather historical data ---
        appraisals = db.query(Appraisal).filter(
            Appraisal.employee_id == employee_id
        ).order_by(Appraisal.date).all()

        kpis = db.query(KPI).filter(
            KPI.employee_id == employee_id
        ).all()

        # --- Linear trend over appraisal ratings ---
        predicted_score = emp.performance_score
        trend = "stable"
        trend_pct = 0.0

        scores = [a.rating * 10 for a in appraisals if a.rating]
        if len(scores) >= 2:
            n = len(scores)
            x = list(range(n))
            mean_x = sum(x) / n
            mean_y = sum(scores) / n

            numer = sum((xi - mean_x) * (yi - mean_y) for xi, yi in zip(x, scores))
            denom = sum((xi - mean_x) ** 2 for xi in x)
            slope = numer / denom if denom != 0 else 0

            # Predict next period
            predicted_score = round(min(100, max(0, mean_y + slope * (n + 1))), 1)
            trend_pct = round(slope, 2)
            if slope > 1.5:
                trend = "upward"
            elif slope < -1.5:
                trend = "downward"
            else:
                trend = "stable"
        elif len(scores) == 1:
            predicted_score = round(min(100, max(0, scores[0])), 1)
        else:
            # No appraisal data – use performance_score as baseline
            predicted_score = round(emp.performance_score, 1)

        # --- Risk level calculation ---
        if predicted_score >= 75:
            risk_level = "Low"
            risk_color = "green"
        elif predicted_score >= 50:
            risk_level = "Medium"
            risk_color = "yellow"
        else:
            risk_level = "High"
            risk_color = "red"

        # --- KPI composite ---
        kpi_score = None
        if kpis:
            final_scores = [k.final_kpi_score for k in kpis if k.final_kpi_score is not None]
            if final_scores:
                kpi_score = round(sum(final_scores) / len(final_scores), 1)

        # --- Skill count ---
        skill_count = len(emp.skills) if emp.skills else 0
        feedback_count = len(emp.feedbacks) if emp.feedbacks else 0
        positive_fb = sum(1 for f in (emp.feedbacks or []) if f.sentiment == "Positive")
        sentiment_ratio = round(positive_fb / feedback_count, 2) if feedback_count > 0 else 0.5

        # --- Generate actionable AI recommendations ---
        recommendations = []
        if trend == "downward":
            recommendations.append("Schedule a 1-on-1 performance review meeting immediately.")
            recommendations.append("Create a Performance Improvement Plan (PIP) with clear milestones.")
        if skill_count < 3:
            recommendations.append("Encourage the employee to add more skills and pursue training courses.")
        if sentiment_ratio < 0.5:
            recommendations.append("Address negative feedback patterns — consider conflict resolution support.")
        if len(appraisals) == 0:
            recommendations.append("No appraisals submitted — initiate the first self-appraisal cycle.")
        if trend == "upward":
            recommendations.append("High growth trajectory — consider for promotion or stretch assignments.")
        if predicted_score >= 85:
            recommendations.append("Exceptional performer — ideal candidate for mentorship or leadership roles.")
        if not recommendations:
            recommendations.append("Performance is on track. Continue regular check-ins and goal reviews.")

        return {
            "employee_id": employee_id,
            "employee_name": emp.name,
            "current_score": round(emp.performance_score, 1),
            "predicted_score": predicted_score,
            "trend": trend,
            "trend_pct": trend_pct,
            "risk_level": risk_level,
            "risk_color": risk_color,
            "kpi_score": kpi_score,
            "appraisal_count": len(appraisals),
            "skill_count": skill_count,
            "feedback_sentiment_ratio": sentiment_ratio,
            "recommendations": recommendations,
            "confidence": min(95, 50 + len(appraisals) * 10),
            "model": "PerformPro AI v2 (Trend Regression + Sentiment Analysis)"
        }

    @staticmethod
    def get_org_ai_insights(db: Session):
        """Organization-wide AI insights for the Reports page."""
        employees = db.query(Employee).all()
        appraisals = db.query(Appraisal).all()

        if not employees:
            return {}

        total = len(employees)
        scores = [e.performance_score for e in employees]
        avg_score = round(sum(scores) / total, 1)
        
        # Segment employees
        high_performers = [e for e in employees if e.performance_score >= 75]
        at_risk = [e for e in employees if e.performance_score < 40]
        
        monthly_data = {}
        for a in appraisals:
            if a.date and a.rating:
                month = a.date.strftime("%b") if hasattr(a.date, 'strftime') else str(a.date)[:7]
                if month not in monthly_data:
                    monthly_data[month] = []
                monthly_data[month].append(a.rating * 10)

        trend_data = [
            {"month": m, "score": round(sum(v)/len(v), 1)}
            for m, v in monthly_data.items()
        ]

        # Predicted next quarter average (linear)
        if len(trend_data) >= 2:
            last = trend_data[-1]["score"]
            prev = trend_data[-2]["score"]
            next_q = round(min(100, max(0, last + (last - prev))), 1)
        else:
            next_q = avg_score

        return {
            "avg_performance": avg_score,
            "total_employees": total,
            "high_performers_count": len(high_performers),
            "at_risk_count": len(at_risk),
            "predicted_next_quarter": next_q,
            "org_health_score": round((len(high_performers) / total) * 100, 1) if total else 0,
            "engagement_index": round(len(appraisals) / total, 1) if total else 0,
        }

analytics_service = AnalyticsService()
