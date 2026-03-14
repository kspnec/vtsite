from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, EmailStr

from app.models.user import CurrentStatus


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    village_area: Optional[str] = None
    date_of_birth: Optional[date] = None
    current_status: Optional[CurrentStatus] = None
    current_status_detail: Optional[str] = None
    education: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    village_area: Optional[str] = None
    date_of_birth: Optional[date] = None
    current_status: Optional[CurrentStatus] = None
    current_status_detail: Optional[str] = None
    education: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None


# Public profile — visible to everyone (no phone)
class UserPublic(BaseModel):
    id: int
    full_name: str
    photo_url: Optional[str] = None
    village_area: Optional[str] = None
    current_status: Optional[CurrentStatus] = None
    current_status_detail: Optional[str] = None
    education: Optional[str] = None
    bio: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Private profile — visible to approved members (includes phone)
class UserPrivate(UserPublic):
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None


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
