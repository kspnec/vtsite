# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Village Connect — a community web app where village youngsters create profiles showing what they're doing. Anyone can view public profiles. Members sign up and get approved by an admin before their profile goes live.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 (App Router) + Tailwind CSS — `frontend/` |
| Backend API | FastAPI (Python) — `backend/` |
| Database | PostgreSQL via SQLAlchemy (models auto-created on startup) |
| Auth | JWT (python-jose + passlib/bcrypt) |
| Photo uploads | Cloudinary |

## Development Commands

### Backend (FastAPI)
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # fill in DATABASE_URL, SECRET_KEY, etc.
uvicorn app.main:app --reload --port 8000
```
API docs available at http://localhost:8000/docs

### Frontend (Next.js)
```bash
cd frontend
npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev                         # runs on http://localhost:3000
npm run build && npm run start      # production
npm run lint
```

## Architecture

### Backend (`backend/app/`)

- **`main.py`** — FastAPI app entry point, CORS, router registration, startup hook that runs `Base.metadata.create_all` and seeds the first admin from env vars
- **`models/user.py`** — Single `User` SQLAlchemy model with `CurrentStatus` enum (job/studying/business/farming/other). `is_approved` gates public visibility; `is_admin` gates the admin panel
- **`schemas/user.py`** — Three response shapes: `UserPublic` (everyone), `UserPrivate` (approved members — adds phone/DOB), `UserAdminView` (owner/admin — adds email, flags)
- **`routers/`** — Four routers: `auth` (signup/login/me/update), `profiles` (public list + detail, `/full` for approved members), `admin` (pending list, approve/reject/delete/make-admin), `upload` (Cloudinary photo)
- **`core/deps.py`** — Three FastAPI dependency functions: `get_current_user`, `get_approved_user`, `get_admin_user`

### Frontend (`frontend/src/`)

- **`context/AuthContext.tsx`** — Auth state (user + JWT token) persisted in `localStorage`. Provides `setSession`, `logout`, `isAdmin`, `isApproved`
- **`lib/api.ts`** — All API calls in one file, typed with exported interfaces
- **`lib/auth.ts`** — localStorage helpers for token/user persistence
- **App Router pages:**
  - `/` — Public profile grid with status filter chips (server component, `revalidate=60`)
  - `/profiles/[id]` — Public profile detail (server component)
  - `/auth/login` and `/auth/signup` — Auth forms (client components)
  - `/dashboard` — Member edits own profile + uploads photo
  - `/admin` — Admin approves/rejects pending members, manages all users

### Key Flows

1. **Signup**: user submits form → `POST /auth/signup` → user created with `is_approved=false` → admin sees them in pending list
2. **Approval**: admin hits Approve → `POST /admin/approve/{id}` → `is_approved=true` → profile appears on homepage
3. **Phone visibility**: public profiles omit phone; `/profiles/{id}/full` (requires approved JWT) returns phone number
4. **First admin**: Set `FIRST_ADMIN_EMAIL` + `FIRST_ADMIN_PASSWORD` in `.env` — created automatically on first startup

## Environment Variables

**Backend `.env`:**
- `DATABASE_URL` — PostgreSQL connection string
- `SECRET_KEY` — JWT signing secret (keep long and random)
- `CLOUDINARY_*` — cloud name, API key, API secret (skip if not using photos)
- `FIRST_ADMIN_EMAIL` / `FIRST_ADMIN_PASSWORD` — seeds initial admin on startup

**Frontend `.env.local`:**
- `NEXT_PUBLIC_API_URL` — backend URL (default `http://localhost:8000`)
