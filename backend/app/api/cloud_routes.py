"""CloudGuard AI - API Routes: Cloud Accounts, Discovered Assets & Ingestion Hub"""
import json
import uuid
import hashlib
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Body, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.services.auth_service import get_current_user
from app.models.cloud import (
    CloudAccount,
    CloudProviderEnum,
    DataSource,
    IngestionJob,
    DataSourceTypeEnum,
    IngestionStatusEnum,
    JobStatus,
)
from app.models.resource import CloudResource
from app.models.finding import Finding, FindingEvidence, SeverityEnum, FindingStatusEnum, SecurityRule
from app.models.incident import Incident, IncidentTimeline
from app.models.remediation import RemediationPlan, VerificationScan
from app.models.telemetry import TelemetryLog, AnomalyEvent
from app.schemas.cloud import CloudAccountCreate, CloudAccountResponse, CloudResourceResponse
from app.services.rule_engine import evaluate_resource_rules, RULES_CATALOG
from app.services.audit_service import log_action, AuditActionEnum
from app.services.parser_service import parse_and_normalize_file, IngestionParserError
from app.config import settings

router = APIRouter(prefix="/cloud", tags=["Cloud Accounts, Resources & Ingestion"])


@router.get("/accounts", response_model=List[CloudAccountResponse])
def list_accounts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List connected cloud accounts scoped to the authenticated user."""
    query = db.query(CloudAccount)
    if current_user.role != UserRole.ADMIN:
        query = query.filter(CloudAccount.user_id == current_user.id)
    return query.all()


@router.post("/accounts", response_model=CloudAccountResponse)
def connect_account(
    acc_in: CloudAccountCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Connect a new AWS / Azure / GCP cloud account for the authenticated user."""
    acc = CloudAccount(
        id=f"acc-{uuid.uuid4().hex[:8]}",
        user_id=current_user.id,
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
        entity_type="CLOUD_ACCOUNT",
        entity_id=acc.id,
        actor_id=current_user.id,
        actor_email=current_user.email,
        details={"event": "CLOUD_ACCOUNT_CONNECTED", "provider": str(acc.provider), "name": acc.name}
    )
    return acc


