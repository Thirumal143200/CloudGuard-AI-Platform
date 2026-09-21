# CloudGuard AI — Deployment Status & Live Endpoints

**Last Updated:** 2026-09-22T00:30:00Z  
**Deployment Environment:** Local Staging / Containerized Cluster  

---

## 1. Active Deployment Tracking

| Component | URL | Commit | Status | Last Verified |
| :--- | :--- | :---: | :---: | :--- |
| **Frontend** | `http://localhost:5173` | `ec20e27` | `WORKING` | 2026-09-22T00:43:00Z |
| **Backend** | `http://localhost:8000` | `ec20e27` | `WORKING` | 2026-09-22T00:43:00Z |
| **Swagger** | `http://localhost:8000/docs` | `ec20e27` | `WORKING` | 2026-09-22T00:43:00Z |
| **Liveness Probe** | `http://localhost:8000/health/live` | `ec20e27` | `WORKING` | 2026-09-22T00:43:00Z |
| **Readiness Probe** | `http://localhost:8000/health/ready` | `ec20e27` | `WORKING` | 2026-09-22T00:43:00Z |
| **System Status** | `http://localhost:8000/api/system/status` | `ec20e27` | `WORKING` | 2026-09-22T00:43:00Z |

*Note: In production cloud deployment, replace `localhost` with the verified production domain (e.g. `https://cloudguard.ai`) only after successful DNS resolution and SSL termination.*

---

## 2. Rollback Procedures & Version History

- **Current Release:** `v2.0.0` (SRIJAN 2026 Production Edition)
- **Previous Baseline:** `v1.0.0` (Client-side static prototype)
- **Rollback Procedure:**
  1. Database state is backed up prior to migration execution.
  2. If container failure occurs, previous image tag `v1.0.0` can be deployed via `docker-compose down && docker-compose -f docker-compose.v1.yml up -d`.
  3. Alembic downgrade path: `alembic downgrade -1`.
