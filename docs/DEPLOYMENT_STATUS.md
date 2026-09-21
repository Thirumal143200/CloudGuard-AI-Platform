# CloudGuard AI — Deployment Status & Live Endpoints

**Last Updated:** 2026-09-22T00:30:00Z  
**Deployment Environment:** Local Staging / Containerized Cluster  

---

## 1. Active Deployment Tracking

| Component | URL / Endpoint | Target Architecture | Status | Last Verified |
|---|---|---|---|---|
| **Frontend Web App** | `http://localhost:5173` | React 18 + Vite (SPA) | `WORKING` | 2026-09-22 |
| **Backend API Gateway** | `http://localhost:8000` | FastAPI / Python 3.11 | `WORKING` | 2026-09-22 |
| **Interactive API Docs** | `http://localhost:8000/docs` | OpenAPI 3.1 / Swagger UI | `WORKING` | 2026-09-22 |
| **Liveness Probe** | `http://localhost:8000/health/live` | HTTP GET (`live: true`) | `WORKING` | 2026-09-22 |
| **Readiness Probe** | `http://localhost:8000/health/ready` | DB Connectivity (`SELECT 1`) | `WORKING` | 2026-09-22 |
| **System Status Matrix** | `http://localhost:8000/api/system/status` | Sanitized System Matrix | `WORKING` | 2026-09-22 |

*Note: In production cloud deployment, replace `localhost` with the verified production domain (e.g. `https://cloudguard.ai`) only after successful DNS resolution and SSL termination.*

---

## 2. Rollback Procedures & Version History

- **Current Release:** `v2.0.0` (SRIJAN 2026 Production Edition)
- **Previous Baseline:** `v1.0.0` (Client-side static prototype)
- **Rollback Procedure:**
  1. Database state is backed up prior to migration execution.
  2. If container failure occurs, previous image tag `v1.0.0` can be deployed via `docker-compose down && docker-compose -f docker-compose.v1.yml up -d`.
  3. Alembic downgrade path: `alembic downgrade -1`.
