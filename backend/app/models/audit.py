"""CloudGuard AI — ORM Models: Tamper-Evident Audit Logging"""
import enum
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy import Enum as SAEnum, Index
from sqlalchemy.orm import Mapped, mapped_column
from typing import Optional
from app.database import Base, TimestampMixin


class AuditActionEnum(str, enum.Enum):
    USER_LOGIN = "USER_LOGIN"
    USER_LOGOUT = "USER_LOGOUT"
    USER_REGISTER = "USER_REGISTER"
    USER_PASSWORD_RESET = "USER_PASSWORD_RESET"
    INGESTION_TRIGGERED = "INGESTION_TRIGGERED"
    INGESTION_COMPLETED = "INGESTION_COMPLETED"
    SCAN_TRIGGERED = "SCAN_TRIGGERED"
    SCAN_COMPLETED = "SCAN_COMPLETED"
    RULE_CREATED = "RULE_CREATED"
    RULE_UPDATED = "RULE_UPDATED"
    FINDING_STATUS_CHANGE = "FINDING_STATUS_CHANGE"
    INCIDENT_CREATED = "INCIDENT_CREATED"
    INCIDENT_STATUS_CHANGE = "INCIDENT_STATUS_CHANGE"
    REMEDIATION_PROPOSED = "REMEDIATION_PROPOSED"
    REMEDIATION_APPROVED = "REMEDIATION_APPROVED"
    REMEDIATION_EXECUTED = "REMEDIATION_EXECUTED"
    SYSTEM_CONFIG_CHANGE = "SYSTEM_CONFIG_CHANGE"


class AuditLog(Base, TimestampMixin):
    """Cryptographically chained append-only audit trail."""
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    sequence_number: Mapped[int] = mapped_column(Integer, autoincrement=True, unique=True, index=True)
    
    actor_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("users.id"), nullable=True, index=True)
    actor_email: Mapped[str] = mapped_column(String(255), nullable=False)
    ip_address: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    action: Mapped[AuditActionEnum] = mapped_column(SAEnum(AuditActionEnum), nullable=False, index=True)
    entity_type: Mapped[str] = mapped_column(String(64), nullable=False) # 'FINDING', 'INCIDENT', 'REMEDIATION', 'USER'
    entity_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    
    details: Mapped[dict] = mapped_column(JSON, nullable=False)
    
    # Hash Chaining for Tamper Evidence
    previous_hash: Mapped[str] = mapped_column(String(64), nullable=False) # SHA-256 of preceding record
    current_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)  # SHA-256(prev_hash + seq + payload)
