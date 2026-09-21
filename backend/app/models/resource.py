"""CloudGuard AI — ORM Models: Cloud Resources & Snapshots"""
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, ForeignKey, JSON, Float, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base, TimestampMixin, SimulatedMixin, generate_uuid


class CloudResource(Base, TimestampMixin, SimulatedMixin):
    __tablename__ = "cloud_resources"
    __table_args__ = (
        Index("ix_resource_provider", "provider"),
        Index("ix_resource_cloud_account", "cloud_account_id"),
    )

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=generate_uuid)
    cloud_account_id: Mapped[str] = mapped_column(String(64), ForeignKey("cloud_accounts.id"), nullable=True)
    native_id: Mapped[str] = mapped_column(String(255), default="", nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    provider: Mapped[str] = mapped_column(String(32), nullable=False)  # AWS, Azure, GCP
    resource_type: Mapped[str] = mapped_column(String(100), nullable=False)
    region: Mapped[str] = mapped_column(String(100), default="global", nullable=False)
    configuration: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    tags: Mapped[dict] = mapped_column(JSON, nullable=True, default=dict)
    risk_score: Mapped[float] = mapped_column(Float, default=0.0)
    data_source_id: Mapped[str] = mapped_column(String(64), ForeignKey("data_sources.id"), nullable=True)


class ResourceSnapshot(Base, TimestampMixin):
    __tablename__ = "resource_snapshots"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=generate_uuid)
    resource_id: Mapped[str] = mapped_column(String(64), ForeignKey("cloud_resources.id"), nullable=False)
    configuration: Mapped[dict] = mapped_column(JSON, nullable=False)
    snapshot_at: Mapped[DateTime] = mapped_column(DateTime, nullable=True)
