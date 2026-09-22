# CloudGuard AI — Deployment Status & Live Endpoints

**Last Updated:** 2026-09-22T12:40:00Z  
**Target Deployment Architecture:**
- **Backend:** Render (Docker Web Service)
- **Database:** Supabase (Managed PostgreSQL)
- **Frontend:** Vercel (Vite Single Page Application)

---

## 1. Active Deployment Tracking

### A. Local / Containerized Verification
| Component | URL | Target Architecture | Status | Last Verified |
| :--- | :--- | :---: | :---: | :--- |
| **GitHub Repository** | `https://github.com/Thirumal143200/CloudGuard-AI-Platform` | Git Remote (`main`) | `WORKING` | 2026-09-22T01:24:00Z |
| **Frontend Web App** | `http://localhost:5173` | React 18 + Vite (SPA) | `WORKING` | 2026-09-22T01:22:00Z |
| **Backend API Gateway** | `http://localhost:8000` | FastAPI / Python 3.11 | `WORKING` | 2026-09-22T01:22:00Z |
| **Interactive API Docs** | `http://localhost:8000/docs` | OpenAPI 3.1 / Swagger UI | `WORKING` | 2026-09-22T01:22:00Z |
| **Liveness Probe** | `http://localhost:8000/health/live` | HTTP GET (`live: true`) | `WORKING` | 2026-09-22T01:22:00Z |
| **Readiness Probe** | `http://localhost:8000/health/ready` | DB Connectivity (`SELECT 1`) | `WORKING` | 2026-09-22T01:22:00Z |
| **System Status** | `http://localhost:8000/api/system/status` | Sanitized System Matrix | `WORKING` | 2026-09-22T01:22:00Z |

### B. Production Cloud Deployment (Render + Supabase + Vercel)
| Component | Target URL | Platform | Status | Verification Note |
| :--- | :--- | :---: | :---: | :--- |
| **Database** | Supabase Connection URI | `Supabase PostgreSQL` | `CONFIGURED` | Managed PostgreSQL with SSL & connection pooler |
| **Backend API** | `https://<backend-service>.onrender.com` | `Render Web Service` | `CONFIGURED` | Docker container on Render with dynamic `$PORT` & `/health` |
| **Frontend Web App** | `https://<frontend-project>.vercel.app` | `Vercel (Vite SPA)` | `CONFIGURED` | Vite SPA with `vercel.json` rewrites & dynamic `VITE_API_URL` |
| **Swagger UI** | `https://<backend-service>.onrender.com/docs` | `Render Web Service` | `CONFIGURED` | OpenAPI 3.1 docs live on Render |

*Note: In accordance with the project's absolute rule, cloud production URLs are marked `CONFIGURED` and will only be marked `HEALTHY` / `WORKING` after live HTTP probes return 200 OK from the deployed Render and Vercel domains.*

---

## 2. Pre-Flight Verification Audit

- [x] Backend binds to `0.0.0.0`
- [x] Render dynamic production `PORT` handled (`${PORT:-10000}`)
- [x] Frontend production build compiled (`dist/` verified)
- [x] Dynamic `VITE_API_URL` configuration supported
- [x] Zero hardcoded `localhost` URLs in production frontend
- [x] Production CORS allowlist enforced (`allow_origin_regex` for `*.vercel.app`)
- [x] Database uses `DATABASE_URL` with auto-normalization for `postgres://`
- [x] `psycopg2-binary` installed for PostgreSQL support
- [x] Alembic migration `3f5f159e3b50` verified
- [x] `GET /health` verified (200 OK)
- [x] `GET /health/live` verified (200 OK)
- [x] `GET /health/ready` verified (200 OK)
- [x] `GET /api/system/status` verified (200 OK)
- [x] `frontend/vercel.json` SPA client-side routing rewrites created
- [x] Dockerfile configured for Render runtime (`EXPOSE 10000 8000`, `ENV PORT=10000`, `libpq-dev`)

---

## 3. Rollback Procedures & Version History

- **Current Release:** `v2.0.0` (SRIJAN 2026 Production Edition)
- **Previous Baseline:** `v1.0.0` (Client-side static prototype)
- **Rollback Procedure:**
  1. Database state is backed up prior to migration execution in Supabase.
  2. If container failure occurs on Render, rollback to the previous commit SHA via Render's Manual Deploy / Rollback button.
  3. If frontend issue occurs on Vercel, instantly revert to the previous deployment via Vercel Deployments dashboard.
  4. Alembic downgrade path: `alembic downgrade -1`.
