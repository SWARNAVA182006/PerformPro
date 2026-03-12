from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Appraisal(Base):
    __tablename__ = "appraisals"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    review_period = Column(String)
    final_rating = Column(String)
    manager_remarks = Column(String)

    employee = relationship("Employee", back_populates="appraisals")
