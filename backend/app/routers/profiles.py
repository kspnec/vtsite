from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.deps import get_approved_user
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserPrivate, UserPublic

router = APIRouter(prefix="/profiles", tags=["profiles"])


@router.get("", response_model=list[UserPublic])
def list_profiles(
    village_area: str | None = Query(None),
    current_status: str | None = Query(None),
    db: Session = Depends(get_db),
):
    """Public endpoint — returns all approved profiles."""
    query = db.query(User).filter(User.is_approved == True, User.is_active == True)
    if village_area:
        query = query.filter(User.village_area.ilike(f"%{village_area}%"))
    if current_status:
        query = query.filter(User.current_status == current_status)
    return query.order_by(User.full_name).all()


@router.get("/{user_id}", response_model=UserPublic)
def get_profile(user_id: int, db: Session = Depends(get_db)):
    """Public endpoint — returns one approved profile."""
    user = (
        db.query(User)
        .filter(User.id == user_id, User.is_approved == True, User.is_active == True)
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="Profile not found")
    return user


@router.get("/{user_id}/full", response_model=UserPrivate)
def get_full_profile(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_approved_user),
):
    """Approved members can see phone and date of birth."""
    user = (
        db.query(User)
        .filter(User.id == user_id, User.is_approved == True, User.is_active == True)
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="Profile not found")
    return user
