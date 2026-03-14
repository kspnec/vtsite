from datetime import date, datetime

from pydantic import BaseModel

from app.models.initiative import InitiativeStatus, InitiativeCategory
from app.schemas.user import UserPublic


class InitiativeCreate(BaseModel):
    title: str
    description: str | None = None
    status: InitiativeStatus = InitiativeStatus.planned
    category: InitiativeCategory
    lead_user_id: int | None = None
    start_date: date | None = None
    end_date: date | None = None


class InitiativeUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: InitiativeStatus | None = None
    category: InitiativeCategory | None = None
    lead_user_id: int | None = None
    start_date: date | None = None
    end_date: date | None = None


class InitiativeOut(BaseModel):
    id: int
    title: str
    description: str | None = None
    status: InitiativeStatus
    category: InitiativeCategory
    lead_user: UserPublic | None = None
    start_date: date | None = None
    end_date: date | None = None
    created_at: datetime | None = None
    participants: list[UserPublic] = []
    participant_count: int = 0
    is_participant: bool = False  # whether the requesting user is a participant

    class Config:
        from_attributes = True
