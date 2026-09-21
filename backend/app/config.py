"""CloudGuard AI Platform — Strongly-Typed Backend Configuration & Secret Management"""
import os
import re
from pathlib import Path
from typing import Optional, List, Dict, Any
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings

DEFAULT_PLACEHOLDER_SECRET = "replace-with-a-secure-random-32-byte-hex-secret-in-production"
DEFAULT_PLACEHOLDER_REFRESH = "replace-with-a-secure-random-32-byte-hex-refresh-secret-in-production"


class Settings(BaseSettings):
    """Strongly typed application configuration validated against runtime environment."""

    # --- Core Application ---
    PROJECT_NAME: str = "CloudGuard AI Enterprise Platform"
    APP_VERSION: str = "2.0.0"
    ENVIRONMENT: str = "development"  # 'development', 'staging', 'production'
    DEPLOYMENT_MODE: str = "DEMO"     # 'PRODUCTION', 'DEMO', 'NO_DATA'
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False

    # --- Database ---
    DATABASE_URL: str = "sqlite:///./cloudguard.db"

    # --- Authentication & JWT ---
    JWT_SECRET_KEY: str = Field(default=DEFAULT_PLACEHOLDER_SECRET)
    JWT_REFRESH_SECRET_KEY: str = Field(default=DEFAULT_PLACEHOLDER_REFRESH)
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # --- Master AES-256-GCM Key ---
    ENCRYPTION_KEY: str = Field(default="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef")

    # --- CORS Allowed Origins ---
    CORS_ORIGIN: str = "http://localhost:5173,http://localhost:3000"

    # --- Google Gemini GenAI ---
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-2.5-flash"
    GEMINI_TIMEOUT_SECONDS: int = 15
    GEMINI_MAX_RETRIES: int = 2

    # --- Cloud Hyperscaler Connectors (All Optional) ---
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_DEFAULT_REGION: str = "us-east-1"
    AWS_ROLE_ARN: Optional[str] = None

    AZURE_SUBSCRIPTION_ID: Optional[str] = None
    AZURE_TENANT_ID: Optional[str] = None
    AZURE_CLIENT_ID: Optional[str] = None
    AZURE_CLIENT_SECRET: Optional[str] = None

    GCP_PROJECT_ID: Optional[str] = None
    GOOGLE_APPLICATION_CREDENTIALS: Optional[str] = None

    # --- ML & Baseline Paths ---
    ML_MODEL_DIR: str = str(Path(__file__).parent.parent / "ml_models")

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse comma-delimited CORS origin list into clean URLs."""
        if not self.CORS_ORIGIN:
            return ["http://localhost:5173"]
        return [o.strip() for o in self.CORS_ORIGIN.split(",") if o.strip()]

    def validate_for_runtime(self) -> None:
        """Enforce strict production deployment gates without printing secret values."""
        if self.ENVIRONMENT.lower() == "production":
            errors = []
            if self.JWT_SECRET_KEY == DEFAULT_PLACEHOLDER_SECRET or len(self.JWT_SECRET_KEY) < 32:
                errors.append("JWT_SECRET_KEY is insecure or using default placeholder. Must be >= 32 characters of high-entropy key.")

            if self.JWT_REFRESH_SECRET_KEY == DEFAULT_PLACEHOLDER_REFRESH or len(self.JWT_REFRESH_SECRET_KEY) < 32:
                errors.append("JWT_REFRESH_SECRET_KEY is insecure or using default placeholder. Must be >= 32 characters.")

            if self.DATABASE_URL.startswith("sqlite"):
                errors.append("DATABASE_URL is set to SQLite in production. Production requires PostgreSQL.")

            if "*" in self.cors_origins_list:
                errors.append("CORS_ORIGIN contains wildcard '*' which is forbidden in production.")

            if len(self.ENCRYPTION_KEY) != 64 and len(self.ENCRYPTION_KEY) != 32:
                errors.append("ENCRYPTION_KEY must be a 64-character hex string or 32 raw bytes for AES-256-GCM.")

            if errors:
                raise RuntimeError(
                    f"CRITICAL: Production Security Configuration Failed ({len(errors)} violations):\n"
                    + "\n".join(f" - {e}" for e in errors)
                )

    def get_sanitized_config_status(self) -> Dict[str, Any]:
        """Return safe, non-sensitive audit status of all configurations."""
        db_type = "postgresql" if "postgresql" in self.DATABASE_URL.lower() else "sqlite"
        return {
            "application": self.PROJECT_NAME,
            "version": self.APP_VERSION,
            "environment": self.ENVIRONMENT,
            "deployment_mode": self.DEPLOYMENT_MODE,
            "database": {
                "status": "configured",
                "type": db_type,
            },
            "security": {
                "jwt_secret": "configured" if self.JWT_SECRET_KEY != DEFAULT_PLACEHOLDER_SECRET else "default_placeholder",
                "jwt_refresh_secret": "configured" if self.JWT_REFRESH_SECRET_KEY != DEFAULT_PLACEHOLDER_REFRESH else "default_placeholder",
                "encryption": "configured (AES-256-GCM)" if self.ENCRYPTION_KEY else "missing",
            },
            "ai": {
                "status": "LIVE" if self.GEMINI_API_KEY else "NOT CONFIGURED (RULE/ML MODE ACTIVE)",
                "model": self.GEMINI_MODEL,
                "timeout_sec": self.GEMINI_TIMEOUT_SECONDS,
            },
            "cloud_connectors": {
                "aws": "CONFIGURED" if self.AWS_ACCESS_KEY_ID else "NOT CONFIGURED",
                "azure": "CONFIGURED" if self.AZURE_CLIENT_ID else "NOT CONFIGURED",
                "gcp": "CONFIGURED" if self.GCP_PROJECT_ID else "NOT CONFIGURED",
            },
        }

    class Config:
        env_file = ".env"
        extra = "ignore"
        case_sensitive = True


settings = Settings()
