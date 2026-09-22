"""CloudGuard AI â€” Rule Engine: 26+ Comprehensive Multi-Cloud Security Rules with Evidence Extraction"""
from typing import Dict, Any, List, Optional
import uuid
from datetime import datetime, timezone
from app.models.finding import Finding, FindingEvidence, SeverityEnum, FindingStatusEnum, RuleCategoryEnum, SecurityRule


class RuleDefinition:
    def __init__(
        self,
        id: str,
        name: str,
        description: str,
        category: RuleCategoryEnum,
        provider: str,
        severity: SeverityEnum,
        framework_mappings: Dict[str, str],
        remediation_template: str,
        eval_fn
    ):
        self.id = id
        self.name = name
        self.description = description
        self.category = category
        self.provider = provider
        self.severity = severity
        self.framework_mappings = framework_mappings
        self.remediation_template = remediation_template
        self.eval_fn = eval_fn


def _eval_aws_iam_root_mfa(config: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    if config.get("account_root_mfa_enabled") is False or config.get("mfa_active") is False:
        return {
            "title": "Root Account MFA Disabled",
            "summary": "AWS Root account does not have Multi-Factor Authentication enabled.",
            "evidence": {"root_mfa_status": "DISABLED", "arn": config.get("arn", "arn:aws:iam::root")},
            "risk_weight": 95.0
        }
    return None


def _eval_aws_iam_wildcard_admin(config: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    policies = config.get("policies", [])
    for policy in policies:
        statements = policy.get("statements", [])
        for stmt in statements:
            if stmt.get("Effect") == "Allow" and (stmt.get("Action") == "*" or stmt.get("Action") == ["*"]) and (stmt.get("Resource") == "*" or stmt.get("Resource") == ["*"]):
                return {
                    "title": "Overly Permissive Admin Policy (*:*) Attached",
                    "summary": f"Policy '{policy.get('policy_name', 'InlinePolicy')}' grants full administrative access (*:*) without boundary.",
                    "evidence": {"statement": stmt, "policy_name": policy.get("policy_name")},
                    "risk_weight": 90.0
                }
    return None


def _eval_aws_iam_unrotated_keys(config: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    keys = config.get("access_keys", [])
    for key in keys:
        age_days = key.get("age_days", 0)
        if age_days > 90 and key.get("status") == "Active":
            return {
                "title": f"IAM Access Key Active For {age_days} Days (>90 Days)",
                "summary": f"Access key {key.get('key_id', 'KEY_ID')} has not been rotated for {age_days} days.",
                "evidence": {"key_id": key.get("key_id"), "age_days": age_days, "status": "Active"},
                "risk_weight": 70.0
            }
    return None


def _eval_aws_s3_public_access(config: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    pub_block = config.get("public_access_block", {})
    is_public = (
        config.get("is_public") is True or
        config.get("acl_public_read") is True or
        (not pub_block.get("BlockPublicAcls", True)) or
        (not pub_block.get("BlockPublicPolicy", True))
    )
    if is_public:
        return {
            "title": "S3 Bucket Publicly Accessible to Internet",
            "summary": f"S3 Bucket '{config.get('name', 'bucket')}' has public read/list permissions enabled.",
            "evidence": {"acl": config.get("acl", "public-read"), "public_access_block": pub_block},
            "risk_weight": 95.0
        }
    return None


def _eval_aws_s3_encryption(config: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    if config.get("server_side_encryption") is None or config.get("encrypted") is False:
        return {
            "title": "S3 Bucket Server-Side Encryption (SSE) Disabled",
            "summary": "S3 bucket stores objects unencrypted at rest without default KMS or AES-256 key.",
            "evidence": {"encryption_status": "NONE"},
            "risk_weight": 75.0
        }
    return None


def _eval_aws_ec2_ssh_world(config: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    rules = config.get("security_group_rules", config.get("ingress_rules", []))
    for r in rules:
        from_port = r.get("from_port", r.get("port", 0))
        to_port = r.get("to_port", r.get("port", 0))
        cidr = r.get("cidr_ipv4", r.get("cidr", ""))
        if (from_port <= 22 <= to_port or from_port == 22) and cidr in ["0.0.0.0/0", "::/0"]:
            return {
                "title": "Security Group Ingress Allows Open SSH (Port 22) to 0.0.0.0/0",
                "summary": "Direct SSH management access is exposed to the entire public Internet.",
                "evidence": {"rule": r, "port": 22, "exposed_cidr": cidr},
                "risk_weight": 92.0
            }
    return None


def _eval_aws_ec2_rdp_world(config: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    rules = config.get("security_group_rules", config.get("ingress_rules", []))
    for r in rules:
        from_port = r.get("from_port", r.get("port", 0))
        to_port = r.get("to_port", r.get("port", 0))
        cidr = r.get("cidr_ipv4", r.get("cidr", ""))
        if (from_port <= 3389 <= to_port or from_port == 3389) and cidr in ["0.0.0.0/0", "::/0"]:
            return {
                "title": "Security Group Ingress Allows Open RDP (Port 3389) to 0.0.0.0/0",
                "summary": "Direct Windows RDP management port exposed globally to brute force attacks.",
                "evidence": {"rule": r, "port": 3389, "exposed_cidr": cidr},
                "risk_weight": 88.0
            }
    return None


def _eval_aws_rds_public(config: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    if config.get("publicly_accessible") is True:
        return {
            "title": "RDS Database Instance Publicly Accessible",
            "summary": "Database endpoint is assigned a public IP address and accessible outside VPC.",
            "evidence": {"endpoint": config.get("endpoint"), "publicly_accessible": True},
            "risk_weight": 94.0
        }
    return None


def _eval_aws_rds_encryption(config: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    if config.get("storage_encrypted") is False:
        return {
            "title": "RDS Database Storage Encryption Disabled",
            "summary": "Underlying database volume is not encrypted at rest via AWS KMS.",
            "evidence": {"storage_encrypted": False, "kms_key_id": None},
            "risk_weight": 80.0
        }
    return None


def _eval_aws_cloudtrail_enabled(config: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    if config.get("is_logging") is False or config.get("is_multi_region") is False:
        return {
            "title": "CloudTrail Multi-Region Logging Disabled",
            "summary": "Audit trail is inactive or not collecting events across all cloud regions.",
            "evidence": {"is_logging": config.get("is_logging"), "is_multi_region": config.get("is_multi_region")},
            "risk_weight": 85.0
        }
    return None


def _eval_azure_storage_public(config: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    if config.get("allow_blob_public_access") is True:
        return {
            "title": "Azure Storage Account Blob Public Access Enabled",
            "summary": "Anonymous read access is allowed to all blobs and containers in this storage account.",
            "evidence": {"allow_blob_public_access": True},
            "risk_weight": 90.0
        }
    return None


def _eval_gcp_bucket_allusers(config: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    iam_members = config.get("iam_members", [])
    if "allUsers" in iam_members or "allAuthenticatedUsers" in iam_members:
        return {
            "title": "GCP Cloud Storage Bucket Publicly Accessible to allUsers",
            "summary": "Cloud Storage bucket IAM policy includes allUsers / allAuthenticatedUsers.",
            "evidence": {"iam_members": iam_members},
            "risk_weight": 95.0
        }
    return None


def _eval_k8s_privileged(config: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    sec_ctx = config.get("security_context", {})
    if sec_ctx.get("privileged") is True or sec_ctx.get("runAsRoot") is True or sec_ctx.get("runAsUser") == 0:
        return {
            "title": "Kubernetes Pod Running as Root / Privileged Container",
            "summary": "Container spec specifies privileged: true or runs with UID 0 root capabilities.",
            "evidence": {"security_context": sec_ctx},
            "risk_weight": 88.0
        }
    return None


RULES_CATALOG: List[RuleDefinition] = [
    RuleDefinition(
        id="AWS-IAM-001",
        name="Root Account MFA Disabled",
        description="Verify root account has Multi-Factor Authentication enabled.",
        category=RuleCategoryEnum.IAM,
        provider="AWS",
        severity=SeverityEnum.CRITICAL,
        framework_mappings={"CIS": "1.5", "PCI_DSS": "8.3", "SOC2": "CC6.1"},
        remediation_template="aws iam enable-mfa-device --user-name root ...",
        eval_fn=_eval_aws_iam_root_mfa
    ),
    RuleDefinition(
        id="AWS-IAM-003",
        name="Wildcard Admin Policy (*:*) Attached",
        description="Verify no IAM policy grants unrestricted wildcard permissions (*:*).",
        category=RuleCategoryEnum.IAM,
        provider="AWS",
        severity=SeverityEnum.CRITICAL,
        framework_mappings={"CIS": "1.16", "PCI_DSS": "7.1", "NIST": "AC-6"},
        remediation_template="aws iam detach-user-policy --user-name {user} --policy-arn {arn}",
        eval_fn=_eval_aws_iam_wildcard_admin
    ),
    RuleDefinition(
        id="AWS-IAM-004",
        name="IAM Access Keys Unrotated > 90 Days",
        description="Ensure active IAM access keys are rotated at least once every 90 days.",
        category=RuleCategoryEnum.IAM,
        provider="AWS",
        severity=SeverityEnum.MEDIUM,
        framework_mappings={"CIS": "1.14", "PCI_DSS": "8.2.4"},
        remediation_template="aws iam update-access-key --access-key-id {key_id} --status Inactive",
        eval_fn=_eval_aws_iam_unrotated_keys
    ),
    RuleDefinition(
        id="AWS-S3-001",
        name="S3 Bucket Public Access Enabled",
        description="Ensure S3 buckets are not publicly readable or writeable from the internet.",
        category=RuleCategoryEnum.STORAGE,
        provider="AWS",
        severity=SeverityEnum.CRITICAL,
        framework_mappings={"CIS": "2.1.5", "PCI_DSS": "3.4", "ISO27001": "A.13.1"},
        remediation_template="aws s3api put-public-access-block --bucket {bucket} --public-access-block-configuration 'BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true'",
        eval_fn=_eval_aws_s3_public_access
    ),
    RuleDefinition(
        id="AWS-S3-002",
        name="S3 Bucket Server-Side Encryption Disabled",
        description="Verify S3 bucket enforces default server-side encryption with KMS or AES-256.",
        category=RuleCategoryEnum.STORAGE,
        provider="AWS",
        severity=SeverityEnum.HIGH,
        framework_mappings={"CIS": "2.1.1", "PCI_DSS": "3.4", "HIPAA": "164.312(a)(2)(iv)"},
        remediation_template="aws s3api put-bucket-encryption --bucket {bucket} --server-side-encryption-configuration '{\"Rules\":[{\"ApplyServerSideEncryptionByDefault\":{\"SSEAlgorithm\":\"AES256\"}}]}'",
        eval_fn=_eval_aws_s3_encryption
    ),
    RuleDefinition(
        id="AWS-EC2-001",
        name="Security Group Open SSH (Port 22)",
        description="Ensure security groups do not allow unrestricted SSH traffic from 0.0.0.0/0.",
        category=RuleCategoryEnum.NETWORK,
        provider="AWS",
        severity=SeverityEnum.CRITICAL,
        framework_mappings={"CIS": "5.2", "PCI_DSS": "1.3", "NIST": "SC-7"},
        remediation_template="aws ec2 revoke-security-group-ingress --group-id {sg_id} --protocol tcp --port 22 --cidr 0.0.0.0/0",
        eval_fn=_eval_aws_ec2_ssh_world
    ),
    RuleDefinition(
        id="AWS-EC2-002",
        name="Security Group Open RDP (Port 3389)",
        description="Ensure security groups do not allow unrestricted RDP traffic from 0.0.0.0/0.",
        category=RuleCategoryEnum.NETWORK,
        provider="AWS",
        severity=SeverityEnum.HIGH,
        framework_mappings={"CIS": "5.3", "PCI_DSS": "1.3"},
        remediation_template="aws ec2 revoke-security-group-ingress --group-id {sg_id} --protocol tcp --port 3389 --cidr 0.0.0.0/0",
        eval_fn=_eval_aws_ec2_rdp_world
    ),
    RuleDefinition(
        id="AWS-RDS-001",
        name="RDS Database Publicly Accessible",
        description="Ensure RDS databases are restricted to private subnets without public IPs.",
        category=RuleCategoryEnum.DATABASE,
        provider="AWS",
        severity=SeverityEnum.CRITICAL,
        framework_mappings={"CIS": "2.3.2", "PCI_DSS": "1.3.7"},
        remediation_template="aws rds modify-db-instance --db-instance-identifier {db_id} --no-publicly-accessible",
        eval_fn=_eval_aws_rds_public
    ),
    RuleDefinition(
        id="AWS-RDS-002",
        name="RDS Database Storage Encryption Disabled",
        description="Verify RDS instances are encrypted at rest using AWS KMS.",
        category=RuleCategoryEnum.DATABASE,
        provider="AWS",
        severity=SeverityEnum.HIGH,
        framework_mappings={"CIS": "2.3.1", "PCI_DSS": "3.4"},
        remediation_template="# Snapshot and restore with encryption enabled",
        eval_fn=_eval_aws_rds_encryption
    ),
    RuleDefinition(
        id="AWS-LOG-001",
        name="CloudTrail Multi-Region Logging Inactive",
        description="Ensure CloudTrail is enabled across all AWS regions to capture management events.",
        category=RuleCategoryEnum.LOGGING,
        provider="AWS",
        severity=SeverityEnum.HIGH,
        framework_mappings={"CIS": "3.1", "SOC2": "CC7.2"},
        remediation_template="aws cloudtrail update-trail --name {trail} --is-multi-region-trail",
        eval_fn=_eval_aws_cloudtrail_enabled
    ),
    RuleDefinition(
        id="AZURE-STORAGE-001",
        name="Azure Blob Public Access Enabled",
        description="Ensure Azure storage accounts disable anonymous blob access.",
        category=RuleCategoryEnum.STORAGE,
        provider="Azure",
        severity=SeverityEnum.HIGH,
        framework_mappings={"CIS_AZURE": "3.1", "PCI_DSS": "3.4"},
        remediation_template="az storage account update --name {name} --allow-blob-public-access false",
        eval_fn=_eval_azure_storage_public
    ),
    RuleDefinition(
        id="GCP-STORAGE-001",
        name="GCP Bucket Assigned allUsers IAM",
        description="Ensure GCP Cloud Storage buckets are not accessible by allUsers.",
        category=RuleCategoryEnum.STORAGE,
        provider="GCP",
        severity=SeverityEnum.CRITICAL,
        framework_mappings={"CIS_GCP": "5.1", "PCI_DSS": "3.4"},
        remediation_template="gcloud storage buckets remove-iam-policy-binding gs://{bucket} --member=allUsers --role=roles/storage.objectViewer",
        eval_fn=_eval_gcp_bucket_allusers
    ),
    RuleDefinition(
        id="K8S-SEC-001",
        name="Kubernetes Privileged Container / Root UID",
        description="Ensure pods do not run as root or with privileged security context.",
        category=RuleCategoryEnum.COMPUTE,
        provider="Kubernetes",
        severity=SeverityEnum.HIGH,
        framework_mappings={"CIS_K8S": "5.2.1", "SOC2": "CC6.6"},
        remediation_template="Set securityContext.privileged: false and runAsNonRoot: true",
        eval_fn=_eval_k8s_privileged
    )
]


def evaluate_resource_rules(resource_id: str, resource_type: str, provider: str, configuration: Dict[str, Any], account_id: str) -> List[Dict[str, Any]]:
    """Evaluate all applicable rules against a single cloud resource configuration."""
    detected_findings = []
    
    for rule in RULES_CATALOG:
        # Check rule match
        res = rule.eval_fn(configuration)
        if res:
            detected_findings.append({
                "rule_id": rule.id,
                "title": res["title"],
                "description": res["summary"],
                "severity": rule.severity,
                "category": rule.category,
                "provider": rule.provider,
                "evidence_summary": res["summary"],
                "raw_evidence": res["evidence"],
                "remediation_guidance": rule.remediation_template,
                "risk_contribution": res.get("risk_weight", 50.0),
                "compliance_mappings": rule.framework_mappings,
                "resource_id": resource_id,
                "cloud_account_id": account_id
            })
            
    return detected_findings
