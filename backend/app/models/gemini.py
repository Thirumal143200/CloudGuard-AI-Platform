"""CloudGuard AI — ORM Models: AI Explanations, Root Cause Analysis, and Gemini Audit Logs"""
import enum
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, ForeignKey, JSON, Float
from sqlalchemy import Enum as SAEnum, Index
from sqlalchemy.orm import Mapped, mapped_column
from typing import Optional
from app.database import Base, TimestampMixin, SimulatedMixin


class PromptCategoryEnum(str, enum.Enum):
    FINDING_ANALYSIS = "FINDING_ANALYSIS"
    INCIDENT_ROOT_CAUSE = "INCIDENT_ROOT_CAUSE"
    REMEDIATION_GEN = "REMEDIATION_GEN"
    EXECUTIVE_SUMMARY = "EXECUTIVE_SUMMARY"
    BLAST_RADIUS = "BLAST_RADIUS"
    THREAT_MODEL = "THREAT_MODEL"


class GeminiAuditLog(Base, TimestampMixin, SimulatedMixin):
    """Auditable log of every AI inference call with ground-truth input/output and provenance."""
    __tablename__ = "gemini_audit_logs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    category: Mapped[PromptCategoryEnum] = mapped_column(SAEnum(PromptCategoryEnum), nullable=False, index=True)
    model_name: Mapped[str] = mapped_column(String(64), default="gemini-2.5-flash", nullable=False)
    
    target_entity_type: Mapped[str] = mapped_column(String(64), nullable=False) # 'FINDING', 'INCIDENT'
    target_entity_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    
    system_prompt: Mapped[Text] = mapped_column(Text, nullable=False)
    user_prompt: Mapped[Text] = mapped_column(Text, nullable=False)
    raw_response: Mapped[Text] = mapped_column(Text, nullable=False)
    parsed_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    latency_ms: Mapped[int] = mapped_column(Integer, default=0)
    prompt_tokens: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    completion_tokens: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_fallback: Mapped[bool] = mapped_column(Boolean, default=False)
    fallback_reason: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
