from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from app.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.services.notification_service import notification_service
from typing import List, Optional

router = APIRouter()

class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    is_read: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

@router.get("/", response_model=dict)
def get_my_notifications(
    unread_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notifs = notification_service.get_user_notifications(db, current_user.id, unread_only)
    
    return {
        "success": True,
        "data": [NotificationResponse.from_orm(n).dict() for n in notifs],
        "message": "Notifications retrieved successfully",
        "pagination": None
    }

@router.put("/{notif_id}/read", response_model=dict)
def mark_notification_read(
    notif_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notification_service.mark_as_read(db, notif_id)
    return {
        "success": True,
        "data": {"id": notif_id, "is_read": True},
        "message": "Notification marked as read",
        "pagination": None
    }
