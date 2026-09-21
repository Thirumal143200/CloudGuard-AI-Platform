"""CloudGuard AI — Production Health & Operational Status Endpoints

Exposes health check probes strictly complying with container orchestration:
- /health: Root health summary
- /health/live: Liveness probe (process responsive)
- /health/ready: Readiness probe (database connection active)
- /api/system/status & /api/v1/system/status: Detailed non-sensitive operational matrix

NEVER exposes secrets, passwords, tokens, or credentials.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.config import settings
from app.services.gemini_service import gemini_service
from app.services.ml_engine import global_anomaly_detector

router = APIRouter(tags=["Health & Status"])


@router.get("/health")
def health_root():
    """Basic health endpoint for load balancers."""
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
    }


@router.get("/health/live")
def liveness_probe():
    """Liveness probe: verifies process is responsive."""
    return {"status": "ok", "live": True}


@router.get("/health/ready")
def readiness_probe(db: Session = Depends(get_db)):
    """Readiness probe: verifies database connectivity."""
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "ok",
            "ready": True,
            "database": "connected",
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection probe failed"
        )


@router.get("/api/system/status")
@router.get("/api/v1/system/status")
def system_status(db: Session = Depends(get_db)):
    """Exposes system status matrix without revealing secrets."""
    # Check DB
    db_status = "ok"
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_status = "disconnected"

    # AI Status
    ai_info = gemini_service.get_status()

    # ML Status
    ml_status = "ready" if global_anomaly_detector else "unavailable"

    return {
        "status": "ok" if db_status == "ok" else "degraded",
        "database": db_status,
        "ai": "configured" if ai_info.get("configured") else "not configured",
        "ai_status": ai_info.get("status"),
        "ai_model": ai_info.get("model"),
        "ml": ml_status,
        "environment": settings.ENVIRONMENT,
        "deployment_mode": settings.DEPLOYMENT_MODE,
        "cloud_connectors": {
            "aws": "configured" if settings.AWS_ACCESS_KEY_ID else "NOT CONFIGURED",
            "azure": "configured" if settings.AZURE_CLIENT_ID else "NOT CONFIGURED",
            "gcp": "configured" if settings.GCP_PROJECT_ID else "NOT CONFIGURED",
        }
    }
