"""CloudGuard AI — ORM Models: Cloud Accounts, Data Sources, Ingestion"""
import enum
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base, TimestampMixin, SimulatedMixin, generate_uuid


class CloudProvider(str, enum.Enum):
    AWS = "AWS"
    AZURE = "AZURE"
    GCP = "GCP"
    MULTI = "MULTI"


# Alias for backward compatibility
CloudProviderEnum = CloudProvider


class SourceType(str, enum.Enum):
    LIVE_AWS = "LIVE_AWS"
    LIVE_AZURE = "LIVE_AZURE"
    LIVE_GCP = "LIVE_GCP"
    USER_UPLOAD = "USER_UPLOAD"
    API_INGESTION = "API_INGESTION"
    USER_GENERATED_TEST = "USER_GENERATED_TEST"
    DEMO = "DEMO"


# Alias for backward compatibility
DataSourceTypeEnum = SourceType


class AccountStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    FAILED = "FAILED"
    DISCONNECTED = "DISCONNECTED"


class SourceStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    ERROR = "ERROR"
    DISCONNECTED = "DISCONNECTED"


class JobStatus(str, enum.Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


# Alias for backward compatibility
IngestionStatusEnum = JobStatus


class CloudAccount(Base, TimestampMixin, SimulatedMixin):
    __tablename__ = "cloud_accounts"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    provider: Mapped[CloudProvider] = mapped_column(SAEnum(CloudProvider), nullable=False)
    account_id: Mapped[str] = mapped_column(String(255), nullable=False)
    environment: Mapped[str] = mapped_column(String(64), default="production", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    credentials_encrypted: Mapped[str] = mapped_column(Text, nullable=True)
    last_sync_at: Mapped[str] = mapped_column(DateTime, nullable=True)


class DataSource(Base, TimestampMixin, SimulatedMixin):
    __tablename__ = "data_sources"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    source_type: Mapped[SourceType] = mapped_column(SAEnum(SourceType), nullable=False)
    cloud_account_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("cloud_accounts.id"), nullable=True
    )
    status: Mapped[str] = mapped_column(String(32), default="ACTIVE")
    last_ingested_at: Mapped[str] = mapped_column(DateTime, nullable=True)
    total_records_ingested: Mapped[int] = mapped_column(Integer, default=0)


class IngestionJob(Base, TimestampMixin):
    __tablename__ = "ingestion_jobs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=generate_uuid)
    data_source_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("data_sources.id"), nullable=False
    )
    job_type: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[JobStatus] = mapped_column(
        SAEnum(JobStatus), nullable=False, default=JobStatus.PENDING
    )
    records_processed: Mapped[int] = mapped_column(Integer, default=0)
    records_failed: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[str] = mapped_column(Text, nullable=True)
