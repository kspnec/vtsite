import secrets

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.deps import get_admin_user, get_current_user
from app.core.security import hash_password
from app.database import get_db
from app.models.accolade import Accolade
from app.models.achievement import Achievement, AchievementCategory
from app.models.event import event_attendees
from app.models.initiative import initiative_participants
from app.models.notification import Notification, NotificationType
from app.models.password_reset import PasswordResetToken
from app.models.user import User
from app.schemas.user import AchievementOut, UserAdminView
from app.services.notifications import notify

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/pending", response_model=list[UserAdminView])
def list_pending(
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    return (
        db.query(User)
        .filter(User.is_approved == False, User.is_active == True)
        .order_by(User.created_at)
        .all()
    )


@router.get("/users", response_model=list[UserAdminView])
def list_all_users(
    approved: bool | None = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    query = db.query(User)
    if approved is not None:
        query = query.filter(User.is_approved == approved)
    return query.order_by(User.created_at.desc()).all()


@router.post("/approve/{user_id}", response_model=UserAdminView)
def approve_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_approved = True
    notify(
        db,
        user_id=user_id,
        type=NotificationType.account_approved,
        message="Your profile has been approved! Welcome to VTRockers Connect 🎉",
    )
    db.commit()
    db.refresh(user)
    return user


@router.post("/reject/{user_id}", response_model=UserAdminView)
def reject_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_approved = False
    user.is_active = False
    db.commit()
    db.refresh(user)
    return user


@router.post("/disable/{user_id}", response_model=UserAdminView)
def disable_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot disable yourself")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = False
    db.commit()
    db.refresh(user)
    return user


@router.post("/enable/{user_id}", response_model=UserAdminView)
def enable_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = True
    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # Approved users must be disabled first
    if user.is_approved and user.is_active:
        raise HTTPException(status_code=400, detail="Disable the user before deleting")
    # Cascade-delete related data
    db.query(Accolade).filter(
        (Accolade.from_user_id == user_id) | (Accolade.to_user_id == user_id)
    ).delete(synchronize_session=False)
    db.query(Achievement).filter(Achievement.user_id == user_id).delete(synchronize_session=False)
    db.query(PasswordResetToken).filter(PasswordResetToken.user_id == user_id).delete(synchronize_session=False)
    db.query(Notification).filter(
        (Notification.user_id == user_id) | (Notification.actor_id == user_id)
    ).delete(synchronize_session=False)
    db.execute(initiative_participants.delete().where(initiative_participants.c.user_id == user_id))
    db.execute(event_attendees.delete().where(event_attendees.c.user_id == user_id))
    db.delete(user)
    db.commit()


@router.post("/make-admin/{user_id}", response_model=UserAdminView)
def make_admin(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot change your own admin status")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_admin = True
    db.commit()
    db.refresh(user)
    return user


@router.post("/remove-admin/{user_id}", response_model=UserAdminView)
def remove_admin(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot remove your own admin status")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_admin = False
    db.commit()
    db.refresh(user)
    return user


@router.post("/users/{user_id}/award", response_model=AchievementOut)
def award_achievement(
    user_id: int,
    title: str = Body(...),
    description: str | None = Body(None),
    category: AchievementCategory = Body(...),
    icon: str | None = Body(None),
    points_awarded: int = Body(0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    achievement = Achievement(
        user_id=user_id,
        title=title,
        description=description,
        category=category,
        icon=icon,
        points_awarded=points_awarded,
        awarded_by_id=current_user.id,
    )
    db.add(achievement)
    user.points = (user.points or 0) + points_awarded
    icon_str = icon or "🏅"
    notify(
        db,
        user_id=user_id,
        type=NotificationType.achievement_awarded,
        message=f"You were awarded a new achievement: {icon_str} {title}!",
        actor_id=current_user.id,
    )
    db.commit()
    db.refresh(achievement)
    return achievement


@router.post("/create-profile", response_model=UserAdminView, status_code=201)
def create_profile(
    full_name: str = Body(...),
    email: str | None = Body(None),
    village_area: str | None = Body(None),
    bio: str | None = Body(None),
    current_status: str | None = Body(None),
    phone: str | None = Body(None),
    education_stage: str | None = Body(None),
    school_grade: int | None = Body(None),
    college_name: str | None = Body(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    """Admin creates a profile on behalf of an offline/uneducated villager."""
    if email:
        if db.query(User).filter(User.email == email).first():
            raise HTTPException(status_code=400, detail="Email already registered")
        resolved_email = email
    else:
        resolved_email = f"offline_{secrets.token_hex(6)}@vtrockers.internal"

    user = User(
        email=resolved_email,
        hashed_password=hash_password(secrets.token_urlsafe(20)),
        full_name=full_name,
        village_area=village_area,
        bio=bio,
        current_status=current_status,
        phone=phone,
        education_stage=education_stage,
        school_grade=school_grade,
        college_name=college_name,
        is_approved=True,
        is_active=True,
        is_admin=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.put("/users/{user_id}/profile", response_model=UserAdminView)
def admin_update_profile(
    user_id: int,
    school_grade: int | None = Body(None),
    education_stage: str | None = Body(None),
    college_name: str | None = Body(None),
    village_area: str | None = Body(None),
    bio: str | None = Body(None),
    current_status: str | None = Body(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    """Admin updates any user's profile fields."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    updates = {
        "school_grade": school_grade,
        "education_stage": education_stage,
        "college_name": college_name,
        "village_area": village_area,
        "bio": bio,
        "current_status": current_status,
    }
    for field, value in updates.items():
        if value is not None:
            setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


@router.put("/users/{user_id}/points")
def update_points(
    user_id: int,
    points: int = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.points = points
    db.commit()
    return {"points": user.points}
