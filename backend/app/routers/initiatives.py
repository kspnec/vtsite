from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from typing import Optional

from app.core.deps import get_current_user
from app.core.security import decode_access_token
from app.database import get_db
from app.models.initiative import Initiative, initiative_participants  # noqa: F401
from app.models.user import User
from app.schemas.initiative import InitiativeCreate, InitiativeOut, InitiativeUpdate
from app.schemas.user import UserPublic

router = APIRouter(prefix="/initiatives", tags=["initiatives"])

_bearer = HTTPBearer(auto_error=False)


def _optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
    db: Session = Depends(get_db),
) -> Optional[User]:
    if not credentials:
        return None
    try:
        user_id = decode_access_token(credentials.credentials)
        if not user_id:
            return None
        return db.query(User).filter(User.id == user_id, User.is_active == True).first()  # noqa: E712
    except Exception:
        return None


def _initiative_to_out(initiative: Initiative, current_user: Optional[User] = None) -> InitiativeOut:
    participant_ids = {p.id for p in initiative.participants}
    return InitiativeOut(
        id=initiative.id,
        title=initiative.title,
        description=initiative.description,
        status=initiative.status,
        category=initiative.category,
        lead_user=UserPublic.model_validate(initiative.lead_user) if initiative.lead_user else None,
        start_date=initiative.start_date,
        end_date=initiative.end_date,
        created_at=initiative.created_at,
        participants=[UserPublic.model_validate(p) for p in initiative.participants],
        participant_count=len(initiative.participants),
        is_participant=current_user.id in participant_ids if current_user else False,
    )


@router.get("", response_model=list[InitiativeOut])
def list_initiatives(
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(_optional_user),
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
    current_user: Optional[User] = Depends(_optional_user),
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
        raise HTTPException(status_code=403, detail="Only approved members can join initiatives")
    initiative = db.query(Initiative).filter(Initiative.id == initiative_id).first()
    if not initiative:
        raise HTTPException(status_code=404, detail="Initiative not found")
    if current_user not in initiative.participants:
        initiative.participants.append(current_user)
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
