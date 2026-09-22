"""CloudGuard AI â€” Schemas: Incidents, Remediations, Gemini AI, Analytics"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models.incident import IncidentSeverityEnum, IncidentStatusEnum
from app.models.remediation import RemediationPlanStatus, ActionRiskTier


class IncidentResponse(BaseModel):
    id: str
    title: str
    description: str
    cloud_account_id: str
    severity: IncidentSeverityEnum
    status: IncidentStatusEnum
    assigned_to: Optional[str] = None
    mitre_attack_tactics: Optional[List[str]] = None
    mitre_attack_techniques: Optional[List[str]] = None
    blast_radius_summary: Optional[str] = None
    ai_root_cause_analysis: Optional[str] = None
    ai_containment_plan: Optional[str] = None
    detected_at: datetime
    contained_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    related_finding_ids: Optional[List[str]] = None
    related_resource_ids: Optional[List[str]] = None
    is_simulated: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class IncidentTimelineResponse(BaseModel):
    id: str
    incident_id: str
    event_type: str
    author_id: Optional[str] = None
    title: str
    description: str
    metadata_json: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class RemediationPlanResponse(BaseModel):
    id: str
    title: str
    description: str
    finding_id: Optional[str] = None
    incident_id: Optional[str] = None
    cloud_account_id: str
    status: RemediationPlanStatus
    risk_tier: ActionRiskTier
    cli_commands: Optional[List[Dict[str, Any]]] = None
    terraform_hcl: Optional[str] = None
    python_script: Optional[str] = None
    dry_run_output: Optional[Dict[str, Any]] = None
    dry_run_success: Optional[bool] = None
    execution_result: Optional[Dict[str, Any]] = None
    post_verification_status: Optional[str] = None
    is_simulated: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class RemediationExecuteRequest(BaseModel):
    plan_id: str
    action: str = "EXECUTE"  # 'DRY_RUN', 'EXECUTE', 'ROLLBACK'
    confirmation: bool = False


class GeminiAnalysisRequest(BaseModel):
    target_type: str  # 'FINDING', 'INCIDENT', 'GENERAL_ASSISTANT'
    target_id: Optional[str] = None
    query: Optional[str] = None
    context: Optional[Dict[str, Any]] = None


class GeminiAnalysisResponse(BaseModel):
    analysis_id: str
    summary: str
    root_cause: Optional[str] = None
    blast_radius: Optional[str] = None
    mitre_attack_tactics: Optional[List[str]] = None
    mitre_attack_techniques: Optional[List[str]] = None
    remediation_steps: List[str] = Field(default_factory=list)
    compliance_impact: Optional[List[str]] = None
    risk_assessment: Optional[str] = None
    recommended_actions: Optional[List[str]] = None
    model_used: str
    latency_ms: int
    is_fallback: bool
    fallback_reason: Optional[str] = None
    timestamp: datetime


class RiskDashboardMetrics(BaseModel):
    overall_risk_score: float
    trend_delta_24h: float
    total_resources: int
    total_findings: int
    findings_by_severity: Dict[str, int]
    open_incidents_count: int
    remediation_success_rate: float
    top_vulnerable_resources: List[Dict[str, Any]]
    compliance_scores: Dict[str, float]
    ml_anomaly_count_24h: int
