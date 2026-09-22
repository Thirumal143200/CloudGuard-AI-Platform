# CloudGuard AI — Production Deployment Plan: Render + Supabase + Vercel

**Version:** 2.0  
**Target Architecture:**
- **Backend:** Render (Docker Web Service)
- **Database:** Supabase (Managed PostgreSQL)
- **Frontend:** Vercel (Vite Single Page Application)
- **Repository:** `https://github.com/Thirumal143200/CloudGuard-AI-Platform`

---

## 1. Architecture Overview

```
                      ┌────────────────────────────────────────┐
                      │          VERCEL (Frontend)             │
                      │  https://<app>.vercel.app              │
                      │  React 18 + Vite (SPA)                 │
                      │  Root: /frontend | Output: dist        │
                      └──────────────────┬─────────────────────┘
                                         │ HTTPS / REST API
                                         │ VITE_API_URL
                                         ▼
                      ┌────────────────────────────────────────┐
                      │          RENDER (Backend)              │
                      │  https://<service>.onrender.com        │
                      │  FastAPI + Uvicorn (Docker)            │
                      │  Root: /backend | Port: $PORT (10000)  │
                      └──────────────────┬─────────────────────┘
                                         │ PostgreSQL / SSL
                                         │ DATABASE_URL
                                         ▼
                      ┌────────────────────────────────────────┐
                      │        SUPABASE (PostgreSQL 16)        │
                      │  aws-0-[region].pooler.supabase.com    │
                      │  Port: 6543 (Pooler) or 5432 (Direct)  │
                      └────────────────────────────────────────┘
```

---

## 2. Component Specifications

### A. Database: Supabase PostgreSQL
1. Create a Project on [Supabase](https://supabase.com/).
2. Navigate to **Project Settings** → **Database** → **Connection String**.
3. Copy the **URI** connection string:
   - **Transaction Pooler (Recommended for Serverless/Containers):**
     `postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres`
   - **Direct Connection:**
     `postgresql://postgres:[YOUR-PASSWORD]@db.[project-ref].supabase.co:5432/postgres`
4. Replace `[YOUR-PASSWORD]` with your actual database password.
5. In CloudGuard AI, `backend/app/database.py` automatically configures `pool_pre_ping=True`, `pool_recycle=300`, and `sslmode=require` for Supabase.

---

### B. Backend: Render Web Service
1. In the [Render Dashboard](https://dashboard.render.com/), click **New** → **Web Service**.
2. Connect your GitHub repository: `https://github.com/Thirumal143200/CloudGuard-AI-Platform`.
3. Configure the service:
   - **Name:** `cloudguard-ai-backend` (or your preferred name)
   - **Region:** Choose the region closest to your Supabase database (e.g., Oregon, Frankfurt, Singapore).
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** `Docker`
   - **Instance Type:** Free or Starter
4. Render automatically detects `backend/Dockerfile`.
5. Under **Advanced** → **Health Check Path**, enter: `/health`
6. Under **Environment Variables**, add:

| Variable | Value / Description | Secret |
|:---|:---|:---:|
| `ENVIRONMENT` | `production` | No |
| `DEPLOYMENT_MODE` | `DEMO` *(or `PRODUCTION` once cloud credentials added)* | No |
| `DATABASE_URL` | Your Supabase PostgreSQL URI string | **Yes** |
| `JWT_SECRET` | 64-character high-entropy random hex (`openssl rand -hex 32`) | **Yes** |
| `JWT_REFRESH_SECRET` | 64-character high-entropy random hex (`openssl rand -hex 32`) | **Yes** |
| `ENCRYPTION_KEY` | Exactly 64 hex characters (32 raw bytes) | **Yes** |
| `CORS_ORIGIN` | `https://<your-vercel-app>.vercel.app` *(add after frontend deployed)* | No |
| `GEMINI_MODEL` | `gemini-2.5-flash` | No |
| `GEMINI_API_KEY` | Google AI Studio key *(Optional: leave empty for rule/ML fallback)* | **Yes** |

7. Click **Create Web Service**.
8. Render will build the Docker container, run `alembic upgrade head` to provision all 20 tables in Supabase, and start Uvicorn on Render's dynamic `$PORT`.
9. Copy your public Render URL (e.g. `https://cloudguard-ai-backend.onrender.com`).

---

### C. Frontend: Vercel Deployment
1. In the [Vercel Dashboard](https://vercel.com/dashboard), click **Add New** → **Project**.
2. Import `https://github.com/Thirumal143200/CloudGuard-AI-Platform`.
3. Configure Project Settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click **Edit** and select `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Under **Environment Variables**, add:
   - **Key:** `VITE_API_URL`
   - **Value:** Your actual Render backend URL (e.g., `https://cloudguard-ai-backend.onrender.com`)
5. Click **Deploy**.
6. Vercel compiles the React application and deploys it to `https://<your-app>.vercel.app`.
7. Client-side routing is automatically handled by `frontend/vercel.json` rewrites.

---

## 3. Post-Deployment Verification Sequence

Once both services are deployed, perform the live verification audit:

```bash
# 1. Verify Backend Basic Health
curl -s -i https://<your-backend>.onrender.com/health
# Expected: HTTP 200 OK with {"status": "ok", "environment": "production"}

# 2. Verify Supabase Database Readiness
curl -s -i https://<your-backend>.onrender.com/health/ready
# Expected: HTTP 200 OK with {"status": "ok", "ready": true, "database": "connected"}

# 3. Verify System Status Matrix
curl -s -i https://<your-backend>.onrender.com/api/system/status
# Expected: HTTP 200 OK with sanitized system status (zero secrets exposed)

# 4. Verify Swagger Interactive API Docs
curl -s -i https://<your-backend>.onrender.com/docs
# Expected: HTTP 200 OK

# 5. Verify Frontend Application
curl -s -i https://<your-frontend>.vercel.app
# Expected: HTTP 200 OK
```

8. Open `https://<your-frontend>.vercel.app` in your web browser.
9. Verify that findings, risk gauge, and evidence drawer load data from the Render API connected to Supabase.
