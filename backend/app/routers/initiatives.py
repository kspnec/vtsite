from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.security import decode_access_token
from app.database import get_db
from app.models.initiative import Initiative, initiative_participants  # noqa: F401
from app.models.initiative_update import InitiativeProgressUpdate
from app.models.notification import NotificationType
from app.models.user import User
from app.schemas.initiative import (
    InitiativeCreate,
    InitiativeOut,
    InitiativeUpdate,
    ProgressUpdateCreate,
    ProgressUpdateOut,
)
from app.schemas.user import UserPublic
from app.services.notifications import notify

router = APIRouter(prefix="/initiatives", tags=["initiatives"])

_bearer = HTTPBearer(auto_error=False)


def _optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User | None:
    if not credentials:
        return None
    try:
        user_id = decode_access_token(credentials.credentials)
        if not user_id:
            return None
        return db.query(User).filter(User.id == user_id, User.is_active == True).first()  # noqa: E712
    except Exception:
        return None


def _initiative_to_out(
    initiative: Initiative, current_user: User | None = None
) -> InitiativeOut:
    participant_ids = {p.id for p in initiative.participants}
    return InitiativeOut(
        id=initiative.id,
        title=initiative.title,
        description=initiative.description,
        status=initiative.status,
        category=initiative.category,
        lead_user=UserPublic.model_validate(initiative.lead_user)
        if initiative.lead_user
        else None,
        start_date=initiative.start_date,
        end_date=initiative.end_date,
        created_at=initiative.created_at,
        participants=[UserPublic.model_validate(p) for p in initiative.participants],
        participant_count=len(initiative.participants),
        is_participant=current_user.id in participant_ids if current_user else False,
    )


@router.get("", response_model=list[InitiativeOut])
def list_initiatives(
    status: str | None = Query(None),
    category: str | None = Query(None),
    current_user: User | None = Depends(_optional_user),
    db: Session = Depends(get_db),
):
    q = db.query(Initiative)
    if status:
        q = q.filter(Initiative.status == status)
    if category:
        q = q.filter(Initiative.category == category)
    initiatives = q.order_by(Initiative.created_at.desc()).all()
    return [_initiative_to_out(i, current_user) for i in initiatives]


@router.get("/{initiative_id}", response_model=InitiativeOut)
def get_initiative(
    initiative_id: int,
    current_user: User | None = Depends(_optional_user),
    db: Session = Depends(get_db),
):
    initiative = db.query(Initiative).filter(Initiative.id == initiative_id).first()
    if not initiative:
        raise HTTPException(status_code=404, detail="Initiative not found")
    return _initiative_to_out(initiative, current_user)


@router.post("", response_model=InitiativeOut, status_code=201)
def create_initiative(
    payload: InitiativeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    lead = (
        db.query(User)
        .filter(User.id == payload.lead_user_id, User.is_active == True)
        .first()
    )  # noqa: E712
    if not lead:
        raise HTTPException(status_code=400, detail="Lead user not found or inactive")
    initiative = Initiative(**payload.model_dump())
    db.add(initiative)
    db.commit()
    db.refresh(initiative)
    return _initiative_to_out(initiative, current_user)


@router.put("/{initiative_id}", response_model=InitiativeOut)
def update_initiative(
    initiative_id: int,
    payload: InitiativeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    initiative = db.query(Initiative).filter(Initiative.id == initiative_id).first()
    if not initiative:
        raise HTTPException(status_code=404, detail="Initiative not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(initiative, field, value)
    db.commit()
    db.refresh(initiative)
    return _initiative_to_out(initiative, current_user)


@router.delete("/{initiative_id}", status_code=204)
def delete_initiative(
    initiative_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    initiative = db.query(Initiative).filter(Initiative.id == initiative_id).first()
    if not initiative:
        raise HTTPException(status_code=404, detail="Initiative not found")
    db.delete(initiative)
    db.commit()


@router.post("/{initiative_id}/join", response_model=InitiativeOut)
def join_initiative(
    initiative_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.is_approved:
        raise HTTPException(
            status_code=403, detail="Only approved members can join initiatives"
        )
    initiative = db.query(Initiative).filter(Initiative.id == initiative_id).first()
    if not initiative:
        raise HTTPException(status_code=404, detail="Initiative not found")
    if current_user not in initiative.participants:
        # Collect everyone to notify BEFORE appending the new member
        existing_participant_ids = {p.id for p in initiative.participants}
        # Add the lead to the notify set too (may not be a participant themselves)
        if initiative.lead_user_id:
            existing_participant_ids.add(initiative.lead_user_id)
        # Remove the joiner themselves — don't self-notify
        existing_participant_ids.discard(current_user.id)

        initiative.participants.append(current_user)

        # Notify all existing members of this initiative group
        msg = f'{current_user.full_name} joined the initiative "{initiative.title}"'
        for uid in existing_participant_ids:
            notify(
                db,
                user_id=uid,
                type=NotificationType.initiative_joined,
                message=msg,
                actor_id=current_user.id,
            )
        db.commit()
        db.refresh(initiative)
    return _initiative_to_out(initiative, current_user)


@router.delete("/{initiative_id}/leave", response_model=InitiativeOut)
def leave_initiative(
    initiative_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    initiative = db.query(Initiative).filter(Initiative.id == initiative_id).first()
    if not initiative:
        raise HTTPException(status_code=404, detail="Initiative not found")
    if current_user in initiative.participants:
        initiative.participants.remove(current_user)
        db.commit()
        db.refresh(initiative)
    return _initiative_to_out(initiative, current_user)


@router.get("/{initiative_id}/progress", response_model=list[ProgressUpdateOut])
def list_progress_updates(
    initiative_id: int,
    current_user: User | None = Depends(_optional_user),
    db: Session = Depends(get_db),
):
    if not db.query(Initiative).filter(Initiative.id == initiative_id).first():
        raise HTTPException(status_code=404, detail="Initiative not found")
    updates = (
        db.query(InitiativeProgressUpdate)
        .filter(InitiativeProgressUpdate.initiative_id == initiative_id)
        .order_by(InitiativeProgressUpdate.created_at.desc())
        .all()
    )
    return [
        ProgressUpdateOut(
            id=u.id,
            content=u.content,
            author=u.author,
            created_at=u.created_at,
        )
        for u in updates
    ]


@router.post(
    "/{initiative_id}/progress", response_model=ProgressUpdateOut, status_code=201
)
def add_progress_update(
    initiative_id: int,
    payload: ProgressUpdateCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    if not db.query(Initiative).filter(Initiative.id == initiative_id).first():
        raise HTTPException(status_code=404, detail="Initiative not found")
    update = InitiativeProgressUpdate(
        initiative_id=initiative_id,
        author_id=current_user.id,
        content=payload.content,
    )
    db.add(update)
    db.commit()
    db.refresh(update)
    return ProgressUpdateOut(
        id=update.id,
        content=update.content,
        author=update.author,
        created_at=update.created_at,
    )


@router.delete("/{initiative_id}/progress/{update_id}", status_code=204)
def delete_progress_update(
    initiative_id: int,
    update_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    update = (
        db.query(InitiativeProgressUpdate)
        .filter(
            InitiativeProgressUpdate.id == update_id,
            InitiativeProgressUpdate.initiative_id == initiative_id,
        )
        .first()
    )
    if not update:
        raise HTTPException(status_code=404, detail="Update not found")
    db.delete(update)
    db.commit()
