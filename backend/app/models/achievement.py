import enum

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class AchievementCategory(str, enum.Enum):
    academic = "academic"
    sports = "sports"
    cultural = "cultural"
    community = "community"
    leadership = "leadership"


class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(Enum(AchievementCategory), nullable=False)
    icon = Column(String, nullable=True)  # emoji or icon key
    points_awarded = Column(Integer, default=0)
    awarded_at = Column(DateTime(timezone=True), server_default=func.now())
    awarded_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    user = relationship("User", foreign_keys=[user_id], backref="achievements")
    awarded_by = relationship("User", foreign_keys=[awarded_by_id])
