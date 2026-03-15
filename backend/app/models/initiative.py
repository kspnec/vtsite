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


class InitiativeStatus(str, enum.Enum):
    planned = "planned"
    ongoing = "ongoing"
    completed = "completed"


class InitiativeCategory(str, enum.Enum):
    education = "education"
    sports = "sports"
    environment = "environment"
    infrastructure = "infrastructure"
    arts = "arts"
    health = "health"
    technology = "technology"
    other = "other"


initiative_participants = Table(
    "initiative_participants",
    Base.metadata,
    Column("initiative_id", Integer, ForeignKey("initiatives.id", ondelete="CASCADE"), primary_key=True),
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("joined_at", DateTime(timezone=True), server_default=func.now()),
)


class Initiative(Base):
    __tablename__ = "initiatives"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(Enum(InitiativeStatus), default=InitiativeStatus.planned, nullable=False)
    category = Column(Enum(InitiativeCategory), nullable=False)
    lead_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    lead_user = relationship("User", foreign_keys=[lead_user_id], backref="led_initiatives")
    participants = relationship("User", secondary=initiative_participants, backref="joined_initiatives")
