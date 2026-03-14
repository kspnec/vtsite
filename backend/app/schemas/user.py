from datetime import date, datetime

from pydantic import BaseModel, EmailStr

from app.models.user import CurrentStatus


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    village_area: str | None = None
    date_of_birth: date | None = None
    current_status: CurrentStatus | None = None
    current_status_detail: str | None = None
    education: str | None = None
    bio: str | None = None
    phone: str | None = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    full_name: str | None = None
    village_area: str | None = None
    date_of_birth: date | None = None
    current_status: CurrentStatus | None = None
    current_status_detail: str | None = None
    education: str | None = None
    bio: str | None = None
    phone: str | None = None


# Public profile — visible to everyone (no phone)
class UserPublic(BaseModel):
    id: int
    full_name: str
    photo_url: str | None = None
    village_area: str | None = None
    current_status: CurrentStatus | None = None
    current_status_detail: str | None = None
    education: str | None = None
    bio: str | None = None
    created_at: datetime | None = None

    class Config:
        from_attributes = True


# Private profile — visible to approved members (includes phone)
class UserPrivate(UserPublic):
    phone: str | None = None
    date_of_birth: date | None = None


# Full profile for the owner / admin
class UserAdminView(UserPrivate):
    email: str
    is_approved: bool
    is_admin: bool
    is_active: bool

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserAdminView
