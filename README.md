# Village Connect

A community web app for village youngsters to showcase their profiles — where they are, what they're doing, and what they've achieved. Anyone can browse public profiles. New members sign up and go live only after admin approval.

---

## Features

- **Public directory** — browsable profile cards with status filters (Working, Studying, Business, Farming, Other)
- **Admin approval flow** — all new signups (email or Google) are pending until an admin approves
- **Three visibility tiers** — public (everyone), private details like phone (approved members only), full view (admin)
- **Google OAuth** — sign in / sign up with Google; same pending-approval flow applies
- **Profile photo upload** — uploads to Cloudinary in production; falls back to local storage in dev
- **Admin panel** — approve / reject / delete users, promote to admin, tabs for pending vs all members
- **Dashboard** — logged-in users edit their own profile and upload a photo while pending approval

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), Tailwind CSS, TypeScript |
| Backend | FastAPI (Python 3.12), SQLAlchemy 2, Pydantic v2 |
| Database | PostgreSQL 16 |
| Auth | JWT (python-jose), Google OAuth 2.0 |
| Photos | Cloudinary (production) / local filesystem (dev) |
| Containers | Docker / Podman via Compose |
| CI/CD | GitHub Actions → ghcr.io |
| E2E Tests | Playwright (Chromium) |

---

## Quick Start

### Prerequisites
- Docker or Podman with Compose
- (Optional) Google OAuth credentials for social login

### 1. Clone and configure

```bash
git clone https://github.com/kspnec/vtsite.git
cd vtsite
```

Copy the example env file and fill in your values:

```bash
cp .env.example .env   # see Environment Variables below
```

Or edit `docker-compose.yml` directly for local dev — the defaults work out of the box with no external services.

### 2. Start all services

```bash
# Docker
docker compose up -d

# Podman
/opt/podman/bin/podman compose up -d
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |

### 3. Default admin credentials

```
Email:    admin@village.com
Password: admin123
```

The first run seeds 15 demo profiles automatically (`SEED_DEMO_DATA=true`).

---

## Environment Variables

All backend variables are set in `docker-compose.yml` or a `.env` file in `backend/`.

### Required

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SECRET_KEY` | JWT signing secret — change in production |
| `FIRST_ADMIN_EMAIL` | Email for the auto-created admin account |
| `FIRST_ADMIN_PASSWORD` | Password for the auto-created admin account |

### Optional

| Variable | Default | Description |
|---|---|---|
| `ALGORITHM` | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `10080` | Token lifetime (7 days) |
| `SEED_DEMO_DATA` | `false` | Seed 15 demo profiles on first startup |
| `BACKEND_BASE_URL` | `http://localhost:8000` | Used to build URLs for locally-stored uploads |
| `FRONTEND_URL` | `http://localhost:3000` | Used for OAuth redirects |
| `CLOUDINARY_CLOUD_NAME` | `""` | Cloudinary — leave blank to use local storage |
| `CLOUDINARY_API_KEY` | `""` | |
| `CLOUDINARY_API_SECRET` | `""` | |
| `GOOGLE_CLIENT_ID` | `""` | Google OAuth — leave blank to disable |
| `GOOGLE_CLIENT_SECRET` | `""` | |
| `GOOGLE_REDIRECT_URI` | `http://localhost:8000/auth/google/callback` | |

### Frontend

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend URL used by the browser (baked at build time) |
| `API_URL` | Backend URL used by Next.js SSR inside the container |

---

## Google OAuth Setup

