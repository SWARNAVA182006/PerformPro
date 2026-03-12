from fastapi import FastAPI
from database import engine, SessionLocal
import models

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="PerformPro – Smart Employee Performance Tracker",
    version="1.0.0",
    description="Industry-grade employee performance, appraisal & HR analytics system"
)

# ---------------- SENTIMENT ANALYSIS ----------------
def analyze_sentiment(text: str) -> str:
    text = text.lower()
    positive = ["good", "excellent", "great", "well", "outstanding", "nice"]
    negative = ["bad", "poor", "worst", "delay", "issue", "problem"]

    pos = sum(word in text for word in positive)
    neg = sum(word in text for word in negative)

    if pos > neg:
        return "Positive"
    elif neg > pos:
        return "Negative"
    return "Neutral"


# ---------------- BASIC ----------------
@app.get("/")
def home():
    return {"message": "PerformPro backend is running successfully"}


# ---------------- EMPLOYEE ----------------
@app.post("/employees/")
def create_employee(name: str, role: str, department: str):
    db = SessionLocal()
    employee = models.Employee(name=name, role=role, department=department)
    db.add(employee)
    db.commit()
    db.refresh(employee)
    db.close()
    return employee


@app.get("/employees/")
def get_employees():
    db = SessionLocal()
    employees = db.query(models.Employee).all()
    db.close()
    return employees


# ---------------- FEEDBACK ----------------
@app.post("/feedback/")
def create_feedback(employee_id: int, given_by: str, feedback_text: str):
    db = SessionLocal()

    employee = db.query(models.Employee).filter(
        models.Employee.id == employee_id
    ).first()

    if not employee:
        db.close()
        return {"error": "Employee not found"}

    feedback = models.Feedback(
        employee_id=employee_id,
        given_by=given_by,
        feedback_text=feedback_text,
        sentiment=analyze_sentiment(feedback_text)
    )

    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    db.close()
    return feedback


@app.get("/feedback/{employee_id}")
def get_feedback(employee_id: int):
    db = SessionLocal()
    feedbacks = db.query(models.Feedback).filter(
        models.Feedback.employee_id == employee_id
    ).all()
    db.close()
    return feedbacks


# ---------------- SKILLS (UPSERT) ----------------
@app.post("/skills/")
def add_skill(employee_id: int, skill_name: str, proficiency_level: str):
    db = SessionLocal()

    skill = db.query(models.Skill).filter(
        models.Skill.employee_id == employee_id,
        models.Skill.skill_name.ilike(skill_name)
    ).first()

    if skill:
        skill.proficiency_level = proficiency_level
    else:
        skill = models.Skill(
            employee_id=employee_id,
            skill_name=skill_name,
            proficiency_level=proficiency_level
        )
        db.add(skill)

    db.commit()
    db.refresh(skill)
    db.close()
    return skill


@app.get("/skills/{employee_id}")
def get_skills(employee_id: int):
    db = SessionLocal()
    skills = db.query(models.Skill).filter(
        models.Skill.employee_id == employee_id
    ).all()
    db.close()
    return skills


# ---------------- KPI (ONLY LATEST) ----------------
@app.post("/kpi/{employee_id}")
def calculate_kpi(employee_id: int):
    db = SessionLocal()

    db.query(models.KPI).filter(
        models.KPI.employee_id == employee_id
    ).delete()

    skills = db.query(models.Skill).filter(
        models.Skill.employee_id == employee_id
    ).all()

    skill_score = 0
    for s in skills:
        level = s.proficiency_level.lower()
        if level == "beginner":
            skill_score += 20
        elif level == "intermediate":
            skill_score += 40
        elif level in ["good", "advanced"]:
            skill_score += 60
        elif level == "excellent":
            skill_score += 80

    feedbacks = db.query(models.Feedback).filter(
        models.Feedback.employee_id == employee_id
    ).all()

    feedback_score = 0
    for f in feedbacks:
        if f.sentiment == "Positive":
            feedback_score += 10
        elif f.sentiment == "Negative":
            feedback_score -= 10

    final_score = max(skill_score + feedback_score, 0)

    kpi = models.KPI(
        employee_id=employee_id,
        skill_score=skill_score,
        feedback_score=feedback_score,
        final_kpi_score=final_score
    )

    db.add(kpi)
    db.commit()
    db.refresh(kpi)
    db.close()
    return kpi


