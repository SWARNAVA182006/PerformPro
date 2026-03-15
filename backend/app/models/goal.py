from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime

class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    title = Column(String, nullable=False)
    target = Column(String, nullable=False)
    progress = Column(Integer, default=0)
    deadline = Column(DateTime, nullable=False)
    status = Column(String, default="In Progress")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    employee = relationship("Employee", backref="goals")
