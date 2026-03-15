from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.accolade import ACCOLADE_EMOJI, Accolade, AccoladeCategory
from app.models.notification import NotificationType
from app.models.user import User
from app.schemas.accolade import (
    AccoladeCreate,
    AccoladeOut,
    AccoladeStats,
    AccoladeSummary,
)
from app.schemas.user import UserPublic
from app.services.notifications import notify

router = APIRouter(prefix="/accolades", tags=["accolades"])


def _to_out(a: Accolade) -> AccoladeOut:
    return AccoladeOut(
        id=a.id,
        from_user=UserPublic.model_validate(a.from_user),
        to_user=UserPublic.model_validate(a.to_user),
        category=a.category,
        emoji=ACCOLADE_EMOJI.get(a.category.value, "🏅"),
        message=a.message,
        created_at=a.created_at,
    )


@router.get("/user/{user_id}", response_model=AccoladeStats)
def get_user_accolades(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id, User.is_approved == True).first()  # noqa: E712
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    accolades = (
        db.query(Accolade)
        .filter(Accolade.to_user_id == user_id)
        .order_by(Accolade.created_at.desc())
        .all()
    )

    # Count by category
    category_counts: dict[str, int] = {}
    for a in accolades:
        category_counts[a.category.value] = category_counts.get(a.category.value, 0) + 1

    by_category = [
        AccoladeSummary(
            category=AccoladeCategory(cat),
            emoji=ACCOLADE_EMOJI.get(cat, "🏅"),
            count=count,
        )
        for cat, count in sorted(category_counts.items(), key=lambda x: -x[1])
    ]

    return AccoladeStats(
        total=len(accolades),
        by_category=by_category,
        recent=[_to_out(a) for a in accolades[:10]],
    )


@router.post("", response_model=AccoladeOut, status_code=201)
def give_accolade(
    payload: AccoladeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.is_approved:
        raise HTTPException(
            status_code=403, detail="Only approved members can give accolades"
        )
    if payload.to_user_id == current_user.id:
        raise HTTPException(
            status_code=400, detail="You cannot give an accolade to yourself"
        )

    to_user = (
        db.query(User)
        .filter(User.id == payload.to_user_id, User.is_approved == True)
        .first()
    )  # noqa: E712
    if not to_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if already given this category to this user
    existing = (
        db.query(Accolade)
        .filter(
            Accolade.from_user_id == current_user.id,
            Accolade.to_user_id == payload.to_user_id,
            Accolade.category == payload.category,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=409, detail="You've already given this accolade to this person"
        )

    accolade = Accolade(
        from_user_id=current_user.id,
        to_user_id=payload.to_user_id,
        category=payload.category,
        message=payload.message,
    )
    db.add(accolade)
    emoji = ACCOLADE_EMOJI.get(payload.category.value, "🏅")
    notify(
        db,
        user_id=payload.to_user_id,
        type=NotificationType.accolade_received,
        message=f"{current_user.full_name} gave you a {emoji} {payload.category.value} accolade!",
        actor_id=current_user.id,
    )
    db.commit()
    db.refresh(accolade)
    return _to_out(accolade)


@router.delete("/{accolade_id}", status_code=204)
def delete_accolade(
    accolade_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    accolade = db.query(Accolade).filter(Accolade.id == accolade_id).first()
    if not accolade:
        raise HTTPException(status_code=404, detail="Accolade not found")
    if accolade.from_user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    db.delete(accolade)
    db.commit()