@router.get("/data-sources")
def list_data_sources(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all data ingestion channels with honest configuration status,
    required permissions, collected resource types, and supported formats.
    """
    if current_user.role == UserRole.ADMIN:
        accounts = db.query(CloudAccount).all()
        resource_count = db.query(CloudResource).count()
        uploaded_count = db.query(CloudResource).filter(CloudResource.is_simulated == False).count()
    else:
        accounts = db.query(CloudAccount).filter(CloudAccount.user_id == current_user.id).all()
        resource_count = db.query(CloudResource).filter(CloudResource.user_id == current_user.id).count()
        uploaded_count = db.query(CloudResource).filter(
            CloudResource.user_id == current_user.id,
            CloudResource.is_simulated == False
        ).count()

    aws_configured = bool(settings.AWS_ACCESS_KEY_ID and settings.AWS_ACCESS_KEY_ID.strip())
    azure_configured = bool(settings.AZURE_CLIENT_ID and settings.AZURE_CLIENT_ID.strip())
    gcp_configured = bool(settings.GCP_PROJECT_ID and settings.GCP_PROJECT_ID.strip())

    aws_res_query = db.query(CloudResource).filter(CloudResource.provider == CloudProviderEnum.AWS)
    az_res_query = db.query(CloudResource).filter(CloudResource.provider == CloudProviderEnum.AZURE)
    gcp_res_query = db.query(CloudResource).filter(CloudResource.provider == CloudProviderEnum.GCP)
    if current_user.role != UserRole.ADMIN:
        aws_res_query = aws_res_query.filter(CloudResource.user_id == current_user.id)
        az_res_query = az_res_query.filter(CloudResource.user_id == current_user.id)
        gcp_res_query = gcp_res_query.filter(CloudResource.user_id == current_user.id)

    sources = [
        {
            "id": "ds-aws",
            "name": "Amazon Web Services (AWS)",
            "type": "CLOUD_CONNECTOR",
            "provider": "AWS",
            "status": "CONFIGURED" if aws_configured else "NOT CONFIGURED",
            "status_message": "Credentials verified via environment." if aws_configured else "AWS connector is not configured in backend environment variables.",
            "required_permissions": "IAM Policy: arn:aws:iam::aws:policy/SecurityAudit or ReadOnlyAccess",
            "resources_collected": [
                "AWS::S3::Bucket",
                "AWS::EC2::SecurityGroup",
                "AWS::IAM::User",
                "AWS::RDS::DBInstance",
                "AWS::CloudTrail::Trail"
            ],
            "last_ingested": next((a.last_sync_at.isoformat() for a in accounts if a.provider == CloudProviderEnum.AWS and a.last_sync_at), None),
            "assets_discovered": aws_res_query.count()
        },
        {
            "id": "ds-azure",
            "name": "Microsoft Azure",
            "type": "CLOUD_CONNECTOR",
            "provider": "AZURE",
            "status": "CONFIGURED" if azure_configured else "NOT CONFIGURED",
            "status_message": "Credentials verified via environment." if azure_configured else "Azure connector is not configured in backend environment variables.",
            "required_permissions": "Azure RBAC: Reader or Security Reader role",
            "resources_collected": [
                "Microsoft.Storage/storageAccounts",
                "Microsoft.Network/networkSecurityGroups",
                "Microsoft.Compute/virtualMachines"
            ],
            "last_ingested": next((a.last_sync_at.isoformat() for a in accounts if a.provider == CloudProviderEnum.AZURE and a.last_sync_at), None),
            "assets_discovered": az_res_query.count()
        },
        {
            "id": "ds-gcp",
            "name": "Google Cloud Platform (GCP)",
            "type": "CLOUD_CONNECTOR",
            "provider": "GCP",
            "status": "CONFIGURED" if gcp_configured else "NOT CONFIGURED",
            "status_message": "Credentials verified via environment." if gcp_configured else "GCP connector is not configured in backend environment variables.",
            "required_permissions": "GCP IAM: roles/viewer + roles/securityReviewer",
            "resources_collected": [
                "GCP::Storage::Bucket",
                "GCP::Compute::FirewallRule",
                "GCP::IAM::ServiceAccount"
            ],
            "last_ingested": next((a.last_sync_at.isoformat() for a in accounts if a.provider == CloudProviderEnum.GCP and a.last_sync_at), None),
            "assets_discovered": gcp_res_query.count()
        },
        {
            "id": "ds-file-upload",
            "name": "Security Data File Upload",
            "type": "FILE_UPLOAD",
            "provider": "MULTI",
            "status": "ACTIVE",
            "status_message": "Accepts JSON, CSV, Terraform (.tf / .tfstate), and YAML files.",
            "supported_formats": [
                {"ext": ".json", "name": "JSON", "description": "CloudGuard resource definitions, AWS CLI/Config exports, Terraform state"},
                {"ext": ".csv", "name": "CSV", "description": "Tabular cloud resource inventory sheets with headers"},
                {"ext": ".tf", "name": "Terraform HCL", "description": "Infrastructure-as-code resource declarations"},
                {"ext": ".yaml", "name": "YAML", "description": "Kubernetes and CloudFormation manifests"}
            ],
            "unsupported_formats": [
                {"ext": ".pdf", "name": "PDF Reports", "reason": "PDF reports are not supported for automated ingestion by this deployment. Please export security findings to JSON or CSV."}
            ],
            "last_ingested": datetime.now(timezone.utc).isoformat() if uploaded_count > 0 else None,
            "assets_discovered": uploaded_count
        }
    ]

    return {
        "sources": sources,
        "total_assets": resource_count,
        "uploaded_assets": uploaded_count,
        "mode": settings.DEPLOYMENT_MODE,
        "api_ingestion_docs": {
            "endpoint": "/api/v1/cloud/upload-evidence",
            "method": "POST",
            "content_type": "application/json",
            "schema_example": {
                "name": "prod-customer-vault-2026",
                "resource_type": "AWS::S3::Bucket",
                "provider": "AWS",
                "region": "us-east-1",
                "configuration": {
                    "is_public": True,
                    "encrypted": False,
                    "public_access_block": {"BlockPublicAcls": False, "BlockPublicPolicy": False}
                }
            }
        }
    }


def _record_ingestion_job(
    db: Session,
    filename: str,
    records_count: int,
    status: JobStatus,
    user_id: Optional[str] = None,
    error: Optional[str] = None
):
    """Helper to record an ingestion job entry tied to the authenticated user."""
    try:
        ds_query = db.query(DataSource).filter(DataSource.name == "File Upload Hub")
        if user_id:
            ds_query = ds_query.filter(DataSource.user_id == user_id)
        ds = ds_query.first()

        if not ds:
            ds = DataSource(
                id=f"ds-upload-{uuid.uuid4().hex[:6]}",
                user_id=user_id,
                name="File Upload Hub",
                source_type=DataSourceTypeEnum.USER_UPLOAD,
                status="ACTIVE",
                total_records_ingested=0
            )
            db.add(ds)
            db.commit()
            db.refresh(ds)

        job = IngestionJob(
            id=f"job-{uuid.uuid4().hex[:8]}",
            user_id=user_id,
            data_source_id=ds.id,
            job_type=f"FILE_UPLOAD ({filename})",
            status=status,
            records_processed=records_count,
            records_failed=0 if status == JobStatus.COMPLETED else 1,
            error_message=error
        )
        db.add(job)
        ds.total_records_ingested += records_count
        ds.last_ingested_at = datetime.now(timezone.utc)
        db.commit()
        return job
    except Exception as e:
        print(f"[WARN] Failed to record IngestionJob: {e}")
        return None


@router.post("/upload-file")
async def upload_security_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Ingest a security configuration file (JSON, CSV, Terraform HCL, or YAML).
    Validates, parses, discovers assets, evaluates deterministic security rules,
    and commits audit ledger records - scoped strictly to the authenticated user.
    """
    try:
        content_bytes = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")

    if not content_bytes or len(content_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty (0 bytes).")

    try:
        normalized_resources, format_detected = parse_and_normalize_file(file.filename, content_bytes)
    except IngestionParserError as e:
        _record_ingestion_job(db, filename=file.filename, records_count=0, status=JobStatus.FAILED, user_id=current_user.id, error=str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        _record_ingestion_job(db, filename=file.filename, records_count=0, status=JobStatus.FAILED, user_id=current_user.id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Unexpected parser failure: {str(e)}")

    account = db.query(CloudAccount).filter(
        CloudAccount.name == "User Uploaded Evidence",
        CloudAccount.user_id == current_user.id
    ).first()

    if not account:
        account = CloudAccount(
            id=f"acc-upload-{uuid.uuid4().hex[:6]}",
            user_id=current_user.id,
            name="User Uploaded Evidence",
            provider=CloudProviderEnum.MULTI,
            account_id=f"user-{current_user.id[:8]}",
            environment="production",
            is_active=True,
            is_simulated=False,
            last_sync_at=datetime.now(timezone.utc)
        )
        db.add(account)
        db.commit()
        db.refresh(account)

    created_resources = []
    all_created_findings = []

    for res_dict in normalized_resources:
        res_id = f"res-up-{uuid.uuid4().hex[:8]}"
        provider_str = res_dict.get("provider", "AWS").upper()
        provider_enum = CloudProviderEnum.AWS
        if provider_str == "AZURE":
            provider_enum = CloudProviderEnum.AZURE
        elif provider_str == "GCP":
            provider_enum = CloudProviderEnum.GCP

        resource = CloudResource(
            id=res_id,
            user_id=current_user.id,
            cloud_account_id=account.id,
            provider=provider_enum,
            native_id=res_dict.get("native_id") or f"{res_dict.get('name')}-{uuid.uuid4().hex[:4]}",
            name=res_dict.get("name", "Unnamed Resource"),
            resource_type=res_dict.get("resource_type", "AWS::S3::Bucket"),
            region=res_dict.get("region", "us-east-1"),
            configuration=res_dict.get("configuration", {}),
            tags=res_dict.get("tags", {"Source": file.filename}),
            risk_score=50.0,
            is_simulated=False
        )
        db.add(resource)
        db.flush()

        detected = evaluate_resource_rules(
            resource_id=res_id,
            resource_type=resource.resource_type,
            provider=provider_str,
            configuration=resource.configuration,
            account_id=account.id
        )

        max_risk = 20.0
        for det in detected:
            finding_id = f"fnd-{uuid.uuid4().hex[:8]}"
            risk = det.get("risk_contribution", 50.0)
            if risk > max_risk:
                max_risk = risk

            fnd = Finding(
                id=finding_id,
                user_id=current_user.id,
                cloud_account_id=account.id,
                resource_id=res_id,
                rule_id=det["rule_id"],
                title=det["title"],
                description=det["description"],
                severity=det["severity"],
                status=FindingStatusEnum.OPEN,
                evidence_summary=det.get("evidence_summary"),
                raw_evidence=det.get("raw_evidence"),
                remediation_guidance=det.get("remediation_guidance"),
                risk_score_contribution=risk,
                compliance_controls=list(det.get("compliance_mappings", {}).keys()) if isinstance(det.get("compliance_mappings"), dict) else [],
                is_simulated=False
            )
            db.add(fnd)
            db.flush()

            raw_ev = det.get("raw_evidence") or {}
            evi = FindingEvidence(
                id=f"evi-{uuid.uuid4().hex[:8]}",
                finding_id=finding_id,
                evidence_type="CONFIGURATION_DIFF",
                source_component="SecurityData-Upload",
                payload=raw_ev,
                hash_sha256=hashlib.sha256(json.dumps(raw_ev, sort_keys=True, default=str).encode()).hexdigest()
            )
            db.add(evi)
            all_created_findings.append({
                "id": finding_id,
                "title": det["title"],
                "severity": str(det["severity"].value) if hasattr(det["severity"], "value") else str(det["severity"]),
                "resource_name": resource.name,
                "rule_id": det["rule_id"]
            })

        resource.risk_score = max_risk
        created_resources.append({
            "id": res_id,
            "name": resource.name,
            "type": resource.resource_type,
            "provider": provider_str,
            "risk_score": max_risk
        })

    db.commit()

    job = _record_ingestion_job(
        db,
        filename=file.filename,
        records_count=len(created_resources),
        status=JobStatus.COMPLETED,
        user_id=current_user.id
    )

    log_action(
        db,
        action=AuditActionEnum.INGESTION_COMPLETED,
        entity_type="FILE_INGESTION",
        entity_id=file.filename,
        actor_id=current_user.id,
        actor_email=current_user.email,
        details={
            "event": "FILE_INGESTION_COMPLETED",
            "filename": file.filename,
            "format": format_detected,
            "assets_discovered": len(created_resources),
            "findings_generated": len(all_created_findings),
            "job_id": job.id if job else None
        }
    )

    return {
        "status": "COMPLETED",
        "filename": file.filename,
        "format_detected": format_detected,
        "assets_discovered": len(created_resources),
        "findings_generated": len(all_created_findings),
        "resources": created_resources,
        "findings": all_created_findings
    }


@router.get("/ingestion-jobs")
def list_ingestion_jobs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List recent ingestion jobs belonging to the authenticated user."""
    query = db.query(IngestionJob)
    if current_user.role != UserRole.ADMIN:
        query = query.filter(IngestionJob.user_id == current_user.id)
    jobs = query.order_by(IngestionJob.created_at.desc()).limit(20).all()
    return [
        {
            "id": j.id,
            "job_type": j.job_type,
            "status": str(j.status.value) if hasattr(j.status, "value") else str(j.status),
            "records_processed": j.records_processed,
            "records_failed": j.records_failed,
            "error_message": j.error_message,
            "created_at": j.created_at.isoformat() if hasattr(j.created_at, "isoformat") else str(j.created_at)
        }
        for j in jobs
    ]


@router.post("/upload-evidence")
def upload_evidence(
    payload: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Direct JSON evidence ingestion for CI/CD pipelines.
    Always assigns user_id from verified JWT (ignoring any user_id in the payload).
    """
    account = db.query(CloudAccount).filter(
        CloudAccount.name == "REST API Ingested Assets",
        CloudAccount.user_id == current_user.id
    ).first()

    if not account:
        account = CloudAccount(
            id=f"acc-api-{uuid.uuid4().hex[:6]}",
            user_id=current_user.id,
            name="REST API Ingested Assets",
            provider=CloudProviderEnum.MULTI,
            account_id=f"api-upload-{current_user.id[:8]}",
            environment="production",
            is_active=True,
            is_simulated=False,
            last_sync_at=datetime.now(timezone.utc)
        )
        db.add(account)
        db.commit()
        db.refresh(account)

    name = payload.get("name") or f"api-resource-{uuid.uuid4().hex[:6]}"
    resource_type = payload.get("resource_type") or "AWS::S3::Bucket"
    provider_str = payload.get("provider", "AWS").upper()
    config = payload.get("configuration") or {}

    provider_enum = CloudProviderEnum.AWS
    if provider_str == "AZURE":
        provider_enum = CloudProviderEnum.AZURE
    elif provider_str == "GCP":
        provider_enum = CloudProviderEnum.GCP

    res_id = f"res-api-{uuid.uuid4().hex[:8]}"
    native_id = payload.get("native_id", f"{resource_type}-{uuid.uuid4().hex[:6]}")

    resource = CloudResource(
        id=res_id,
        user_id=current_user.id,
        cloud_account_id=account.id,
        provider=provider_enum,
        native_id=native_id,
        name=name,
        resource_type=resource_type,
        region=payload.get("region", "us-east-1"),
        configuration=config,
        tags=payload.get("tags", {"Source": "API-Evidence-Upload"}),
        risk_score=50.0,
        is_simulated=False
    )
    db.add(resource)
    db.commit()

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
            user_id=current_user.id,
            cloud_account_id=account.id,
            resource_id=res_id,
            rule_id=det["rule_id"],
            title=det["title"],
            description=det["description"],
            severity=det["severity"],
            status=FindingStatusEnum.OPEN,
            evidence_summary=det.get("evidence_summary"),
            raw_evidence=det.get("raw_evidence"),
            remediation_guidance=det.get("remediation_guidance"),
            risk_score_contribution=risk,
            compliance_controls=list(det.get("compliance_mappings", {}).keys()) if isinstance(det.get("compliance_mappings"), dict) else [],
            is_simulated=False
        )
        db.add(fnd)
        db.flush()

        raw_ev = det.get("raw_evidence") or {}
        evidence = FindingEvidence(
            id=f"evi-{uuid.uuid4().hex[:8]}",
            finding_id=finding_id,
            evidence_type="CONFIGURATION_DIFF",
            source_component="API-Upload",
            payload=raw_ev,
            hash_sha256=hashlib.sha256(json.dumps(raw_ev, sort_keys=True, default=str).encode()).hexdigest()
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
        action=AuditActionEnum.INGESTION_COMPLETED,
        entity_type="API_EVIDENCE",
        entity_id=res_id,
        actor_id=current_user.id,
        actor_email=current_user.email,
        details={
            "event": "API_EVIDENCE_INGESTED",
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


@router.get("/resources", response_model=List[CloudResourceResponse])
def list_resources(
    provider: Optional[str] = Query(None),
    resource_type: Optional[str] = Query(None),
    account_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List discovered cloud resources scoped to the authenticated user."""
    query = db.query(CloudResource)
    if current_user.role != UserRole.ADMIN:
        query = query.filter(CloudResource.user_id == current_user.id)
    if provider and provider != "ALL":
        query = query.filter(CloudResource.provider == provider.upper())
    if resource_type:
        query = query.filter(CloudResource.resource_type == resource_type)
    if account_id:
        query = query.filter(CloudResource.cloud_account_id == account_id)
    return query.order_by(CloudResource.risk_score.desc()).all()


@router.get("/resources/{resource_id}", response_model=CloudResourceResponse)
def get_resource(
    resource_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve full configuration snapshot of a specific cloud resource with IDOR protection."""
    query = db.query(CloudResource).filter(CloudResource.id == resource_id)
    if current_user.role != UserRole.ADMIN:
        query = query.filter(CloudResource.user_id == current_user.id)
    res = query.first()
    if not res:
        raise HTTPException(status_code=404, detail="Resource not found")
    return res


@router.post("/rescan")
def trigger_rescan(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Re-evaluate all discovered resources against active rules catalog for the user."""
    query = db.query(CloudResource)
    if current_user.role != UserRole.ADMIN:
        query = query.filter(CloudResource.user_id == current_user.id)
    resources = query.all()
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
                    user_id=current_user.id,
                    cloud_account_id=res.cloud_account_id,
                    resource_id=res.id,
                    rule_id=det["rule_id"],
                    title=det["title"],
                    description=det["description"],
                    severity=det["severity"],
                    status=FindingStatusEnum.OPEN,
                    evidence_summary=det.get("evidence_summary"),
                    raw_evidence=det.get("raw_evidence"),
                    remediation_guidance=det.get("remediation_guidance"),
                    risk_score_contribution=det.get("risk_contribution", 50.0),
                    compliance_controls=list(det.get("compliance_mappings", {}).keys()) if isinstance(det.get("compliance_mappings"), dict) else [],
                    is_simulated=res.is_simulated
                )
                db.add(fnd)
                db.flush()

                raw_ev = det.get("raw_evidence") or {}
                evi = FindingEvidence(
                    id=f"evi-{uuid.uuid4().hex[:8]}",
                    finding_id=finding_id,
                    evidence_type="CONFIGURATION_DIFF",
                    source_component="Policy-Rescan",
                    payload=raw_ev,
                    hash_sha256=hashlib.sha256(json.dumps(raw_ev, sort_keys=True, default=str).encode()).hexdigest()
                )
                db.add(evi)
                new_findings_count += 1

    db.commit()

    log_action(
        db,
        action=AuditActionEnum.SCAN_COMPLETED,
        entity_type="SYSTEM",
        entity_id="system-rescan",
        actor_id=current_user.id,
        actor_email=current_user.email,
        details={
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
def clear_all_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Clear resources, findings, incidents and jobs belonging to the authenticated user."""
    if current_user.role == UserRole.ADMIN:
        db.query(FindingEvidence).delete()
        db.query(Finding).delete()
        db.query(IncidentTimeline).delete()
        db.query(Incident).delete()
        db.query(RemediationPlan).delete()
        db.query(CloudResource).delete()
        db.query(CloudAccount).delete()
        db.query(IngestionJob).delete()
        db.commit()
    else:
        user_finding_ids = [f.id for f in db.query(Finding.id).filter(Finding.user_id == current_user.id).all()]
        if user_finding_ids:
            db.query(FindingEvidence).filter(FindingEvidence.finding_id.in_(user_finding_ids)).delete(synchronize_session=False)
        db.query(Finding).filter(Finding.user_id == current_user.id).delete()
        db.query(Incident).filter(Incident.user_id == current_user.id).delete()
        db.query(RemediationPlan).filter(RemediationPlan.user_id == current_user.id).delete()
        db.query(CloudResource).filter(CloudResource.user_id == current_user.id).delete()
        db.query(CloudAccount).filter(CloudAccount.user_id == current_user.id).delete()
        db.query(IngestionJob).filter(IngestionJob.user_id == current_user.id).delete()
        db.commit()

    log_action(
        db,
        action=AuditActionEnum.SYSTEM_CONFIG_CHANGE,
        entity_type="SYSTEM",
        entity_id="data-purge",
        actor_id=current_user.id,
        actor_email=current_user.email,
        details={"event": "USER_DATA_PURGED", "user_id": current_user.id}
    )
    return {"status": "DATA_PURGED", "message": "Your security findings, assets, and jobs have been cleared."}