1. Open [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**
2. Create an **OAuth 2.0 Client ID** (type: Web application)
3. Add to **Authorised redirect URIs**:
   - Development: `http://localhost:8000/auth/google/callback`
   - Production: `https://yourdomain.com/api/auth/google/callback`
4. Copy the Client ID and Secret into `docker-compose.yml`:
   ```yaml
   GOOGLE_CLIENT_ID: "your-client-id.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET: "your-secret"
   ```
5. Rebuild and restart: `docker compose up -d --build backend`

> All Google-registered users still require admin approval before their profile goes public.

---

## Development

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements-dev.txt

# Run dev server (SQLite, no Docker needed)
DATABASE_URL=sqlite:///./dev.db \
SECRET_KEY=dev-secret \
uvicorn app.main:app --reload --port 8000
```

```bash
# Lint
ruff check .
ruff format --check .

# Tests (uses SQLite in-memory, no postgres needed)
pytest tests/ -v --cov=app --cov-report=term-missing

# Single test file
pytest tests/test_auth.py -v
```

### Frontend

```bash
cd frontend
npm install

# Dev server (requires backend running on :8000)
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev

# Type check + lint
npx tsc --noEmit
npm run lint

# Build
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run build
```

### E2E Tests (Playwright)

Requires both backend and frontend running.

```bash
cd frontend

# Run all tests
BASE_URL=http://localhost:3000 npx playwright test

# Run a single spec
BASE_URL=http://localhost:3000 npx playwright test e2e/auth.spec.ts

# Interactive UI mode
npx playwright test --ui
```

---

## Project Structure

```
vtsite/
├── backend/
│   ├── app/
│   │   ├── routers/        # auth, profiles, admin, upload
│   │   ├── models/         # SQLAlchemy User model
│   │   ├── schemas/        # Pydantic schemas (UserPublic / UserPrivate / UserAdminView)
│   │   ├── core/           # JWT, password hashing, auth dependencies
│   │   ├── services/       # Cloudinary / local upload
│   │   ├── fixtures.py     # Demo profile seed data
│   │   └── main.py         # App factory, CORS, startup hooks
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── app/            # Next.js App Router pages
│   │   │   ├── page.tsx            # Homepage — public profile grid
│   │   │   ├── profiles/[id]/      # Profile detail
│   │   │   ├── dashboard/          # Logged-in user's own profile editor
│   │   │   ├── admin/              # Admin approval panel
│   │   │   └── auth/               # login / signup / callback pages
│   │   ├── components/     # Navbar, ProfileCard, FilterBar, GoogleButton
│   │   ├── context/        # AuthContext (JWT + user stored in localStorage)
│   │   └── lib/            # API client (api.ts), auth helpers (auth.ts)
│   └── e2e/                # Playwright specs
├── .github/workflows/
│   ├── ci.yml              # Lint → test → build → E2E on every push
│   └── cd.yml              # Build & push images to ghcr.io on main/develop
└── docker-compose.yml
```

---

## CI/CD

### Continuous Integration (`ci.yml`)

Runs on every push to `develop`, `feature/**`, `release/**`, `hotfix/**` and on PRs to `main`/`develop`.

| Job | What it checks |
|---|---|
| `backend-lint` | `ruff check` + `ruff format` |
| `backend-test` | `pytest` with coverage report |
| `frontend-lint` | ESLint + `tsc --noEmit` |
| `frontend-build` | `next build` |
| `e2e` | Full Playwright suite against a live stack (SQLite backend + Next.js) |

### Continuous Delivery (`cd.yml`)

Triggers on push to `main` (→ `latest` tag) or `develop` (→ `staging` tag), and on GitHub releases (→ semver tags).

Builds and pushes to:
- `ghcr.io/kspnec/vtsite-backend`
- `ghcr.io/kspnec/vtsite-frontend`

Includes Trivy security scanning with results posted to the GitHub Step Summary.

### Branching Strategy (GitFlow)

| Branch | Purpose |
|---|---|
| `main` | Production — protected, requires PR + review + CI |
| `develop` | Staging — integration branch |
| `feature/*` | New features — branch from `develop` |
| `release/*` | Release prep — branch from `develop`, merge to `main` + `develop` |
| `hotfix/*` | Urgent production fixes — branch from `main` |

---

## API Reference

Full interactive docs at **http://localhost:8000/docs** when running locally.

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/profiles` | — | List approved public profiles (filterable) |
| `GET` | `/profiles/{id}` | — | Single public profile |
| `GET` | `/profiles/{id}/full` | Approved member | Profile with phone + DOB |
| `POST` | `/auth/signup` | — | Register (pending approval) |
| `POST` | `/auth/login` | — | Email/password login → JWT |
| `GET` | `/auth/google` | — | Start Google OAuth flow |
| `GET` | `/auth/google/callback` | — | Google OAuth callback |
| `GET` | `/auth/me` | Any member | Get own profile |
| `PUT` | `/auth/me` | Any member | Update own profile |
| `POST` | `/upload/photo` | Any member | Upload profile photo |
| `GET` | `/admin/pending` | Admin | List pending users |
| `GET` | `/admin/users` | Admin | List all users |
| `POST` | `/admin/approve/{id}` | Admin | Approve a user |
| `POST` | `/admin/reject/{id}` | Admin | Reject a user |
| `POST` | `/admin/make-admin/{id}` | Admin | Promote to admin |
| `DELETE` | `/admin/users/{id}` | Admin | Delete a user |
