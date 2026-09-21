# CloudGuard AI — Production Deployment Plan & Railway Architecture

**Version:** 2.0  
**Target Environments:** Railway (Cloud Production), Docker Compose (Local Staging)

---

## 1. Local Development Quickstart

### Backend:
```bash
cd backend
python -m venv venv
venv\Scripts\activate     # Windows
source venv/bin/activate  # Linux/macOS
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend:
```bash
cd frontend
npm install
npm run dev
```

---

## 2. Docker Compose (Local Multi-Container Staging)

The project includes multi-stage container configurations in `docker-compose.yml`:
- `cloudguard-db`: PostgreSQL 16 Alpine with health check and persistent volume.
- `cloudguard-backend`: Python 3.11-slim, running Alembic migration on boot and FastAPI with Uvicorn.
- `cloudguard-frontend`: Node 20 build + Nginx serving compiled React assets and reverse-proxying `/api/` and `/health`.

```bash
docker compose up --build -d
```

---

## 3. Railway Cloud Production Architecture (Split Services)

CloudGuard AI is architected on Railway as three connected services in a single Project:

```
┌────────────────────────────────────────────────────────┐
│               RAILWAY PROJECT                          │
│                                                        │
│  ┌─────────────────────────┐                           │
│  │   PostgreSQL Plugin     │                           │
│  │   Managed Database      │                           │
│  └───────────┬─────────────┘                           │
│              │ DATABASE_URL                            │
│              ▼                                         │
│  ┌─────────────────────────┐                           │
│  │   cloudguard-backend    │◀── Internal / Public API  │
│  │   Root: /backend        │    (FastAPI + Uvicorn)    │
│  │   Port: Dynamic $PORT   │                           │
│  └───────────▲─────────────┘                           │
│              │ VITE_API_URL                            │
│  ┌───────────┴─────────────┐                           │
│  │   cloudguard-frontend   │─── Public Web App         │
│  │   Root: /frontend       │    (React 18 + Nginx)     │
│  │   Port: Dynamic $PORT   │                           │
│  └─────────────────────────┘                           │
└────────────────────────────────────────────────────────┘
```

### Service Breakdown & Configuration

#### Service 1: `PostgreSQL` (Database)
- **Type:** Add Plugin → PostgreSQL
- **Configuration:** Fully managed by Railway.
- **Variable Exported:** `DATABASE_URL` (automatically available to reference in backend as `${{Postgres.DATABASE_URL}}`).

#### Service 2: `cloudguard-backend` (API Gateway)
- **Source Repo:** `https://github.com/Thirumal143200/CloudGuard-AI-Platform`
- **Root Directory:** `/backend`
- **Builder:** Dockerfile (`backend/Dockerfile`) or Nixpacks with `backend/Procfile`
- **Start Command:** `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}`
- **Health Check Path:** `/health`
- **Port:** Automatically injected by Railway via `$PORT`
- **Required Variables:**
  - `DATABASE_URL`: `${{Postgres.DATABASE_URL}}`
  - `ENVIRONMENT`: `production`
  - `DEPLOYMENT_MODE`: `DEMO` (or `PRODUCTION` once cloud credentials added)
  - `JWT_SECRET`: High-entropy 64-character hex string (`openssl rand -hex 32`)
  - `JWT_REFRESH_SECRET`: High-entropy 64-character hex string
  - `ENCRYPTION_KEY`: Exactly 64 hex characters (32 raw bytes)
  - `CORS_ORIGIN`: URL of frontend service (e.g. `https://cloudguard-frontend-production.up.railway.app`)
  - `GEMINI_API_KEY`: *(Optional)* Google Gemini API key for GenAI mode (graceful fallback if omitted)
  - `GEMINI_MODEL`: `gemini-2.5-flash`

#### Service 3: `cloudguard-frontend` (Single Page Application)
- **Source Repo:** `https://github.com/Thirumal143200/CloudGuard-AI-Platform`
- **Root Directory:** `/frontend`
- **Builder:** Dockerfile (`frontend/Dockerfile`) or Node (`npm run build`)
- **Health Check Path:** `/`
- **Port:** Automatically injected by Railway via `$PORT` (Nginx templates `${PORT}`)
- **Build Argument / Variable:**
  - `VITE_API_URL`: URL of backend service (e.g. `https://cloudguard-backend-production.up.railway.app`)

---

## 4. Production Health & Readiness Verification

Once deployed to Railway, execute the public probe checklist:
1. `GET https://<backend-url>/health` → `200 OK`
2. `GET https://<backend-url>/health/live` → `200 OK`
3. `GET https://<backend-url>/health/ready` → `200 OK` (verifies PostgreSQL connectivity)
4. `GET https://<backend-url>/api/system/status` → `200 OK` (verifies sanitized telemetry status)
5. `GET https://<frontend-url>/` → `200 OK` (verifies web UI rendering)
