"""CloudGuard AI — Schemas: Cloud Accounts, Resources, Findings"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models.cloud import CloudProviderEnum, DataSourceTypeEnum, IngestionStatusEnum
from app.models.finding import SeverityEnum, FindingStatusEnum, RuleCategoryEnum


class CloudAccountCreate(BaseModel):
    name: str
    provider: CloudProviderEnum
    account_id: str
    environment: str = "production"
    credentials_json: Optional[Dict[str, Any]] = None


class CloudAccountResponse(BaseModel):
    id: str
    name: str
    provider: CloudProviderEnum
    account_id: str
    environment: str
    is_active: bool
    last_sync_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class DataSourceResponse(BaseModel):
    id: str
    cloud_account_id: str
    name: str
    source_type: DataSourceTypeEnum
    is_simulated: bool
    status: str
    last_ingested_at: Optional[datetime] = None
    total_records_ingested: int

    model_config = {"from_attributes": True}


class CloudResourceResponse(BaseModel):
    id: str
    cloud_account_id: str
    native_id: str
    name: str
    resource_type: str
    provider: str
    region: str
    configuration: Dict[str, Any]
    tags: Optional[Dict[str, str]] = None
    risk_score: float
    is_simulated: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class FindingResponse(BaseModel):
    id: str
    rule_id: str
    resource_id: str
    cloud_account_id: str
    title: str
    description: str
    severity: SeverityEnum
    status: FindingStatusEnum
    evidence_summary: Optional[str] = None
    raw_evidence: Optional[Dict[str, Any]] = None
    remediation_guidance: Optional[str] = None
    risk_score_contribution: float
    ai_analyzed: bool
    ai_risk_assessment: Optional[str] = None
    compliance_controls: Optional[List[Any]] = None
    is_simulated: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class SecurityRuleResponse(BaseModel):
    id: str
    name: str
    description: str
    category: RuleCategoryEnum
    provider: str
    default_severity: SeverityEnum
    remediation_template: Optional[str] = None
    framework_mappings: Optional[Dict[str, Any]] = None
    is_active: bool

    model_config = {"from_attributes": True}
