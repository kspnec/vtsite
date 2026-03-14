from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, EducationStage
from app.schemas.user import UserPublic, LeaderboardEntry

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


@router.get("", response_model=list[LeaderboardEntry])
def get_leaderboard(
    category: str | None = Query(None, description="school_primary|school_middle|school_high|school_higher|college|working|all"),
    db: Session = Depends(get_db),
):
    q = db.query(User).filter(User.is_approved == True, User.is_active == True)  # noqa: E712

    if category == "school_primary":
        q = q.filter(User.education_stage == EducationStage.school, User.school_grade >= 1, User.school_grade <= 5)
    elif category == "school_middle":
        q = q.filter(User.education_stage == EducationStage.school, User.school_grade >= 6, User.school_grade <= 8)
    elif category == "school_high":
        q = q.filter(User.education_stage == EducationStage.school, User.school_grade >= 9, User.school_grade <= 10)
    elif category == "school_higher":
        q = q.filter(User.education_stage == EducationStage.school, User.school_grade >= 11, User.school_grade <= 12)
    elif category == "college":
        q = q.filter(User.education_stage == EducationStage.college)
    elif category == "working":
        q = q.filter(User.education_stage == EducationStage.working)

    users = q.order_by(User.points.desc(), User.full_name).all()

    return [
        LeaderboardEntry(rank=i + 1, user=UserPublic.model_validate(u))
        for i, u in enumerate(users)
    ]
