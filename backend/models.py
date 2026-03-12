from sqlalchemy import Column, Integer, String, ForeignKey
from database import Base

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    role = Column(String)
    department = Column(String)


class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    given_by = Column(String)
    feedback_text = Column(String)
    sentiment = Column(String)


class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    skill_name = Column(String)
    proficiency_level = Column(String)


class KPI(Base):
    __tablename__ = "kpis"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    skill_score = Column(Integer)
    feedback_score = Column(Integer)
    final_kpi_score = Column(Integer)


class Appraisal(Base):
    __tablename__ = "appraisals"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    review_period = Column(String)
    final_rating = Column(String)
    manager_remarks = Column(String)
