from sqlalchemy import Column, Integer, String, ForeignKey, Float, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime

class Appraisal(Base):
    __tablename__ = "appraisals"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    manager_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    rating = Column(Float, nullable=True)
    comments = Column(String, nullable=True)
    status = Column(String, default="Pending Manager")
    cycle = Column(String, default="H1-2026")
    date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    employee = relationship("Employee", back_populates="appraisals", foreign_keys=[employee_id])
    manager = relationship("Employee", foreign_keys=[manager_id])

    @property
    def review_period(self):
        return self.cycle
