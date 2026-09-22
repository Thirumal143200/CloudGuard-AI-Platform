"""CloudGuard AI — API Routes: Cloud Accounts, Discovered Assets & Ingestion Hub"""
import json
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.cloud import CloudAccount, CloudProviderEnum, DataSource, IngestionJob, DataSourceTypeEnum, IngestionStatusEnum
from app.models.resource import CloudResource
from app.models.finding import Finding, FindingEvidence, SeverityEnum, FindingStatusEnum, SecurityRule
from app.models.incident import Incident, IncidentTimeline
from app.models.remediation import RemediationPlan, VerificationScan
from app.models.telemetry import TelemetryLog, AnomalyEvent
from app.schemas.cloud import CloudAccountCreate, CloudAccountResponse, CloudResourceResponse
from app.services.rule_engine import evaluate_resource_rules, RULES_CATALOG
from app.services.audit_service import log_action, AuditActionEnum
from app.config import settings

router = APIRouter(prefix="/cloud", tags=["Cloud Accounts, Resources & Ingestion"])


@router.get("/accounts", response_model=List[CloudAccountResponse])
def list_accounts(db: Session = Depends(get_db)):
    """List all connected cloud accounts."""
    return db.query(CloudAccount).all()


@router.post("/accounts", response_model=CloudAccountResponse)
def connect_account(acc_in: CloudAccountCreate, db: Session = Depends(get_db)):
    """Connect a new AWS / Azure / GCP cloud account."""
    acc = CloudAccount(
        id=f"acc-{uuid.uuid4().hex[:8]}",
        name=acc_in.name,
        provider=acc_in.provider,
        account_id=acc_in.account_id,
        environment=acc_in.environment,
        is_active=True,
        is_simulated=False,
        last_sync_at=datetime.now(timezone.utc)
    )
    db.add(acc)
    db.commit()
    db.refresh(acc)

    log_action(
        db,
        action=AuditActionEnum.CLOUD_SYNC,
        actor_id="admin@cloudguard.ai",
        entity_id=acc.id,
        payload={"event": "CLOUD_ACCOUNT_CONNECTED", "provider": str(acc.provider), "name": acc.name}
    )
    return acc


@router.get("/data-sources")
def list_data_sources(db: Session = Depends(get_db)):
    """List all registered and configured data ingestion sources with live status."""
    accounts = db.query(CloudAccount).all()
    resource_count = db.query(CloudResource).count()
    uploaded_count = db.query(CloudResource).filter(CloudResource.is_simulated == False).count()

    sources = [
        {
            "id": "ds-aws",
            "name": "Amazon Web Services (AWS)",
            "type": "CLOUD_CONNECTOR",
            "provider": "AWS",
            "status": "CONFIGURED" if settings.AWS_ACCESS_KEY_ID or any(a.provider == CloudProviderEnum.AWS for a in accounts) else "NOT CONFIGURED",
            "last_ingested": next((a.last_sync_at.isoformat() for a in accounts if a.provider == CloudProviderEnum.AWS and a.last_sync_at), None),
            "assets_discovered": db.query(CloudResource).filter(CloudResource.provider == CloudProviderEnum.AWS).count()
        },
        {
            "id": "ds-azure",
            "name": "Microsoft Azure",
            "type": "CLOUD_CONNECTOR",
            "provider": "AZURE",
            "status": "CONFIGURED" if settings.AZURE_CLIENT_ID or any(a.provider == CloudProviderEnum.AZURE for a in accounts) else "NOT CONFIGURED",
            "last_ingested": next((a.last_sync_at.isoformat() for a in accounts if a.provider == CloudProviderEnum.AZURE and a.last_sync_at), None),
            "assets_discovered": db.query(CloudResource).filter(CloudResource.provider == CloudProviderEnum.AZURE).count()
        },
        {
            "id": "ds-gcp",
            "name": "Google Cloud Platform (GCP)",
            "type": "CLOUD_CONNECTOR",
            "provider": "GCP",
            "status": "CONFIGURED" if settings.GCP_PROJECT_ID or any(a.provider == CloudProviderEnum.GCP for a in accounts) else "NOT CONFIGURED",
            "last_ingested": next((a.last_sync_at.isoformat() for a in accounts if a.provider == CloudProviderEnum.GCP and a.last_sync_at), None),
            "assets_discovered": db.query(CloudResource).filter(CloudResource.provider == CloudProviderEnum.GCP).count()
        },
        {
            "id": "ds-evidence-upload",
            "name": "Infrastructure Evidence & State Files",
            "type": "FILE_UPLOAD",
            "provider": "MULTI",
            "status": "CONNECTED" if uploaded_count > 0 else "READY",
            "last_ingested": datetime.now(timezone.utc).isoformat() if uploaded_count > 0 else None,
            "assets_discovered": uploaded_count
        }
    ]

    return {
        "sources": sources,
        "total_assets": resource_count,
        "uploaded_assets": uploaded_count,
        "mode": settings.DEPLOYMENT_MODE
    }


