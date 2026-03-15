import enum

from sqlalchemy import (
    Column,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class EventType(str, enum.Enum):
    festival = "festival"
    sports = "sports"
    cultural = "cultural"
    educational = "educational"
    health = "health"
    community = "community"
    other = "other"


event_attendees = Table(
    "event_attendees",
    Base.metadata,
    Column(
        "event_id",
        Integer,
        ForeignKey("events.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    ),
    Column("joined_at", DateTime(timezone=True), server_default=func.now()),
)


class Event(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    event_type = Column(Enum(EventType), nullable=False, default=EventType.other)
    event_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    location = Column(String, nullable=True)
    cover_emoji = Column(String, nullable=True)  # e.g. "🎉" or "🏏"
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    created_by = relationship(
        "User", foreign_keys=[created_by_id], backref="created_events"
    )
    attendees = relationship(
        "User", secondary=event_attendees, backref="attending_events"
    )
