from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app.config import settings
from app.core.security import hash_password
from app.database import Base, SessionLocal, engine
from app.fixtures import seed_demo_profiles
from app.models import User, Achievement, Initiative  # noqa: F401 - ensures tables are created
from app.routers import admin, auth, profiles, upload
from app.routers import leaderboard, initiatives

app = FastAPI(
    title="VT Site API",
    description="Village community profiles API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(profiles.router)
app.include_router(admin.router)
app.include_router(upload.router)
app.include_router(leaderboard.router)
app.include_router(initiatives.router)

# Serve locally-uploaded profile photos
_uploads_dir = Path("/app/uploads")
_uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(_uploads_dir)), name="static")


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    _seed_admin()
    _seed_fixtures()


def _seed_fixtures():
    if not settings.SEED_DEMO_DATA:
        return
    db: Session = SessionLocal()
    try:
        added = seed_demo_profiles(db)
        if added:
            print(f"[startup] Seeded {added} demo profiles.")
    finally:
        db.close()


def _seed_admin():
    if not settings.FIRST_ADMIN_EMAIL:
        return
    db: Session = SessionLocal()
    try:
        exists = db.query(User).filter(User.email == settings.FIRST_ADMIN_EMAIL).first()
        if not exists:
            admin_user = User(
                email=settings.FIRST_ADMIN_EMAIL,
                hashed_password=hash_password(settings.FIRST_ADMIN_PASSWORD),
                full_name="Admin",
                is_approved=True,
                is_admin=True,
            )
            db.add(admin_user)
            db.commit()
    finally:
        db.close()


@app.get("/health")
def health():
    return {"status": "ok"}