@app.get("/kpi/{employee_id}")
def get_kpi(employee_id: int):
    db = SessionLocal()
    kpi = db.query(models.KPI).filter(
        models.KPI.employee_id == employee_id
    ).order_by(models.KPI.id.desc()).first()
    db.close()
    return kpi


# ---------------- APPRAISAL (ONLY LATEST) ----------------
@app.post("/appraisal/{employee_id}")
def create_appraisal(employee_id: int, review_period: str, manager_remarks: str):
    db = SessionLocal()

    db.query(models.Appraisal).filter(
        models.Appraisal.employee_id == employee_id
    ).delete()

    kpi = db.query(models.KPI).filter(
        models.KPI.employee_id == employee_id
    ).order_by(models.KPI.id.desc()).first()

    if not kpi:
        db.close()
        return {"error": "Calculate KPI first"}

    score = kpi.final_kpi_score

    if score >= 75:
        rating = "Excellent"
    elif score >= 60:
        rating = "Good"
    elif score >= 40:
        rating = "Average"
    else:
        rating = "Needs Improvement"

    appraisal = models.Appraisal(
        employee_id=employee_id,
        review_period=review_period,
        final_rating=rating,
        manager_remarks=manager_remarks
    )

    db.add(appraisal)
    db.commit()
    db.refresh(appraisal)
    db.close()
    return appraisal


@app.get("/appraisal/{employee_id}")
def get_appraisal(employee_id: int):
    db = SessionLocal()
    appraisal = db.query(models.Appraisal).filter(
        models.Appraisal.employee_id == employee_id
    ).order_by(models.Appraisal.id.desc()).first()
    db.close()
    return appraisal


# ---------------- SMART INSIGHTS ----------------
@app.get("/insights/{employee_id}")
def get_insights(employee_id: int):
    db = SessionLocal()

    feedbacks = db.query(models.Feedback).filter(
        models.Feedback.employee_id == employee_id
    ).all()

    kpi = db.query(models.KPI).filter(
        models.KPI.employee_id == employee_id
    ).order_by(models.KPI.id.desc()).first()

    insights = []

    positives = sum(f.sentiment == "Positive" for f in feedbacks)
    negatives = sum(f.sentiment == "Negative" for f in feedbacks)

    if positives > negatives:
        insights.append("Employee has mostly positive feedback")
    elif negatives > positives:
        insights.append("Employee has negative feedback patterns")
    else:
        insights.append("Employee feedback is neutral")

    if kpi:
        if kpi.final_kpi_score >= 75:
            insights.append("Overall performance is excellent")
        elif kpi.final_kpi_score >= 60:
            insights.append("Overall performance is good")
        elif kpi.final_kpi_score >= 40:
            insights.append("Overall performance is average")
        else:
            insights.append("Performance needs improvement")

    db.close()
    return insights


# ---------------- HR SUMMARY REPORT ----------------
@app.get("/report/{employee_id}")
def hr_report(employee_id: int):
    db = SessionLocal()

    report = {
        "employee": db.query(models.Employee).filter(
            models.Employee.id == employee_id
        ).first(),
        "skills": db.query(models.Skill).filter(
            models.Skill.employee_id == employee_id
        ).all(),
        "feedbacks": db.query(models.Feedback).filter(
            models.Feedback.employee_id == employee_id
        ).all(),
        "kpi": db.query(models.KPI).filter(
            models.KPI.employee_id == employee_id
        ).order_by(models.KPI.id.desc()).first(),
        "appraisal": db.query(models.Appraisal).filter(
            models.Appraisal.employee_id == employee_id
        ).order_by(models.Appraisal.id.desc()).first(),
        "insights": get_insights(employee_id)
    }

    db.close()
    return report
