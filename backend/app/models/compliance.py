"""CloudGuard AI â€” ORM Models: Compliance Frameworks, Controls, and Assessments"""
import enum
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, ForeignKey, JSON, Float
from sqlalchemy import Enum as SAEnum, Index
from sqlalchemy.orm import Mapped, mapped_column
from typing import Optional
from app.database import Base, TimestampMixin


class FrameworkTypeEnum(str, enum.Enum):
    CIS_AWS_V3 = "CIS_AWS_V3"
    PCI_DSS_V4 = "PCI_DSS_V4"
    SOC2_TYPE2 = "SOC2_TYPE2"
    HIPAA_SECURITY = "HIPAA_SECURITY"
    NIST_CSF = "NIST_CSF"
    ISO_27001 = "ISO_27001"


class ComplianceFramework(Base, TimestampMixin):
    """Catalog of supported compliance benchmark standards."""
    __tablename__ = "compliance_frameworks"

    id: Mapped[str] = mapped_column(String(64), primary_key=True) # e.g. 'CIS_AWS_V3'
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    version: Mapped[str] = mapped_column(String(32), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    total_controls: Mapped[int] = mapped_column(Integer, default=0)


class ComplianceControl(Base, TimestampMixin):
    """Specific requirement/control within a framework."""
    __tablename__ = "compliance_controls"

    id: Mapped[str] = mapped_column(String(64), primary_key=True) # e.g. 'CIS-1.14'
    framework_id: Mapped[str] = mapped_column(String(64), ForeignKey("compliance_frameworks.id"), nullable=False, index=True)
    control_code: Mapped[str] = mapped_column(String(64), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    domain: Mapped[str] = mapped_column(String(128), nullable=False) # e.g. 'Identity and Access Management'
    mapped_rule_ids: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)


class ComplianceAssessment(Base, TimestampMixin):
    """Historical point-in-time compliance evaluation."""
    __tablename__ = "compliance_assessments"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    cloud_account_id: Mapped[str] = mapped_column(String(64), ForeignKey("cloud_accounts.id"), nullable=False, index=True)
    framework_id: Mapped[str] = mapped_column(String(64), ForeignKey("compliance_frameworks.id"), nullable=False, index=True)
    
    score_percent: Mapped[float] = mapped_column(Float, nullable=False)
    passed_controls: Mapped[int] = mapped_column(Integer, default=0)
    failed_controls: Mapped[int] = mapped_column(Integer, default=0)
    total_evaluated: Mapped[int] = mapped_column(Integer, default=0)
    
    detailed_results: Mapped[dict] = mapped_column(JSON, nullable=False)
