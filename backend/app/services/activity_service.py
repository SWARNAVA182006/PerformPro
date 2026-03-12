from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog
from app.models.user import User

class ActivityService:
    @staticmethod
    def log_action(db: Session, user_id: int, action: str, entity: str, entity_id: int = None, metadata_info: dict = None):
        log = AuditLog(
            user_id=user_id,
            action=action,
            entity=entity,
            entity_id=entity_id,
            metadata_info=metadata_info
        )
        db.add(log)
        db.commit()

    @staticmethod
    def get_recent_activities(db: Session, limit: int = 10):
        # Fetch recent audit logs to power the dashboard activity feed
        logs = db.query(AuditLog, User.email).outerjoin(User, AuditLog.user_id == User.id)\
                 .order_by(AuditLog.timestamp.desc()).limit(limit).all()
        
        activities = []
        for log, user_email in logs:
            activities.append({
                "type": "audit",
                "message": f"{user_email or 'System'} {log.action} {log.entity} #{log.entity_id or ''}".strip(),
                "time": log.timestamp.strftime("%Y-%m-%d %H:%M")
            })
        return activities

activity_service = ActivityService()
