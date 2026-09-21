# CloudGuard AI — Deployment Plan & Docker Orchestration

**Version:** 2.0  
**Target Environments:** Local Developer Setup, Docker Compose, Cloud Run / ECS  

---

## 1. Quickstart (Local Development)

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

## 2. Docker Orchestration

The project includes a multi-stage `Dockerfile` and `docker-compose.yml` defining:
- `cloudguard-backend`: Python 3.11-slim, FastAPI running with Uvicorn.
- `cloudguard-frontend`: Node 20 / Nginx serving compiled React static assets.
- `cloudguard-db`: PostgreSQL 16 Alpine with persistent volume.
