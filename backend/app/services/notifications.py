from sqlalchemy.orm import Session

from app.models.notification import Notification, NotificationType


def notify(
    db: Session,
    user_id: int,
    type: NotificationType,
    message: str,
    actor_id: int | None = None,
):
    """Create a notification; silently skip if user_id is None/invalid."""
    if not user_id:
        return
    n = Notification(user_id=user_id, type=type, message=message, actor_id=actor_id)
    db.add(n)
    # Caller is responsible for db.commit()
