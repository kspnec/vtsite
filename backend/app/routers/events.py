from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from app.core.deps import get_current_user
from app.core.security import decode_access_token
from app.database import get_db
from app.models.event import Event
from app.models.user import User
from app.schemas.event import EventCreate, EventOut, EventUpdate
from app.schemas.user import UserPublic

router = APIRouter(prefix="/events", tags=["events"])

_bearer = HTTPBearer(auto_error=False)


def _optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User | None:
    if not credentials:
        return None
    try:
        user_id = decode_access_token(credentials.credentials)
        return db.query(User).filter(User.id == user_id, User.is_active == True).first()  # noqa: E712
    except Exception:
        return None


def _event_to_out(event: Event, current_user: User | None = None) -> EventOut:
    attendee_ids = {a.id for a in event.attendees}
    return EventOut(
        id=event.id,
        title=event.title,
        description=event.description,
        event_type=event.event_type,
        event_date=event.event_date,
        end_date=event.end_date,
        location=event.location,
        cover_emoji=event.cover_emoji,
        created_by=UserPublic.model_validate(event.created_by) if event.created_by else None,
        created_at=event.created_at,
        attendees=[UserPublic.model_validate(a) for a in event.attendees],
        attendee_count=len(event.attendees),
        is_attending=current_user.id in attendee_ids if current_user else False,
    )


@router.get("", response_model=list[EventOut])
def list_events(
    upcoming: bool | None = Query(None, description="true=upcoming, false=past, None=all"),
    event_type: str | None = Query(None),
    current_user: User | None = Depends(_optional_user),
    db: Session = Depends(get_db),
):
    from datetime import date
    q = db.query(Event)
    if upcoming is True:
        q = q.filter(Event.event_date >= date.today())
    elif upcoming is False:
        q = q.filter(Event.event_date < date.today())
    if event_type:
        q = q.filter(Event.event_type == event_type)
    events = q.order_by(Event.event_date.asc()).all()
    return [_event_to_out(e, current_user) for e in events]


@router.get("/{event_id}", response_model=EventOut)
def get_event(
    event_id: int,
    current_user: User | None = Depends(_optional_user),
    db: Session = Depends(get_db),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return _event_to_out(event, current_user)


@router.post("", response_model=EventOut, status_code=201)
def create_event(
    payload: EventCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    event = Event(**payload.model_dump(), created_by_id=current_user.id)
    db.add(event)
    db.commit()
    db.refresh(event)
    return _event_to_out(event, current_user)


@router.put("/{event_id}", response_model=EventOut)
def update_event(
    event_id: int,
    payload: EventUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(event, field, value)
    db.commit()
    db.refresh(event)
    return _event_to_out(event, current_user)


@router.delete("/{event_id}", status_code=204)
def delete_event(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(event)
    db.commit()


@router.post("/{event_id}/attend", response_model=EventOut)
def attend_event(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.is_approved:
        raise HTTPException(status_code=403, detail="Only approved members can attend events")
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if current_user not in event.attendees:
        event.attendees.append(current_user)
        db.commit()
        db.refresh(event)
    return _event_to_out(event, current_user)


@router.delete("/{event_id}/attend", response_model=EventOut)
def leave_event(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if current_user in event.attendees:
        event.attendees.remove(current_user)
        db.commit()
        db.refresh(event)
    return _event_to_out(event, current_user)
