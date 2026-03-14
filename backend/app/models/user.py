import enum
from datetime import datetime

from sqlalchemy import Boolean, Column, Date, DateTime, Enum, Integer, String, Text
from sqlalchemy.sql import func

from app.database import Base


class CurrentStatus(str, enum.Enum):
    job = "job"
    studying = "studying"
    business = "business"
    farming = "farming"
    other = "other"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    # Profile fields
    full_name = Column(String, nullable=False)
    photo_url = Column(String, nullable=True)
    date_of_birth = Column(Date, nullable=True)
    village_area = Column(String, nullable=True)
    current_status = Column(Enum(CurrentStatus), nullable=True)
    current_status_detail = Column(String, nullable=True)  # e.g. "Software Engineer at TCS"
    education = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    phone = Column(String, nullable=True)  # shown only to approved members

    # System fields
    is_active = Column(Boolean, default=True)
    is_approved = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
