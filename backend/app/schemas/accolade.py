from datetime import datetime

from pydantic import BaseModel, field_validator

from app.models.accolade import AccoladeCategory
from app.schemas.user import UserPublic


class AccoladeCreate(BaseModel):
    to_user_id: int
    category: AccoladeCategory
    message: str | None = None

    @field_validator("message")
    @classmethod
    def truncate_message(cls, v: str | None) -> str | None:
        return v[:200] if v else v


class AccoladeOut(BaseModel):
    id: int
    from_user: UserPublic
    to_user: UserPublic
    category: AccoladeCategory
    emoji: str
    message: str | None = None
    created_at: datetime | None = None

    class Config:
        from_attributes = True


class AccoladeSummary(BaseModel):
    """Compact version for profile cards."""

    category: AccoladeCategory
    emoji: str
    count: int


class AccoladeStats(BaseModel):
    total: int
    by_category: list[AccoladeSummary]
    recent: list[AccoladeOut]
