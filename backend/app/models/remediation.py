"""CloudGuard AI - ORM Models: Remediation Plans, Actions, and Verification Scans"""
import enum
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, ForeignKey, JSON, Float
from sqlalchemy import Enum as SAEnum, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional, List
from app.database import Base, TimestampMixin, SimulatedMixin


class RemediationPlanStatus(str, enum.Enum):
    PROPOSED = "PROPOSED"
    DRY_RUN_COMPLETED = "DRY_RUN_COMPLETED"
    APPROVED = "APPROVED"
    EXECUTING = "EXECUTING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    ROLLED_BACK = "ROLLED_BACK"


class ActionRiskTier(str, enum.Enum):
    SAFE_AUTO = "SAFE_AUTO"        # Low impact, reversible instantly
    HUMAN_CONFIRM = "HUMAN_CONFIRM" # Moderate risk, requires 1-click human approval
    ELEVATED = "ELEVATED"          # High risk, service restart / disruptive, requires 2-factor confirmation


class RemediationPlan(Base, TimestampMixin, SimulatedMixin):
    """Structured remediation package for finding(s) or incident(s)."""
    __tablename__ = "remediation_plans"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("users.id"), nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    
    finding_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("findings.id"), nullable=True, index=True)
    incident_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("incidents.id"), nullable=True, index=True)
    cloud_account_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("cloud_accounts.id"), nullable=True, index=True)
    
    status: Mapped[RemediationPlanStatus] = mapped_column(SAEnum(RemediationPlanStatus), default=RemediationPlanStatus.PROPOSED, nullable=False, index=True)
    risk_tier: Mapped[ActionRiskTier] = mapped_column(SAEnum(ActionRiskTier), default=ActionRiskTier.HUMAN_CONFIRM, nullable=False)
    
    cli_commands: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)     # [{"command": "aws s3api...", "provider": "AWS"}]
    terraform_hcl: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    python_script: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    dry_run_output: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    dry_run_success: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    
    approved_by: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("users.id"), nullable=True)
    executed_by: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("users.id"), nullable=True)
    
    execution_result: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    post_verification_status: Mapped[Optional[str]] = mapped_column(String(64), nullable=True) # 'VERIFIED_FIXED', 'RE-DETECTED', 'PENDING'
    rollback_script: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class VerificationScan(Base, TimestampMixin):
    """Post-remediation re-scan to prove the vulnerability is eliminated."""
    __tablename__ = "verification_scans"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("users.id"), nullable=True, index=True)
    remediation_plan_id: Mapped[str] = mapped_column(String(64), ForeignKey("remediation_plans.id"), nullable=False, index=True)
    resource_id: Mapped[str] = mapped_column(String(64), ForeignKey("cloud_resources.id"), nullable=False)
    
    rule_id: Mapped[str] = mapped_column(String(64), nullable=False)
    passed: Mapped[bool] = mapped_column(Boolean, nullable=False)
    raw_scan_output: Mapped[dict] = mapped_column(JSON, nullable=False)
    execution_time_ms: Mapped[int] = mapped_column(Integer, default=0)
