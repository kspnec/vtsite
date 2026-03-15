from datetime import date, datetime

from pydantic import BaseModel

from app.models.event import EventType
from app.schemas.user import UserPublic


class EventCreate(BaseModel):
    title: str
    description: str | None = None
    event_type: EventType = EventType.other
    event_date: date
    end_date: date | None = None
    location: str | None = None
    cover_emoji: str | None = None


class EventUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    event_type: EventType | None = None
    event_date: date | None = None
    end_date: date | None = None
    location: str | None = None
    cover_emoji: str | None = None


class EventOut(BaseModel):
    id: int
    title: str
    description: str | None = None
    event_type: EventType
    event_date: date
    end_date: date | None = None
    location: str | None = None
    cover_emoji: str | None = None
    created_by: UserPublic | None = None
    created_at: datetime | None = None
    attendee_count: int = 0
    is_attending: bool = False
    attendees: list[UserPublic] = []

    class Config:
        from_attributes = True
