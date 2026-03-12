from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False, index=True)
    entity = Column(String, nullable=False, index=True) # e.g., 'Employee', 'Appraisal'
    entity_id = Column(Integer, nullable=True) # ID of the affected entity
    timestamp = Column(DateTime, default=datetime.utcnow)
    metadata_info = Column(JSON, nullable=True) # Additional context regarding the action
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")
