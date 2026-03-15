import enum

from sqlalchemy import Boolean, Column, Date, DateTime, Enum, Integer, String, Text
from sqlalchemy.sql import func

from app.database import Base


class CurrentStatus(str, enum.Enum):
    job = "job"
    studying = "studying"
    business = "business"
    farming = "farming"
    other = "other"


class EducationStage(str, enum.Enum):
    school = "school"
    college = "college"
    working = "working"
    other = "other"


class CollegeDomain(str, enum.Enum):
    engineering = "engineering"
    medicine = "medicine"
    arts = "arts"
    science = "science"
    commerce = "commerce"
    law = "law"
    other = "other"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String(30), unique=True, nullable=True, index=True)
    hashed_password = Column(String, nullable=False)

    # Profile fields
    full_name = Column(String, nullable=False)
    photo_url = Column(String, nullable=True)
    date_of_birth = Column(Date, nullable=True)
    village_area = Column(String, nullable=True)
    current_status = Column(Enum(CurrentStatus), nullable=True)
    current_status_detail = Column(
        String, nullable=True
    )  # e.g. "Software Engineer at TCS"
    education = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    phone = Column(String, nullable=True)  # shown only to approved members

    # Education fields
    education_stage = Column(Enum(EducationStage), nullable=True)
    school_grade = Column(Integer, nullable=True)  # 1-12 for school students
    college_name = Column(String, nullable=True)
    college_domain = Column(Enum(CollegeDomain), nullable=True)
    graduation_year = Column(Integer, nullable=True)

    # Community fields
    sports = Column(String, nullable=True)  # comma-separated
    activities = Column(String, nullable=True)  # comma-separated
    points = Column(Integer, default=0, nullable=False, server_default="0")
    avatar_key = Column(String, nullable=True)  # key like "cosmos-1" for prebuilt avatars

    # System fields
    is_active = Column(Boolean, default=True)
    is_approved = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
