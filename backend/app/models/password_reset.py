import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String

from app.database import Base


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    id = Column(Integer, primary_key=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    token = Column(String, unique=True, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used = Column(Boolean, default=False, nullable=False)

    @staticmethod
    def generate(user_id: int) -> "PasswordResetToken":
        return PasswordResetToken(
            user_id=user_id,
            token=secrets.token_urlsafe(32),
            expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
        )

    @property
    def is_valid(self) -> bool:
        return not self.used and datetime.now(timezone.utc) < self.expires_at.replace(
            tzinfo=timezone.utc
        )
