# Deploy vtsite

Step-by-step deployment guide for Village Connect. Two paths: **local/self-hosted** (Podman Compose) and **cloud** (Docker + any VPS/cloud VM).

---

## Prerequisites

- Podman or Docker installed
- A PostgreSQL database (local via compose, or managed cloud DB)
- Cloudinary account (optional — only needed for photo uploads)
- Domain + reverse proxy (optional — for production)

---

## Path A: Local / Self-Hosted (Podman Compose)

### 1. Clone and configure

```bash
git clone <repo-url> vtsite
cd vtsite
```

Create backend env file:
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```
DATABASE_URL=postgresql://vtsite:vtsite@db:5432/vtsite
SECRET_KEY=<long-random-string>   # openssl rand -hex 32
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
FIRST_ADMIN_EMAIL=admin@yourdomain.com
FIRST_ADMIN_PASSWORD=<secure-password>
SEED_DEMO_DATA=true               # set false after first run
CLOUDINARY_CLOUD_NAME=<optional>
CLOUDINARY_API_KEY=<optional>
CLOUDINARY_API_SECRET=<optional>
```

### 2. Build and start

```bash
# First-time or after code changes
/opt/podman/bin/podman compose up --build

# Subsequent starts (no code changes)
/opt/podman/bin/podman compose up -d
```

Services:
- Backend: `http://localhost:8000` (API + Swagger at `/docs`)
- Frontend: `http://localhost:3000`
- Database: PostgreSQL on port 5432 (internal)

### 3. Verify deployment

```bash
# Check all containers running
/opt/podman/bin/podman ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Health check
curl http://localhost:8000/health

# Backend logs (last 50 lines)
/opt/podman/bin/podman logs vtsite-backend-1 --tail 50

# Frontend logs
/opt/podman/bin/podman logs vtsite-frontend-1 --tail 50
```

### 4. First admin login

Navigate to `http://localhost:3000` → Login with `FIRST_ADMIN_EMAIL` / `FIRST_ADMIN_PASSWORD`.
Admin panel at `http://localhost:3000/admin`.

### 5. Set SEED_DEMO_DATA=false after first run

Edit `docker-compose.yml` or `backend/.env` and set `SEED_DEMO_DATA=false` to prevent
re-seeding on every restart.

---

## Path B: VPS / Cloud VM (Docker)

### 1. On the server: install Docker

```bash
# Ubuntu/Debian
apt-get update && apt-get install -y docker.io docker-compose-plugin
```

### 2. Pull images from GHCR

Images are built and pushed by the CD pipeline on every merge to `main`:

```bash
docker pull ghcr.io/kspnec/vtsite-backend:latest
docker pull ghcr.io/kspnec/vtsite-frontend:latest
```

### 3. Create a production compose override

Create `/opt/vtsite/docker-compose.prod.yml`:

```yaml
services:
  backend:
    image: ghcr.io/kspnec/vtsite-backend:latest
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://<user>:<pass>@<host>:5432/<db>
      SECRET_KEY: <long-random-secret>
      ALGORITHM: HS256
      ACCESS_TOKEN_EXPIRE_MINUTES: 10080
      FIRST_ADMIN_EMAIL: admin@yourdomain.com
      FIRST_ADMIN_PASSWORD: <secure-password>
      SEED_DEMO_DATA: "false"
      CLOUDINARY_CLOUD_NAME: <your-cloud-name>
      CLOUDINARY_API_KEY: <your-api-key>
      CLOUDINARY_API_SECRET: <your-api-secret>
    ports:
      - "8000:8000"

  frontend:
    image: ghcr.io/kspnec/vtsite-frontend:latest
    restart: unless-stopped
    environment:
      API_URL: http://backend:8000
    ports:
      - "3000:3000"
    depends_on:
      - backend
```

### 4. Deploy

```bash
cd /opt/vtsite
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

### 5. Reverse proxy (nginx example)

```nginx
server {
    server_name yourdomain.com;

    location /api/ {
        proxy_pass http://localhost:8000/;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
    }
}
```

---

## Rollback

To roll back to a previous image:

```bash
# List available tags
docker images ghcr.io/kspnec/vtsite-backend

# Roll back to a specific SHA tag
docker compose -f docker-compose.prod.yml down
# Edit compose file: change :latest → :sha-<short-sha>
docker compose -f docker-compose.prod.yml up -d
```

---

## Database Backups

```bash
# Dump
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
psql $DATABASE_URL < backup_20240101_120000.sql
```

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SECRET_KEY` | Yes | JWT signing secret — keep long and random |
| `ALGORITHM` | Yes | JWT algorithm, use `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Yes | Token lifetime in minutes (10080 = 7 days) |
| `FIRST_ADMIN_EMAIL` | Yes | Seeds the initial admin user on first startup |
| `FIRST_ADMIN_PASSWORD` | Yes | Password for the initial admin user |
| `SEED_DEMO_DATA` | No | `true` to seed 15 demo profiles on first startup |
| `CLOUDINARY_CLOUD_NAME` | No | Required for photo uploads |
| `CLOUDINARY_API_KEY` | No | Required for photo uploads |
| `CLOUDINARY_API_SECRET` | No | Required for photo uploads |
