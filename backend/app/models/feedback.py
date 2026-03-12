from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    given_by = Column(String)
    feedback_text = Column(String)
    sentiment = Column(String)

    employee = relationship("Employee", back_populates="feedbacks")
