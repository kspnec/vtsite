from datetime import datetime

from pydantic import BaseModel

from app.models.notification import NotificationType


class NotificationOut(BaseModel):
    id: int
    type: NotificationType
    message: str
    is_read: bool
    actor_id: int | None = None
    created_at: datetime | None = None

    class Config:
        from_attributes = True
