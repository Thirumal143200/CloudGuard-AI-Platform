"""CloudGuard AI — ORM Models: Telemetry, Logs, Baselines, and Anomaly Events"""
import enum
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, ForeignKey, JSON, Float
from sqlalchemy import Enum as SAEnum, Index
from sqlalchemy.orm import Mapped, mapped_column
from typing import Optional
from app.database import Base, TimestampMixin, SimulatedMixin


class LogSourceType(str, enum.Enum):
    AWS_CLOUDTRAIL = "AWS_CLOUDTRAIL"
    AWS_VPC_FLOW = "AWS_VPC_FLOW"
    AWS_GUARDDUTY = "AWS_GUARDDUTY"
    AZURE_ACTIVITY = "AZURE_ACTIVITY"
    GCP_AUDIT = "GCP_AUDIT"
    KUBERNETES_AUDIT = "KUBERNETES_AUDIT"


class TelemetryLog(Base, TimestampMixin, SimulatedMixin):
    """Raw and parsed telemetry log events from cloud providers."""
    __tablename__ = "telemetry_logs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    cloud_account_id: Mapped[str] = mapped_column(String(64), ForeignKey("cloud_accounts.id"), nullable=False, index=True)
    source_type: Mapped[LogSourceType] = mapped_column(SAEnum(LogSourceType), nullable=False, index=True)
    
    event_timestamp: Mapped[DateTime] = mapped_column(DateTime, nullable=False, index=True)
    event_name: Mapped[str] = mapped_column(String(128), nullable=False, index=True) # e.g., 'AuthorizeSecurityGroupIngress'
    actor_identity: Mapped[Optional[str]] = mapped_column(String(255), nullable=True) # ARN, email, user
    source_ip: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    source_geo: Mapped[Optional[str]] = mapped_column(String(64), nullable=True) # Country/City
    target_resource_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    status_code: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    raw_payload: Mapped[dict] = mapped_column(JSON, nullable=False)
    
    # Anomaly indicator
    is_anomalous: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    anomaly_score: Mapped[float] = mapped_column(Float, default=0.0)


class AnomalyEvent(Base, TimestampMixin, SimulatedMixin):
    """ML-detected anomaly from Isolation Forest or statistical baseline deviation."""
    __tablename__ = "anomaly_events"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    cloud_account_id: Mapped[str] = mapped_column(String(64), ForeignKey("cloud_accounts.id"), nullable=False, index=True)
    detector_name: Mapped[str] = mapped_column(String(64), nullable=False) # 'IsolationForest_V1', 'ZScore_Baseline'
    
    feature_vector: Mapped[dict] = mapped_column(JSON, nullable=False)
    anomaly_score: Mapped[float] = mapped_column(Float, nullable=False) # -1.0 to 1.0 or normalized 0-100
    baseline_deviation_percent: Mapped[float] = mapped_column(Float, default=0.0)
    
    description: Mapped[str] = mapped_column(Text, nullable=False)
    top_contributing_features: Mapped[dict] = mapped_column(JSON, nullable=False) # {'off_hours_access': 0.8, 'ip_novelty': 0.9}
    
    incident_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("incidents.id"), nullable=True, index=True)
