"""CloudGuard AI Platform — Database Engine & Session"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import create_engine, Column, DateTime, Boolean, String
from sqlalchemy.orm import sessionmaker, DeclarativeBase, Mapped, mapped_column
from app.config import settings


connect_args = {}
if "sqlite" in settings.DATABASE_URL:
    connect_args["check_same_thread"] = False
elif "supabase" in settings.DATABASE_URL or "pooler.supabase.com" in settings.DATABASE_URL:
    connect_args["sslmode"] = "require"

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
    pool_recycle=300,
    echo=settings.DEBUG,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass


class TimestampMixin:
    """Mixin that adds created_at and updated_at columns."""
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class SimulatedMixin:
    """Mixin that adds is_simulated flag for data provenance."""
    is_simulated: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


def generate_uuid() -> str:
    return str(uuid.uuid4())


def get_db():
    """FastAPI dependency for database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables. Used for development; Alembic handles production migrations."""
    Base.metadata.create_all(bind=engine)
