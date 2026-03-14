import base64
import secrets
import urllib.parse

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.config import settings
from app.core.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.database import get_db
from app.models.user import User
from app.schemas.user import Token, UserAdminView, UserCreate, UserLogin, UserUpdate

router = APIRouter(prefix="/auth", tags=["auth"])

_GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
_GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
_GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(payload: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        village_area=payload.village_area,
        date_of_birth=payload.date_of_birth,
        current_status=payload.current_status,
        current_status_detail=payload.current_status_detail,
        education=payload.education,
        bio=payload.bio,
        phone=payload.phone,
        is_approved=False,
        is_admin=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {
        "message": "Registration successful. Your profile is pending admin approval."
    }


@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = (
        db.query(User)
        .filter(User.email == payload.email, User.is_active == True)  # noqa: E712
        .first()
    )
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user.id)
    return Token(access_token=token, user=UserAdminView.model_validate(user))


@router.get("/me", response_model=UserAdminView)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserAdminView)
def update_profile(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


# ── Google OAuth ───────────────────────────────────────────────────────────────


@router.get("/google")
def google_login():
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=400, detail="Google OAuth is not configured")
    state = secrets.token_urlsafe(32)
    params = urllib.parse.urlencode(
        {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
            "access_type": "offline",
            "prompt": "select_account",
        }
    )
    response = RedirectResponse(f"{_GOOGLE_AUTH_URL}?{params}")
    response.set_cookie(
        "oauth_state", state, httponly=True, max_age=600, samesite="lax"
    )
    return response


@router.get("/google/callback")
async def google_callback(
    request: Request,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    db: Session = Depends(get_db),
):
    frontend = settings.FRONTEND_URL

    if error:
        return RedirectResponse(f"{frontend}/auth/login?error=google_denied")
    if not code or not state:
        return RedirectResponse(f"{frontend}/auth/login?error=missing_params")

    stored_state = request.cookies.get("oauth_state")
    if not stored_state or stored_state != state:
        return RedirectResponse(f"{frontend}/auth/login?error=invalid_state")

    async with httpx.AsyncClient() as client:
        # Exchange code for access token
        token_resp = await client.post(
            _GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
        )
        if not token_resp.is_success:
            return RedirectResponse(
                f"{frontend}/auth/login?error=token_exchange_failed"
            )

        access_token = token_resp.json().get("access_token")

        # Fetch user info from Google
        userinfo_resp = await client.get(
            _GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if not userinfo_resp.is_success:
            return RedirectResponse(f"{frontend}/auth/login?error=userinfo_failed")
        userinfo = userinfo_resp.json()

    email = userinfo.get("email")
    if not email or not userinfo.get("email_verified"):
        return RedirectResponse(f"{frontend}/auth/login?error=unverified_email")

    # Find or create the user (email is the single source of truth)
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            full_name=userinfo.get("name", email.split("@")[0]),
            photo_url=userinfo.get("picture"),
            # Random unusable password — Google users authenticate via Google only
            hashed_password=hash_password(secrets.token_urlsafe(32)),
            is_approved=False,
            is_admin=False,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    elif not user.is_active:
        return RedirectResponse(f"{frontend}/auth/login?error=account_disabled")
    else:
        # Backfill photo from Google if user has none
        if not user.photo_url and userinfo.get("picture"):
            user.photo_url = userinfo.get("picture")
            db.commit()
            db.refresh(user)

    jwt = create_access_token(user.id)
    # Encode user as URL-safe base64 JSON for the frontend callback page
    user_b64 = urllib.parse.quote(
        base64.b64encode(
            UserAdminView.model_validate(user).model_dump_json().encode()
        ).decode(),
        safe="",
    )
    response = RedirectResponse(f"{frontend}/auth/callback?token={jwt}&user={user_b64}")
    response.delete_cookie("oauth_state")
    return response
