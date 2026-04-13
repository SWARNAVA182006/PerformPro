from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.appraisal import Appraisal
from app.models.employee import Employee
from app.models.department import Department
from app.models.kpi import KPI
import math
import statistics

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
    def _linear_regression(x_vals, y_vals):
        """
        Pure least-squares linear regression.
        Returns (slope, intercept). No external libraries needed.
        """
        n = len(x_vals)
        if n < 2:
            return 0.0, (y_vals[0] if y_vals else 0.0)
        mean_x = sum(x_vals) / n
        mean_y = sum(y_vals) / n
        numer  = sum((xi - mean_x) * (yi - mean_y) for xi, yi in zip(x_vals, y_vals))
        denom  = sum((xi - mean_x) ** 2 for xi in x_vals)
        slope  = numer / denom if denom != 0 else 0.0
        intercept = mean_y - slope * mean_x
        return slope, intercept

    @staticmethod
    def _sentiment_score(feedbacks) -> float:
        """
        Maps positive/neutral/negative feedback counts to a 0–1 sentiment score.
        Uses a weighted formula: Positive=1, Neutral=0.5, Negative=0.
        """
        if not feedbacks:
            return 0.5
        total   = len(feedbacks)
        weights = {"Positive": 1.0, "Neutral": 0.5, "Negative": 0.0}
        raw     = sum(weights.get(getattr(f, 'sentiment', 'Neutral'), 0.5) for f in feedbacks)
        return round(raw / total, 3)

    @staticmethod
    def _kpi_composite(kpis) -> float | None:
        """
        Weighted KPI composite: heavier weight for KPIs with higher targets.
        Falls back to simple average when targets are unavailable.
        """
        if not kpis:
            return None
        scored = [(k.final_kpi_score, getattr(k, 'target', 1) or 1)
                  for k in kpis if k.final_kpi_score is not None]
        if not scored:
            return None
        weighted_sum   = sum(s * t for s, t in scored)
        weight_total   = sum(t for _, t in scored)
        return round(weighted_sum / weight_total, 1) if weight_total else None

    @classmethod
    def get_ai_prediction(cls, db: Session, employee_id: int):
        """
        PerformPro AI v3 — Multi-Factor Performance Intelligence Engine

        Factors used (with weights):
        ┌─────────────────────────────────────────────────┬────────┐
        │ Factor                                          │ Weight │
        ├─────────────────────────────────────────────────┼────────┤
        │ Appraisal linear regression (trend extrapolat.) │  40%   │
        │ KPI composite score (weighted by target)        │  30%   │
        │ Feedback sentiment ratio                        │  15%   │
        │ Skills breadth (normalised 0-10)                │  10%   │
        │ Engagement index (appraisal frequency)          │   5%   │
        └─────────────────────────────────────────────────┴────────┘

        The final predicted_score is a weighted blend clamped to [0, 100].
        Confidence rises with more data points (max 95%).
        """
        emp = db.query(Employee).filter(Employee.id == employee_id).first()
        if not emp:
            return None

        # ── Gather data ────────────────────────────────────────────────────
        appraisals = db.query(Appraisal).filter(
            Appraisal.employee_id == employee_id
        ).order_by(Appraisal.date).all()

        kpis      = db.query(KPI).filter(KPI.employee_id == employee_id).all()
        feedbacks = getattr(emp, 'feedbacks', []) or []
        skills    = getattr(emp, 'skills', []) or []

        # ── 1. Appraisal trend regression (40%) ───────────────────────────
        scores = [a.rating * 10 for a in appraisals if a.rating]
        if len(scores) >= 2:
            n           = len(scores)
            slope, intc = cls._linear_regression(list(range(n)), scores)
            # Extrapolate one period ahead
            appraisal_pred = round(min(100, max(0, intc + slope * n)), 1)
            trend_pct      = round(slope, 2)
            if slope > 1.5:
                trend = "upward"
            elif slope < -1.5:
                trend = "downward"
            else:
                trend = "stable"
        elif len(scores) == 1:
            appraisal_pred = round(min(100, max(0, scores[0])), 1)
            trend          = "stable"
            trend_pct      = 0.0
        else:
            appraisal_pred = round(emp.performance_score, 1)
            trend          = "stable"
            trend_pct      = 0.0

        # ── 2. KPI composite (30%) ─────────────────────────────────────────
        kpi_score = cls._kpi_composite(kpis)

        # ── 3. Sentiment (15%) ─────────────────────────────────────────────
        sentiment_ratio = cls._sentiment_score(feedbacks)
        sentiment_score = round(sentiment_ratio * 100, 1)   # normalise to 0-100

        # ── 4. Skills breadth (10%) ────────────────────────────────────────
        skill_count   = len(skills)
        skill_score   = round(min(100, skill_count * 10), 1)  # capped at 10 skills

        # ── 5. Engagement (5%) ─────────────────────────────────────────────
        engagement_score = min(100, len(appraisals) * 20)      # 5 appraisals → 100%

        # ── Weighted blend ─────────────────────────────────────────────────
        kpi_input = kpi_score if kpi_score is not None else appraisal_pred

        weights = {
            'appraisal':  0.40,
            'kpi':        0.30,
            'sentiment':  0.15,
            'skills':     0.10,
            'engagement': 0.05,
        }
        predicted_score = round(
            appraisal_pred  * weights['appraisal']  +
            kpi_input       * weights['kpi']        +
            sentiment_score * weights['sentiment']  +
            skill_score     * weights['skills']     +
            engagement_score* weights['engagement'],
            1,
        )
        predicted_score = max(0.0, min(100.0, predicted_score))

        # ── Volatility (standard deviation of historical scores) ───────────
        volatility = round(statistics.stdev(scores), 2) if len(scores) >= 2 else 0.0

        # ── Risk level ─────────────────────────────────────────────────────
        if predicted_score >= 75:
            risk_level, risk_color = "Low",    "green"
        elif predicted_score >= 50:
            risk_level, risk_color = "Medium", "yellow"
        else:
            risk_level, risk_color = "High",   "red"

        # ── Confidence: rises with data quality ────────────────────────────
        confidence = min(95, (
            30
            + min(30, len(appraisals) * 8)   # appraisal history
            + min(20, skill_count * 3)        # skills breadth
            + min(10, len(feedbacks) * 2)     # feedback volume
            + (5 if kpi_score is not None else 0)
        ))

        # ── Actionable AI recommendations ─────────────────────────────────
        recommendations = []
        if trend == "downward":
            recommendations.append("⚠ Declining trend detected — schedule an immediate 1-on-1 and create a Performance Improvement Plan (PIP).")
        if skill_count < 3:
            recommendations.append("📚 Skills gap identified — encourage targeted training and certification programmes.")
        if sentiment_ratio < 0.45:
            recommendations.append("💬 Negative feedback patterns — consider conflict resolution support or team realignment.")
        if len(appraisals) == 0:
            recommendations.append("📋 No appraisals on record — initiate the first self-appraisal cycle immediately.")
        if volatility > 15:
            recommendations.append(f"📊 High performance volatility (σ={volatility}) — investigate root causes of inconsistency.")
        if trend == "upward" and predicted_score >= 70:
            recommendations.append("🚀 Strong upward trajectory — consider for fast-track promotion or leadership development.")
        if predicted_score >= 85:
            recommendations.append("🏆 Exceptional performance — ideal mentor; explore senior or strategic roles.")
        if engagement_score < 40:
            recommendations.append("🔄 Low appraisal engagement — send reminders and improve submission UX.")
        if kpi_score is not None and kpi_score < 50:
            recommendations.append("🎯 KPI scores below target — review goal-setting quality and resource allocation.")
        if not recommendations:
            recommendations.append("✅ Performance is well on track. Maintain regular check-ins and set stretch goals.")

        return {
            "employee_id":               employee_id,
            "employee_name":             emp.name,
            "current_score":             round(emp.performance_score, 1),
            "predicted_score":           predicted_score,
            "trend":                     trend,
            "trend_pct":                 trend_pct,
            "risk_level":                risk_level,
            "risk_color":                risk_color,
            "kpi_score":                 kpi_score,
            "appraisal_count":           len(appraisals),
            "skill_count":               skill_count,
            "feedback_sentiment_ratio":  sentiment_ratio,
            "volatility":                volatility,
            "confidence":                confidence,
            "factor_breakdown": {
                "appraisal_contribution":  round(appraisal_pred  * weights['appraisal'],  1),
                "kpi_contribution":        round(kpi_input       * weights['kpi'],        1),
                "sentiment_contribution":  round(sentiment_score * weights['sentiment'],  1),
                "skills_contribution":     round(skill_score     * weights['skills'],     1),
                "engagement_contribution": round(engagement_score* weights['engagement'], 1),
            },
            "recommendations": recommendations,
            "model": "PerformPro AI v3 (Multi-Factor Weighted Regression + Sentiment + KPI)",
        }

    @staticmethod
    def get_org_ai_insights(db: Session):
        """Organization-wide AI insights."""
        employees  = db.query(Employee).all()
        appraisals = db.query(Appraisal).all()

        if not employees:
            return {}

        total  = len(employees)
        scores = [e.performance_score for e in employees]
        avg_score = round(sum(scores) / total, 1)

        # Richer segmentation
        high_performers   = [e for e in employees if e.performance_score >= 75]
        mid_performers    = [e for e in employees if 50 <= e.performance_score < 75]
        at_risk           = [e for e in employees if e.performance_score < 40]
        score_stdev       = round(statistics.stdev(scores), 1) if len(scores) >= 2 else 0.0

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

        # Quadratic extrapolation for next quarter when ≥3 months data available
        if len(trend_data) >= 3:
            ys = [d["score"] for d in trend_data[-3:]]
            # Simple second-order extrapolation: f(3) using last 3 points
            next_q = round(min(100, max(0, ys[-1] + (ys[-1] - ys[-2]) + 0.5 * ((ys[-1] - ys[-2]) - (ys[-2] - ys[-3])))), 1)
        elif len(trend_data) == 2:
            last, prev = trend_data[-1]["score"], trend_data[-2]["score"]
            next_q = round(min(100, max(0, last + (last - prev))), 1)
        else:
            next_q = avg_score

        # Org health: blend of high-performer ratio + low at-risk ratio
        hp_ratio   = len(high_performers) / total
        ar_ratio   = len(at_risk) / total
        org_health = round(((hp_ratio * 0.7) + ((1 - ar_ratio) * 0.3)) * 100, 1)

        return {
            "avg_performance":        avg_score,
            "score_stdev":            score_stdev,
            "total_employees":        total,
            "high_performers_count":  len(high_performers),
            "mid_performers_count":   len(mid_performers),
            "at_risk_count":          len(at_risk),
            "predicted_next_quarter": next_q,
            "org_health_score":       org_health,
            "engagement_index":       round(len(appraisals) / total, 1) if total else 0,
            "trend_data":             trend_data,
        }

analytics_service = AnalyticsService()
