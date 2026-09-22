"""CloudGuard AI - API Routes: System Health, Status, and Demo Seeding"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.ingestion_service import seed_demo_cloud_environment
from app.config import settings

router = APIRouter(prefix="/system", tags=["System & Admin"])


@router.get("/health")
def health_check():
    """System health check endpoint."""
    return {
        "status": "HEALTHY",
        "service": "CloudGuard AI Platform",
        "version": "2.0.0",
        "timestamp": "2026-09-22T00:00:00Z"
    }


@router.post("/seed-demo-data")
def trigger_demo_seed(db: Session = Depends(get_db)):
    """Initialize system with multi-cloud resources for development/demo only. Strictly disabled in production."""
    if settings.ENVIRONMENT.lower() == "production":
        raise HTTPException(
            status_code=403,
            detail="Demo seeding is strictly disabled in production environments. Register your own account to ingest cloud data."
        )
    return seed_demo_cloud_environment(db)
