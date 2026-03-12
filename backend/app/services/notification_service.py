from sqlalchemy.orm import Session
from app.models.notification import Notification

class NotificationService:
    @staticmethod
    def create_notification(db: Session, user_id: int, title: str, message: str) -> Notification:
        notif = Notification(
            user_id=user_id,
            title=title,
            message=message
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)
        return notif

    @staticmethod
    def get_user_notifications(db: Session, user_id: int, unread_only: bool = False):
        query = db.query(Notification).filter(Notification.user_id == user_id)
        if unread_only:
            query = query.filter(Notification.is_read == False)
        return query.order_by(Notification.created_at.desc()).limit(50).all()

    @staticmethod
    def mark_as_read(db: Session, notification_id: int):
        notif = db.query(Notification).filter(Notification.id == notification_id).first()
        if notif:
            notif.is_read = True
            db.commit()
            
notification_service = NotificationService()
