from fastapi import APIRouter, Body, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.deps import get_admin_user, get_current_user
from app.database import get_db
from app.models.achievement import Achievement, AchievementCategory
from app.models.user import User
from app.schemas.user import AchievementOut, UserAdminView

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
    query = db.query(User).filter(User.is_active == True)
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
    db.delete(user)
    db.commit()


@router.post("/make-admin/{user_id}", response_model=UserAdminView)
def make_admin(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_admin = True
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
    db.commit()
    db.refresh(achievement)
    return achievement


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
