from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class KPI(Base):
    __tablename__ = "kpis"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    skill_score = Column(Integer)
    feedback_score = Column(Integer)
    final_kpi_score = Column(Integer)

    employee = relationship("Employee", back_populates="kpis")
