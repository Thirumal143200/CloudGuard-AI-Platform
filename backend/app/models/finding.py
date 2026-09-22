"""CloudGuard AI - ORM Models: Security Findings, Rules, and Evidence"""
import enum
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, ForeignKey, JSON, Float
from sqlalchemy import Enum as SAEnum, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional, List
from app.database import Base, TimestampMixin, SimulatedMixin


class SeverityEnum(str, enum.Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFORMATIONAL = "INFORMATIONAL"


class FindingStatusEnum(str, enum.Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    REMEDIATED = "REMEDIATED"
    RESOLVED = "RESOLVED"
    DISMISSED = "DISMISSED"
    SUPPRESSED = "SUPPRESSED"


class RuleCategoryEnum(str, enum.Enum):
    IAM = "IAM"
    STORAGE = "STORAGE"
    NETWORK = "NETWORK"
    COMPUTE = "COMPUTE"
    DATABASE = "DATABASE"
    ENCRYPTION = "ENCRYPTION"
    LOGGING = "LOGGING"
    COMPLIANCE = "COMPLIANCE"


class SecurityRule(Base, TimestampMixin):
    """Catalog of security rules applied to cloud resources."""
    __tablename__ = "security_rules"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)  # e.g., 'AWS-IAM-001'
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[RuleCategoryEnum] = mapped_column(SAEnum(RuleCategoryEnum), nullable=False, index=True)
    provider: Mapped[str] = mapped_column(String(32), nullable=False, default="AWS", index=True)
    default_severity: Mapped[SeverityEnum] = mapped_column(SAEnum(SeverityEnum), nullable=False)
    remediation_template: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    framework_mappings: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # {"CIS": "1.1", "PCI": "8.2"}
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    parameters: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)


class Finding(Base, TimestampMixin, SimulatedMixin):
    """Individual security vulnerability/misconfiguration finding."""
    __tablename__ = "findings"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("users.id"), nullable=True, index=True)
    rule_id: Mapped[str] = mapped_column(String(64), ForeignKey("security_rules.id"), nullable=False, index=True)
    resource_id: Mapped[str] = mapped_column(String(64), ForeignKey("cloud_resources.id"), nullable=False, index=True)
    cloud_account_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("cloud_accounts.id"), nullable=True, index=True)
    
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[SeverityEnum] = mapped_column(SAEnum(SeverityEnum), nullable=False, index=True)
    status: Mapped[FindingStatusEnum] = mapped_column(SAEnum(FindingStatusEnum), default=FindingStatusEnum.OPEN, nullable=False, index=True)
    
    # Evidence & Analysis
    evidence_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    raw_evidence: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    remediation_guidance: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    risk_score_contribution: Mapped[float] = mapped_column(Float, default=0.0)
    
    # AI Attribution
    ai_analyzed: Mapped[bool] = mapped_column(Boolean, default=False)
    ai_risk_assessment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Compliance Tags
    compliance_controls: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)

    __table_args__ = (
        Index("ix_finding_account_severity", "cloud_account_id", "severity"),
        Index("ix_finding_account_status", "cloud_account_id", "status"),
        Index("ix_finding_user_id", "user_id"),
        Index("ix_finding_user_status", "user_id", "status"),
    )


class FindingEvidence(Base, TimestampMixin):
    """Detailed audit evidence record tied to a finding."""
    __tablename__ = "finding_evidences"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    finding_id: Mapped[str] = mapped_column(String(64), ForeignKey("findings.id"), nullable=False, index=True)
    evidence_type: Mapped[str] = mapped_column(String(64), nullable=False)  # e.g., 'API_RESPONSE', 'LOG_ENTRY'
    source_component: Mapped[str] = mapped_column(String(128), nullable=False)
    payload: Mapped[dict] = mapped_column(JSON, nullable=False)
    hash_sha256: Mapped[str] = mapped_column(String(64), nullable=False)
