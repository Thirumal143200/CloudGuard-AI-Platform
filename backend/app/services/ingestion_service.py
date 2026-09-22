"""CloudGuard AI â€” Ingestion Service: Multi-Cloud Telemetry & Asset Ingestion + Demo Seed Data Generator"""
import json
import uuid
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.cloud import CloudAccount, DataSource, IngestionJob, CloudProviderEnum, DataSourceTypeEnum, IngestionStatusEnum
from app.models.resource import CloudResource
from app.models.finding import Finding, SeverityEnum, FindingStatusEnum, RuleCategoryEnum, SecurityRule
from app.models.incident import Incident, IncidentTimeline, IncidentSeverityEnum, IncidentStatusEnum
from app.models.remediation import RemediationPlan, RemediationPlanStatus, ActionRiskTier
from app.models.telemetry import TelemetryLog, AnomalyEvent, LogSourceType
from app.models.compliance import ComplianceFramework, ComplianceControl, ComplianceAssessment
from app.services.rule_engine import evaluate_resource_rules, RULES_CATALOG
from app.services.ml_engine import global_anomaly_detector
from app.services.remediation_service import generate_remediation_package
from app.services.audit_service import log_action, AuditActionEnum


def seed_demo_cloud_environment(db: Session) -> Dict[str, Any]:
    """Seed comprehensive realistic multi-cloud test environment for jury demo."""
    # 1. Check if already seeded
    existing_acc = db.query(CloudAccount).first()
    if existing_acc:
        return {"status": "ALREADY_SEEDED", "account_id": existing_acc.id}

    # 2. Create Security Rules Catalog in DB
    for r in RULES_CATALOG:
        rule_db = SecurityRule(
            id=r.id,
            name=r.name,
            description=r.description,
            category=r.category,
            provider=r.provider,
            default_severity=r.severity,
            remediation_template=r.remediation_template,
            framework_mappings=r.framework_mappings,
            is_active=True
        )
        db.merge(rule_db)

    # 3. Create Cloud Accounts (AWS, Azure, GCP)
    aws_acc = CloudAccount(
        id="acc-aws-prod",
        name="AWS Enterprise Production",
        provider=CloudProviderEnum.AWS,
        account_id="123456789012",
        environment="production",
        is_active=True,
        is_simulated=True,
        last_sync_at=datetime.now(timezone.utc)
    )
    azure_acc = CloudAccount(
        id="acc-azure-corp",
        name="Azure Corp Core",
        provider=CloudProviderEnum.AZURE,
        account_id="sub-azure-987654",
        environment="production",
        is_active=True,
        is_simulated=True,
        last_sync_at=datetime.now(timezone.utc)
    )
    db.add(aws_acc)
    db.add(azure_acc)
    db.flush()

    # 4. Create Cloud Resources
    resources_data = [
        {
            "id": "res-s3-finance",
            "account_id": aws_acc.id,
            "native_id": "prod-finance-backup-2026",
            "name": "prod-finance-backup-2026",
            "resource_type": "AWS::S3::Bucket",
            "provider": "AWS",
            "region": "us-east-1",
            "configuration": {
                "name": "prod-finance-backup-2026",
                "is_public": True,
                "acl_public_read": True,
                "encrypted": False,
                "public_access_block": {"BlockPublicAcls": False, "BlockPublicPolicy": False}
            },
            "tags": {"Environment": "Production", "DataClassification": "Confidential"},
            "risk_score": 85.0
        },
        {
            "id": "res-sg-web",
            "account_id": aws_acc.id,
            "native_id": "sg-0a8b9c7d6e5f41234",
            "name": "web-public-ingress-sg",
            "resource_type": "AWS::EC2::SecurityGroup",
            "provider": "AWS",
            "region": "us-east-1",
            "configuration": {
                "group_name": "web-public-ingress-sg",
                "security_group_rules": [
                    {"port": 80, "cidr_ipv4": "0.0.0.0/0", "description": "HTTP"},
                    {"port": 443, "cidr_ipv4": "0.0.0.0/0", "description": "HTTPS"},
                    {"port": 22, "cidr_ipv4": "0.0.0.0/0", "description": "SSH Admin"}
                ]
            },
            "tags": {"Tier": "DMZ", "ManagedBy": "Terraform"},
            "risk_score": 92.0
        },
        {
            "id": "res-iam-admin",
            "account_id": aws_acc.id,
            "native_id": "arn:aws:iam::123456789012:user/devops-deployer",
            "name": "devops-deployer",
            "resource_type": "AWS::IAM::User",
            "provider": "AWS",
            "region": "global",
            "configuration": {
                "username": "devops-deployer",
                "policies": [
                    {
                        "policy_name": "AdministratorAccessDirect",
                        "statements": [{"Effect": "Allow", "Action": "*", "Resource": "*"}]
                    }
                ],
                "access_keys": [{"key_id": "DEMO_IAM_KEY_UNROTATED_01", "age_days": 182, "status": "Active"}]
            },
            "tags": {"Team": "Platform", "Role": "CI/CD"},
            "risk_score": 90.0
        },
        {
            "id": "res-rds-db",
            "account_id": aws_acc.id,
            "native_id": "rds-prod-customers-01",
            "name": "prod-customers-db",
            "resource_type": "AWS::RDS::DBInstance",
            "provider": "AWS",
            "region": "us-east-1",
            "configuration": {
                "db_name": "customers_production",
                "publicly_accessible": True,
                "storage_encrypted": False,
                "engine": "postgres",
                "endpoint": "prod-customers.c9dfk3j2.us-east-1.rds.amazonaws.com"
            },
            "tags": {"Environment": "Production", "Workload": "Core-PostgreSQL"},
            "risk_score": 88.0
        },
        {
            "id": "res-az-storage",
            "account_id": azure_acc.id,
            "native_id": "azstoragecorpblob01",
            "name": "azstoragecorpblob01",
            "resource_type": "Microsoft.Storage/storageAccounts",
            "provider": "Azure",
            "region": "eastus",
            "configuration": {
                "name": "azstoragecorpblob01",
                "allow_blob_public_access": True,
                "enable_https_traffic_only": True
            },
            "tags": {"CostCenter": "Finance-901"},
            "risk_score": 75.0
        }
    ]

    for r_data in resources_data:
        res = CloudResource(
            id=r_data["id"],
            cloud_account_id=r_data["account_id"],
            native_id=r_data["native_id"],
            name=r_data["name"],
            resource_type=r_data["resource_type"],
            provider=r_data["provider"],
            region=r_data["region"],
            configuration=r_data["configuration"],
            tags=r_data["tags"],
            risk_score=r_data["risk_score"],
            is_simulated=True
        )
        db.add(res)
        db.flush()

        # Run Rule Engine on the resource
        findings = evaluate_resource_rules(
            resource_id=res.id,
            resource_type=res.resource_type,
            provider=res.provider,
            configuration=res.configuration,
            account_id=res.cloud_account_id
        )

        for f_dict in findings:
            f_id = f"fnd-{uuid.uuid4().hex[:8]}"
            finding_obj = Finding(
                id=f_id,
                rule_id=f_dict["rule_id"],
                resource_id=res.id,
                cloud_account_id=res.cloud_account_id,
                title=f_dict["title"],
                description=f_dict["description"],
                severity=f_dict["severity"],
                status=FindingStatusEnum.OPEN,
                evidence_summary=f_dict["evidence_summary"],
                raw_evidence=f_dict["raw_evidence"],
                remediation_guidance=f_dict["remediation_guidance"],
                risk_score_contribution=f_dict["risk_contribution"],
                compliance_controls=list(f_dict.get("compliance_mappings", {}).keys()),
                is_simulated=True
            )
            db.add(finding_obj)
            db.flush()

            # Auto-generate Remediation Plan
            rem_pkg = generate_remediation_package(finding_obj, res)
            plan_obj = RemediationPlan(
                id=f"rem-{uuid.uuid4().hex[:8]}",
                title=rem_pkg["title"],
                description=rem_pkg["description"],
                finding_id=finding_obj.id,
                cloud_account_id=res.cloud_account_id,
                status=RemediationPlanStatus.PROPOSED,
                risk_tier=rem_pkg["risk_tier"],
                cli_commands=rem_pkg["cli_commands"],
                terraform_hcl=rem_pkg["terraform_hcl"],
                python_script=rem_pkg["python_script"],
                is_simulated=True
            )
            db.add(plan_obj)

    # 5. Create Correlated High-Impact Incident
    inc_id = "inc-2026-p1-001"
    inc = Incident(
        id=inc_id,
        title="Critical Data Exposure & Lateral Privilege Escalation Chain",
        description="Correlated detection: S3 Public Bucket contains unencrypted PII with active open SSH ingress and wildcard admin IAM policies.",
        cloud_account_id=aws_acc.id,
        severity=IncidentSeverityEnum.P1_CRITICAL,
        status=IncidentStatusEnum.INVESTIGATING,
        mitre_attack_tactics=["Initial Access", "Privilege Escalation", "Exfiltration"],
        mitre_attack_techniques=["T1078 (Valid Accounts)", "T1190 (Exploit Public-Facing App)", "T1530 (Data from Cloud Storage)"],
        blast_radius_summary="All corporate customer records (estimated 45,000 PII records) and entire AWS production VPC.",
        ai_root_cause_analysis="Attacker gained initial SSH access via world-open port 22, leveraged unrotated developer credentials with *:* admin permissions, and began staging exfiltration from public S3 bucket.",
        ai_containment_plan="1. Revoke 0.0.0.0/0 SSH Ingress immediately. 2. Quarantine devops-deployer IAM credentials. 3. Enable S3 Public Access Block.",
        detected_at=datetime.now(timezone.utc) - timedelta(hours=2),
        related_finding_ids=["fnd-01", "fnd-02"],
        related_resource_ids=["res-s3-finance", "res-sg-web", "res-iam-admin"],
        is_simulated=True
    )
    db.add(inc)
    db.flush()

    # Timeline event
    t1 = IncidentTimeline(
        id=f"tl-{uuid.uuid4().hex[:8]}",
        incident_id=inc.id,
        event_type="CORRELATION_ALERT",
        title="Anomaly Engine Correlated Multi-Asset Attack Vector",
        description="Isolation forest detected 4.2x baseline deviation on devops-deployer API velocity combined with public S3 access.",
        created_at=datetime.now(timezone.utc) - timedelta(hours=2)
    )
    db.add(t1)

    # 6. Seed Telemetry Logs & Anomalies
    now = datetime.now(timezone.utc)
    telemetry_samples = [
        {"event_name": "AuthorizeSecurityGroupIngress", "hour": 23, "ip_novelty": 0.95, "status_code": "200"},
        {"event_name": "GetObject", "hour": 2, "ip_novelty": 0.88, "status_code": "200"},
        {"event_name": "PutBucketPolicy", "hour": 3, "ip_novelty": 0.92, "status_code": "200"}
    ]
    for s in telemetry_samples:
        is_anom, score, contribs = global_anomaly_detector.score_event(s)
        tlog = TelemetryLog(
            id=f"log-{uuid.uuid4().hex[:8]}",
            cloud_account_id=aws_acc.id,
            source_type=LogSourceType.AWS_CLOUDTRAIL,
            event_timestamp=now - timedelta(minutes=45),
            event_name=s["event_name"],
            actor_identity="arn:aws:iam::123456789012:user/devops-deployer",
            source_ip="198.51.100.44",
            source_geo="Unknown / Tor Exit Node",
            raw_payload=s,
            is_anomalous=is_anom,
            anomaly_score=score,
            is_simulated=True
        )
        db.add(tlog)

        if is_anom:
            anom_event = AnomalyEvent(
                id=f"anom-{uuid.uuid4().hex[:8]}",
                cloud_account_id=aws_acc.id,
                detector_name="IsolationForest_V1",
                feature_vector=s,
                anomaly_score=score,
                baseline_deviation_percent=88.5,
                description=f"High-risk {s['event_name']} off-hours from high novelty IP.",
                top_contributing_features=contribs,
                incident_id=inc.id,
                is_simulated=True
            )
            db.add(anom_event)

    # 7. Seed Compliance Frameworks
    cis_fw = ComplianceFramework(
        id="CIS_AWS_V3",
        name="CIS Amazon Web Services Foundations Benchmark",
        version="v3.0.0",
        description="Consensus-based best practice for AWS cloud security.",
        total_controls=48
    )
    pci_fw = ComplianceFramework(
        id="PCI_DSS_V4",
        name="Payment Card Industry Data Security Standard (PCI DSS)",
        version="v4.0",
        description="Global standard for protecting cardholder and financial data.",
        total_controls=64
    )
    db.merge(cis_fw)
    db.merge(pci_fw)

    # Initial Audit Trail
    log_action(
        db=db,
        action=AuditActionEnum.INGESTION_COMPLETED,
        entity_type="SYSTEM",
        entity_id="SEED_DATA",
        details={"resources_seeded": len(resources_data), "provider_count": 2},
        actor_email="system@cloudguard.local"
    )

    db.commit()
    return {"status": "SUCCESS", "message": "Demo cloud environment successfully initialized."}
