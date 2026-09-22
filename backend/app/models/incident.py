"""CloudGuard AI - ORM Models: Incidents, Timelines, and Incident Evidence"""
import enum
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, ForeignKey, JSON, Float
from sqlalchemy import Enum as SAEnum, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional, List
from app.database import Base, TimestampMixin, SimulatedMixin


class IncidentSeverityEnum(str, enum.Enum):
    P1_CRITICAL = "P1_CRITICAL"
    P2_HIGH = "P2_HIGH"
    P3_MEDIUM = "P3_MEDIUM"
    P4_LOW = "P4_LOW"


class IncidentStatusEnum(str, enum.Enum):
    DETECTED = "DETECTED"
    TRIAGED = "TRIAGED"
    INVESTIGATING = "INVESTIGATING"
    CONTAINED = "CONTAINED"
    REMEDIATED = "REMEDIATED"
    CLOSED = "CLOSED"


class Incident(Base, TimestampMixin, SimulatedMixin):
    """Correlated security incident spanning multiple findings and telemetry anomalies."""
    __tablename__ = "incidents"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    cloud_account_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("cloud_accounts.id"), nullable=True, index=True)
    
    severity: Mapped[IncidentSeverityEnum] = mapped_column(SAEnum(IncidentSeverityEnum), nullable=False, index=True)
    status: Mapped[IncidentStatusEnum] = mapped_column(SAEnum(IncidentStatusEnum), default=IncidentStatusEnum.DETECTED, nullable=False, index=True)
    
    assigned_to: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("users.id"), nullable=True)
    mitre_attack_tactics: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    mitre_attack_techniques: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    
    blast_radius_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ai_root_cause_analysis: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ai_containment_plan: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    detected_at: Mapped[DateTime] = mapped_column(DateTime, nullable=False)
    contained_at: Mapped[Optional[DateTime]] = mapped_column(DateTime, nullable=True)
    resolved_at: Mapped[Optional[DateTime]] = mapped_column(DateTime, nullable=True)
    
    related_finding_ids: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    related_resource_ids: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)


class IncidentTimeline(Base, TimestampMixin):
    """Chronological event log for an incident."""
    __tablename__ = "incident_timelines"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    incident_id: Mapped[str] = mapped_column(String(64), ForeignKey("incidents.id"), nullable=False, index=True)
    event_type: Mapped[str] = mapped_column(String(64), nullable=False)  # 'STATUS_CHANGE', 'NOTE', 'AUTO_ACTION', 'EVIDENCE_ATTACHED'
    author_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("users.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    metadata_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
