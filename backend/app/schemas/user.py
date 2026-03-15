import re
from datetime import date, datetime

from pydantic import BaseModel, EmailStr, field_validator

from app.models.user import CollegeDomain, CurrentStatus, EducationStage


class AchievementOut(BaseModel):
    id: int
    title: str
    description: str | None = None
    category: str
    icon: str | None = None
    points_awarded: int = 0
    awarded_at: datetime | None = None

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    username: str | None = None
    village_area: str | None = None
    date_of_birth: date | None = None
    current_status: CurrentStatus | None = None
    current_status_detail: str | None = None
    education: str | None = None
    bio: str | None = None
    phone: str | None = None
    education_stage: EducationStage | None = None
    school_grade: int | None = None
    college_name: str | None = None
    college_domain: CollegeDomain | None = None
    graduation_year: int | None = None
    avatar_key: str | None = None

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str | None) -> str | None:
        if v is None:
            return v
        v = v.lower().strip()
        if not (3 <= len(v) <= 30):
            raise ValueError("Username must be between 3 and 30 characters")
        if not re.match(r"^[a-z0-9_]+$", v):
            raise ValueError(
                "Username may only contain lowercase letters, digits, and underscores"
            )
        return v


class UserLogin(BaseModel):
    email_or_username: str  # accepts email or @-prefixed or plain username
    password: str


class UserUpdate(BaseModel):
    full_name: str | None = None
    username: str | None = None
    village_area: str | None = None
    date_of_birth: date | None = None
    current_status: CurrentStatus | None = None
    current_status_detail: str | None = None
    education: str | None = None
    bio: str | None = None
    phone: str | None = None
    education_stage: EducationStage | None = None
    school_grade: int | None = None
    college_name: str | None = None
    college_domain: CollegeDomain | None = None
    graduation_year: int | None = None
    avatar_key: str | None = None
    sports: str | None = None
    activities: str | None = None


# Public profile — visible to everyone (no phone)
class UserPublic(BaseModel):
    id: int
    full_name: str
    username: str | None = None
    photo_url: str | None = None
    village_area: str | None = None
    current_status: CurrentStatus | None = None
    current_status_detail: str | None = None
    education: str | None = None
    bio: str | None = None
    created_at: datetime | None = None
    education_stage: EducationStage | None = None
    school_grade: int | None = None
    college_name: str | None = None
    college_domain: CollegeDomain | None = None
    graduation_year: int | None = None
    sports: str | None = None
    activities: str | None = None
    points: int = 0
    avatar_key: str | None = None
    achievements: list[AchievementOut] = []

    class Config:
        from_attributes = True


# Private profile — visible to approved members (includes phone)
class UserPrivate(UserPublic):
    phone: str | None = None
    date_of_birth: date | None = None


# Full profile for the owner / admin
class UserAdminView(UserPrivate):
    email: str
    is_approved: bool
    is_admin: bool
    is_active: bool

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserAdminView


class LeaderboardEntry(BaseModel):
    rank: int
    user: UserPublic