@router.post("/upload-evidence")
def upload_evidence(
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
):
    """
    Ingest user-provided infrastructure configuration (JSON/Terraform/YAML export).
    Evaluates deterministic security rules immediately, creates findings, and records to audit ledger.
    """
    name = payload.get("name", "Custom Uploaded Resource")
    provider_str = payload.get("provider", "AWS").upper()
    resource_type = payload.get("resource_type", "s3_bucket")
    config = payload.get("configuration", {})

    provider_enum = CloudProviderEnum.AWS
    if provider_str == "AZURE":
        provider_enum = CloudProviderEnum.AZURE
    elif provider_str == "GCP":
        provider_enum = CloudProviderEnum.GCP

    # Find or create uploaded account container
    account = db.query(CloudAccount).filter(CloudAccount.name == "User Uploaded Evidence").first()
    if not account:
        account = CloudAccount(
            id=f"acc-upload-{uuid.uuid4().hex[:6]}",
            name="User Uploaded Evidence",
            provider=provider_enum,
            account_id="user-upload-account",
            environment="production",
            is_active=True,
            is_simulated=False,
            last_sync_at=datetime.now(timezone.utc)
        )
        db.add(account)
        db.commit()
        db.refresh(account)

    res_id = f"res-upload-{uuid.uuid4().hex[:8]}"
    native_id = payload.get("native_id", f"{resource_type}-{uuid.uuid4().hex[:6]}")

    resource = CloudResource(
        id=res_id,
        cloud_account_id=account.id,
        provider=provider_enum,
        native_id=native_id,
        name=name,
        resource_type=resource_type,
        region=payload.get("region", "us-east-1"),
        configuration=config,
        tags=payload.get("tags", {"Source": "User-Evidence-Upload"}),
        risk_score=50.0,
        is_simulated=False
    )
    db.add(resource)
    db.commit()

    # Immediately evaluate security rules against uploaded configuration
    detected = evaluate_resource_rules(
        resource_id=res_id,
        resource_type=resource_type,
        provider=provider_str,
        configuration=config,
        account_id=account.id
    )

    created_findings = []
    max_risk = 20.0
    for det in detected:
        finding_id = f"fnd-{uuid.uuid4().hex[:8]}"
        risk = det.get("risk_contribution", 50.0)
        if risk > max_risk:
            max_risk = risk

        fnd = Finding(
            id=finding_id,
            cloud_account_id=account.id,
            resource_id=res_id,
            rule_id=det["rule_id"],
            title=det["title"],
            description=det["description"],
            severity=det["severity"],
            category=det["category"],
            status=FindingStatusEnum.OPEN,
            risk_score_contribution=risk,
            remediation_guidance=det["remediation_guidance"],
            compliance_framework_mappings=det["compliance_mappings"],
            is_simulated=False
        )
        db.add(fnd)
        db.flush()

        evidence = FindingEvidence(
            id=f"evi-{uuid.uuid4().hex[:8]}",
            finding_id=finding_id,
            evidence_type="CONFIGURATION_DIFF",
            evidence_data=det["raw_evidence"],
            summary=det["evidence_summary"],
            is_simulated=False
        )
        db.add(evidence)
        created_findings.append({
            "id": finding_id,
            "title": det["title"],
            "severity": str(det["severity"].value) if hasattr(det["severity"], "value") else str(det["severity"])
        })

    resource.risk_score = max_risk
    db.commit()

    log_action(
        db,
        action=AuditActionEnum.FINDING_CREATED,
        actor_id="admin@cloudguard.ai",
        entity_id=res_id,
        payload={
            "event": "EVIDENCE_UPLOADED_AND_EVALUATED",
            "resource_id": res_id,
            "native_id": native_id,
            "findings_count": len(created_findings)
        }
    )

    return {
        "status": "INGESTED",
        "resource_id": res_id,
        "native_id": native_id,
        "findings_generated": len(created_findings),
        "findings": created_findings
    }


