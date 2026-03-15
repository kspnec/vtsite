from sqlalchemy import Column, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class InitiativeProgressUpdate(Base):
    __tablename__ = "initiative_progress_updates"

    id = Column(Integer, primary_key=True, index=True)
    initiative_id = Column(
        Integer, ForeignKey("initiatives.id", ondelete="CASCADE"), nullable=False
    )
    author_id = Column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    initiative = relationship("Initiative", backref="progress_updates")
    author = relationship("User", foreign_keys=[author_id])
