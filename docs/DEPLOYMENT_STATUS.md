# CloudGuard AI — Deployment Status & Live Endpoints

**Last Updated:** 2026-09-22T01:25:00Z  
**Deployment Environments:** Local Staging & Railway Cloud Production

---

## 1. Active Deployment Tracking

### A. Local / Containerized Verification
| Component | URL | Target Architecture | Status | Last Verified |
| :--- | :--- | :---: | :---: | :--- |
| **GitHub Repository** | `https://github.com/Thirumal143200/CloudGuard-AI-Platform` | Git Remote | `WORKING` | 2026-09-22T01:13:00Z |
| **Frontend Web App** | `http://localhost:5173` | React 18 + Vite (SPA) | `WORKING` | 2026-09-22T01:22:00Z |
| **Backend API Gateway** | `http://localhost:8000` | FastAPI / Python 3.11 | `WORKING` | 2026-09-22T01:22:00Z |
| **Interactive API Docs** | `http://localhost:8000/docs` | OpenAPI 3.1 / Swagger UI | `WORKING` | 2026-09-22T01:22:00Z |
| **Liveness Probe** | `http://localhost:8000/health/live` | HTTP GET (`live: true`) | `WORKING` | 2026-09-22T01:22:00Z |
| **Readiness Probe** | `http://localhost:8000/health/ready` | DB Connectivity (`SELECT 1`) | `WORKING` | 2026-09-22T01:22:00Z |
| **System Status** | `http://localhost:8000/api/system/status` | Sanitized System Matrix | `WORKING` | 2026-09-22T01:22:00Z |

### B. Railway Cloud Production (Pending Live Public Verification)
| Component | Public URL | Railway Service | Status | Verification Note |
| :--- | :--- | :---: | :---: | :--- |
| **Database** | Internal TCP | `PostgreSQL Plugin` | `CONFIGURED` | Managed PostgreSQL 16 plugin |
| **Backend API** | `https://<backend-name>.up.railway.app` | `cloudguard-backend` | `CONFIGURED` | Pre-flight passed; awaiting Railway service creation |
| **Frontend Web App** | `https://<frontend-name>.up.railway.app` | `cloudguard-frontend` | `CONFIGURED` | Pre-flight passed; awaiting Railway service creation |
| **Swagger UI** | `https://<backend-name>.up.railway.app/docs` | `cloudguard-backend` | `CONFIGURED` | Pre-flight passed; awaiting Railway service creation |

*Note: In accordance with the project's absolute rule, public URLs are marked `CONFIGURED` and will only be marked `HEALTHY` / `WORKING` after live HTTP probes return 200 OK from the deployed public domains.*

---

## 2. Pre-Flight Verification Audit

- [x] Backend binds to `0.0.0.0`
- [x] Dynamic production `PORT` handled (`${PORT:-8000}`)
- [x] Frontend production build compiled (`dist/` verified)
- [x] Dynamic `VITE_API_URL` configuration supported
- [x] Zero hardcoded `localhost` URLs in production frontend
- [x] Production CORS allowlist enforced (wildcards rejected)
- [x] Database uses `DATABASE_URL` with auto-normalization for `postgres://`
- [x] `psycopg2-binary` installed for PostgreSQL support
- [x] Alembic migration `3f5f159e3b50` verified
- [x] `GET /health` verified (200 OK)
- [x] `GET /health/live` verified (200 OK)
- [x] `GET /health/ready` verified (200 OK)
- [x] `GET /api/system/status` verified (200 OK)
- [x] Railway configuration files (`backend/railway.json`, `frontend/railway.json`, `Procfile`) created

---

## 3. Rollback Procedures & Version History

- **Current Release:** `v2.0.0` (SRIJAN 2026 Production Edition)
- **Previous Baseline:** `v1.0.0` (Client-side static prototype)
- **Rollback Procedure:**
  1. Database state is backed up prior to migration execution.
  2. If container failure occurs on Railway, rollback to previous deployment commit via Railway deployment history tab.
  3. Alembic downgrade path: `alembic downgrade -1`.