@router.post("/rescan")
def trigger_rescan(db: Session = Depends(get_db)):
    """Re-evaluate all discovered resources against the active security rules catalog."""
    resources = db.query(CloudResource).all()
    total_evaluated = 0
    new_findings_count = 0

    for res in resources:
        total_evaluated += 1
        results = evaluate_resource_rules(
            resource_id=res.id,
            resource_type=res.resource_type,
            provider=str(res.provider.value) if hasattr(res.provider, "value") else str(res.provider),
            configuration=res.configuration or {},
            account_id=res.cloud_account_id
        )

        for det in results:
            existing = db.query(Finding).filter(
                Finding.resource_id == res.id,
                Finding.rule_id == det["rule_id"]
            ).first()

            if not existing:
                finding_id = f"fnd-{uuid.uuid4().hex[:8]}"
                fnd = Finding(
                    id=finding_id,
                    cloud_account_id=res.cloud_account_id,
                    resource_id=res.id,
                    rule_id=det["rule_id"],
                    title=det["title"],
                    description=det["description"],
                    severity=det["severity"],
                    category=det["category"],
                    status=FindingStatusEnum.OPEN,
                    risk_score_contribution=det.get("risk_contribution", 50.0),
                    remediation_guidance=det["remediation_guidance"],
                    compliance_framework_mappings=det["compliance_mappings"],
                    is_simulated=res.is_simulated
                )
                db.add(fnd)
                db.flush()

                evi = FindingEvidence(
                    id=f"evi-{uuid.uuid4().hex[:8]}",
                    finding_id=finding_id,
                    evidence_type="CONFIGURATION_DIFF",
                    evidence_data=det["raw_evidence"],
                    summary=det["evidence_summary"],
                    is_simulated=res.is_simulated
                )
                db.add(evi)
                new_findings_count += 1

    db.commit()

    log_action(
        db,
        action=AuditActionEnum.SCAN_COMPLETED,
        actor_id="admin@cloudguard.ai",
        entity_id="system-rescan",
        payload={
            "resources_evaluated": total_evaluated,
            "new_findings": new_findings_count
        }
    )

    return {
        "status": "SCAN_COMPLETE",
        "resources_evaluated": total_evaluated,
        "new_findings_detected": new_findings_count
    }


@router.delete("/clear-data")
def clear_all_data(db: Session = Depends(get_db)):
    """Clear all findings, incidents, remediations, and cloud resources to test NO_DATA mode."""
    db.query(FindingEvidence).delete()
    db.query(Finding).delete()
    db.query(IncidentTimeline).delete()
    db.query(Incident).delete()
    db.query(VerificationScan).delete()
    db.query(RemediationPlan).delete()
    db.query(TelemetryLog).delete()
    db.query(AnomalyEvent).delete()
    db.query(CloudResource).delete()
    db.query(CloudAccount).delete()
    db.commit()

    log_action(
        db,
        action=AuditActionEnum.SCAN_COMPLETED,
        actor_id="admin@cloudguard.ai",
        entity_id="system-purge",
        payload={"event": "SYSTEM_PURGED_TO_NO_DATA"}
    )
    return {"status": "PURGED", "message": "All data cleared. System is now in clean NO_DATA mode."}


@router.get("/resources", response_model=List[CloudResourceResponse])
def list_resources(
    account_id: Optional[str] = Query(None),
    provider: Optional[str] = Query(None),
    resource_type: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """List cloud inventory assets with optional multi-cloud filtering."""
    query = db.query(CloudResource)
    if account_id:
        query = query.filter(CloudResource.cloud_account_id == account_id)
    if provider and provider != "ALL":
        query = query.filter(CloudResource.provider == provider)
    if resource_type:
        query = query.filter(CloudResource.resource_type == resource_type)
    return query.all()


@router.get("/resources/{resource_id}", response_model=CloudResourceResponse)
def get_resource_detail(resource_id: str, db: Session = Depends(get_db)):
    """Retrieve full configuration and state of a single cloud resource."""
    res = db.query(CloudResource).filter(CloudResource.id == resource_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Resource not found")
    return res
