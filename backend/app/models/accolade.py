import enum

from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class AccoladeCategory(str, enum.Enum):
    hardworking = "hardworking"
    inspiring = "inspiring"
    helpful = "helpful"
    creative = "creative"
    leader = "leader"
    sporty = "sporty"
    academic = "academic"
    kind = "kind"


ACCOLADE_EMOJI = {
    "hardworking": "💪",
    "inspiring": "✨",
    "helpful": "🤝",
    "creative": "🎨",
    "leader": "⭐",
    "sporty": "🏆",
    "academic": "📚",
    "kind": "❤️",
}


class Accolade(Base):
    __tablename__ = "accolades"
    id = Column(Integer, primary_key=True, index=True)
    from_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    to_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category = Column(Enum(AccoladeCategory), nullable=False)
    message = Column(String(200), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    from_user = relationship("User", foreign_keys=[from_user_id], backref="given_accolades")
    to_user = relationship("User", foreign_keys=[to_user_id], backref="received_accolades")

    __table_args__ = (
        # One accolade per (from_user, to_user, category) combination
        UniqueConstraint("from_user_id", "to_user_id", "category", name="uq_accolade_per_category"),
    )
