from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog
from typing import Optional, Dict, Any

class AuditService:
    @staticmethod
    def log_action(
        db: Session, 
        user_id: Optional[int], 
        action: str, 
        entity: str, 
        entity_id: Optional[int] = None, 
        metadata_info: Optional[Dict[str, Any]] = None
    ) -> AuditLog:
        """
        Creates an audit entry in the database.
        """
        audit_log = AuditLog(
            user_id=user_id,
            action=action,
            entity=entity,
            entity_id=entity_id,
            metadata_info=metadata_info or {}
        )
        db.add(audit_log)
        db.commit()
        db.refresh(audit_log)
        return audit_log

audit_service = AuditService()
