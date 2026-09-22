"""CloudGuard AI — Main FastAPI Application Entrypoint

Configured with:
- Strict production configuration validation
- Three deployment modes: PRODUCTION, DEMO, NO_DATA
- Safe CORS origin allowlist
- Root-level and API-level health and readiness probes
- Non-sensitive operational logging
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.models.user import User, UserRole
from app.services.auth_service import hash_password
from app.services.ingestion_service import seed_demo_cloud_environment

# Import routers
from app.api.health_routes import router as health_router
from app.api.auth_routes import router as auth_router
from app.api.cloud_routes import router as cloud_router
from app.api.finding_routes import router as finding_router
from app.api.incident_routes import router as incident_router
from app.api.remediation_routes import router as remediation_router
from app.api.analytics_routes import router as analytics_router
from app.api.gemini_routes import router as gemini_router
from app.api.seed_routes import router as seed_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup & shutdown events: validation, migrations, mode handling."""
    # 1. Validate security configuration for production
    settings.validate_for_runtime()

    # 2. Initialize database schema
    # In development/demo/test environments, create_all provides quick boot.
    # In production environments, Alembic migrations ('alembic upgrade head') are required.
    if settings.ENVIRONMENT.lower() != "production":
        Base.metadata.create_all(bind=engine)

    # 3. Mode-specific initialization
    db = SessionLocal()
    try:
        # Create default admin only in DEMO or development mode
        if settings.DEPLOYMENT_MODE == "DEMO" or settings.ENVIRONMENT != "production":
            admin_user = db.query(User).filter(User.email == "admin@cloudguard.ai").first()
            if not admin_user:
                admin_user = User(
                    id="usr-admin-default",
                    email="admin@cloudguard.ai",
                    full_name="CloudGuard Lead Architect",
                    hashed_password=hash_password("Admin@CloudGuard2026!"),
                    role=UserRole.ADMIN,
                    is_active=True,
                    is_locked=False
                )
                db.add(admin_user)
                db.commit()

            # Pre-seed demo cloud infrastructure only in DEMO mode
            if settings.DEPLOYMENT_MODE == "DEMO":
                seed_demo_cloud_environment(db)

        # Print sanitized configuration status (NO secrets)
        status_info = settings.get_sanitized_config_status()
        print(f"[STARTUP] CloudGuard AI Platform initialized in {settings.ENVIRONMENT} ({settings.DEPLOYMENT_MODE} mode)")
        print(f"[STARTUP] AI Engine: {status_info['ai']['status']} | DB: {status_info['database']['type']}")
    finally:
        db.close()

    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.APP_VERSION,
    description="Evidence-driven, multi-cloud automated security posture management, threat detection, and self-healing platform.",
    lifespan=lifespan
)

# CORS configuration with strict explicit origins and Vercel cloud domain support
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Mount Health Routes at root
app.include_router(health_router)

# Mount API Routers under /api/v1
app.include_router(auth_router, prefix="/api/v1")
app.include_router(cloud_router, prefix="/api/v1")
app.include_router(finding_router, prefix="/api/v1")
app.include_router(incident_router, prefix="/api/v1")
app.include_router(remediation_router, prefix="/api/v1")
app.include_router(analytics_router, prefix="/api/v1")
app.include_router(gemini_router, prefix="/api/v1")
app.include_router(seed_router, prefix="/api/v1")


@app.get("/")
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.APP_VERSION,
        "status": "OPERATIONAL",
        "environment": settings.ENVIRONMENT,
        "deployment_mode": settings.DEPLOYMENT_MODE,
        "docs_url": "/docs"
    }
