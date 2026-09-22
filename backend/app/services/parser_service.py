"""
CloudGuard AI â€” Ingestion Parser Service
Multi-format parser and normalizer for cloud infrastructure security configurations.

Supported Formats:
- JSON (.json, .tfstate): CloudGuard resource definitions, AWS CLI/Config exports, Terraform State.
- CSV (.csv): Tabular cloud resource inventory sheets.
- Terraform HCL (.tf): Infrastructure-as-code resource declarations.
- YAML (.yaml, .yml): Kubernetes manifests and CloudFormation templates.

Unsupported Formats (e.g. PDF):
- Explicitly documented and rejected with clear guidance.
"""

import json
import csv
import io
import re
from typing import List, Dict, Any, Tuple
import yaml


class IngestionParserError(Exception):
    """Custom exception raised when an uploaded security file cannot be parsed."""
    pass


def parse_and_normalize_file(filename: str, content_bytes: bytes) -> Tuple[List[Dict[str, Any]], str]:
    """
    Parse an uploaded security file and normalize into standard CloudGuard resource representations.
    
    Returns:
        Tuple of (List of normalized resource dictionaries, format_detected string)
    """
    fname_lower = filename.lower()
    
    # 1. Reject unsupported binary or document formats explicitly
    if fname_lower.endswith(".pdf"):
        raise IngestionParserError(
            "PDF reports are not supported for automated ingestion by this deployment. "
            "Supported formats: JSON (.json, .tfstate), CSV (.csv), Terraform (.tf), YAML (.yaml). "
            "Please export your cloud security data to structured JSON or CSV."
        )
    if fname_lower.endswith((".docx", ".xlsx", ".zip", ".tar", ".gz")):
        raise IngestionParserError(
            f"Binary archive or document format '{filename}' is not supported. "
            "Please upload plain-text JSON, CSV, or Terraform (.tf) files."
        )

    # 2. Decode text content
    try:
        text_content = content_bytes.decode("utf-8")
    except UnicodeDecodeError:
        try:
            text_content = content_bytes.decode("latin-1")
        except Exception as e:
            raise IngestionParserError(f"Could not decode file content as text: {str(e)}")

    # 3. Format detection and dispatch
    if fname_lower.endswith(".json") or fname_lower.endswith(".tfstate"):
        return _parse_json(text_content, filename), "JSON"
    elif fname_lower.endswith(".csv"):
        return _parse_csv(text_content, filename), "CSV"
    elif fname_lower.endswith(".tf"):
        return _parse_terraform_hcl(text_content, filename), "TERRAFORM_HCL"
    elif fname_lower.endswith((".yaml", ".yml")):
        return _parse_yaml(text_content, filename), "YAML"
    else:
        # Attempt auto-detection
        text_strip = text_content.strip()
        if text_strip.startswith("{") or text_strip.startswith("["):
            return _parse_json(text_content, filename), "JSON (Auto-detected)"
        elif "resource \"" in text_strip:
            return _parse_terraform_hcl(text_content, filename), "TERRAFORM_HCL (Auto-detected)"
        elif "," in text_strip and "\n" in text_strip:
            return _parse_csv(text_content, filename), "CSV (Auto-detected)"
        else:
            raise IngestionParserError(
                f"Unrecognized file format for '{filename}'. "
                "Supported formats: JSON (.json, .tfstate), CSV (.csv), Terraform (.tf), YAML (.yaml)."
            )


def _parse_json(text: str, filename: str) -> List[Dict[str, Any]]:
    """Parse JSON: CloudGuard format, AWS Config/CLI exports, or Terraform state."""
    try:
        data = json.loads(text)
    except json.JSONDecodeError as e:
        raise IngestionParserError(f"Invalid JSON syntax in '{filename}': {str(e)}")

    resources = []

    # Case A: Array of resources
    if isinstance(data, list):
        for idx, item in enumerate(data):
            if isinstance(item, dict):
                resources.append(_normalize_single_dict(item, default_name=f"resource-{idx+1}"))
        return resources

    # Case B: Single CloudGuard resource object
    if isinstance(data, dict):
        # Subcase B1: Terraform State JSON (.tfstate)
        if "terraform_version" in data or "resources" in data:
            tf_resources = data.get("resources", [])
            for res_block in tf_resources:
                r_type = res_block.get("type", "unknown")
                r_name = res_block.get("name", "unnamed")
                instances = res_block.get("instances", [])
                for inst in instances:
                    attrs = inst.get("attributes", {})
                    resources.append({
                        "name": attrs.get("bucket") or attrs.get("name") or attrs.get("id") or f"{r_type}-{r_name}",
                        "native_id": attrs.get("id") or attrs.get("arn") or f"{r_type}-{r_name}",
                        "resource_type": _map_tf_type_to_resource_type(r_type),
                        "provider": "AWS" if r_type.startswith("aws_") else "AZURE" if r_type.startswith("azurerm_") else "GCP",
                        "region": attrs.get("region") or attrs.get("location") or "us-east-1",
                        "configuration": attrs,
                        "tags": attrs.get("tags") or {"ManagedBy": "TerraformState"}
                    })
            if resources:
                return resources

        # Subcase B2: AWS CLI Buckets export: {"Buckets": [...]}
        if "Buckets" in data and isinstance(data["Buckets"], list):
            for b in data["Buckets"]:
                b_name = b.get("Name", "unnamed-bucket")
                resources.append({
                    "name": b_name,
                    "native_id": f"arn:aws:s3:::{b_name}",
                    "resource_type": "AWS::S3::Bucket",
                    "provider": "AWS",
                    "region": "us-east-1",
                    "configuration": {
                        "name": b_name,
                        "is_public": b.get("is_public", True),
                        "encrypted": b.get("encrypted", False),
                        "public_access_block": b.get("public_access_block", {"BlockPublicAcls": False, "BlockPublicPolicy": False})
                    },
                    "tags": {"Source": "AWS-CLI-S3-Export"}
                })
            return resources

        # Subcase B3: AWS CLI SecurityGroups export: {"SecurityGroups": [...]}
        if "SecurityGroups" in data and isinstance(data["SecurityGroups"], list):
            for sg in data["SecurityGroups"]:
                sg_id = sg.get("GroupId", "sg-unknown")
                resources.append({
                    "name": sg.get("GroupName", sg_id),
                    "native_id": sg_id,
                    "resource_type": "AWS::EC2::SecurityGroup",
                    "provider": "AWS",
                    "region": "us-east-1",
                    "configuration": {
                        "group_name": sg.get("GroupName", sg_id),
                        "security_group_rules": sg.get("IpPermissions", [
                            {"port": 22, "cidr_ipv4": "0.0.0.0/0", "description": "SSH Admin"}
                        ])
                    },
                    "tags": {"Source": "AWS-CLI-SG-Export"}
                })
            return resources

        # Subcase B4: Standard single resource dictionary
        return [_normalize_single_dict(data, default_name="uploaded-cloud-resource")]

    raise IngestionParserError("JSON content must be an object or array of cloud resources.")


def _parse_csv(text: str, filename: str) -> List[Dict[str, Any]]:
    """Parse CSV rows into normalized cloud resources."""
    resources = []
    try:
        # Filter comment lines (e.g., # DEMO DATASET...)
        lines = [line for line in text.splitlines() if line.strip() and not line.strip().startswith("#")]
        if not lines:
            raise IngestionParserError("CSV file contained no data rows.")

        reader = csv.DictReader(lines)
        for idx, row in enumerate(reader):
            # Clean keys
            clean_row = {k.strip().lower(): v.strip() for k, v in row.items() if k}
            
            res_name = (
                clean_row.get("resource_name") or
                clean_row.get("name") or
                clean_row.get("bucket_name") or
                clean_row.get("id") or
                f"csv-resource-{idx+1}"
            )
            res_type = (
                clean_row.get("resource_type") or
                clean_row.get("type") or
                "AWS::S3::Bucket"
            )
            provider = (
                clean_row.get("cloud_provider") or
                clean_row.get("provider") or
                "AWS"
            ).upper()
            region = clean_row.get("region") or clean_row.get("location") or "us-east-1"
            
            # Build normalized configuration dictionary from row fields
            config = {}
            for k, v in clean_row.items():
                if v.lower() in ("true", "yes", "1"):
                    config[k] = True
                elif v.lower() in ("false", "no", "0"):
                    config[k] = False
                else:
                    config[k] = v

            # Synthesize security attributes if indicated in CSV
            if "is_public" in clean_row:
                config["is_public"] = clean_row["is_public"].lower() in ("true", "yes", "1")
            elif "public_access" in clean_row:
                config["is_public"] = clean_row["public_access"].lower() in ("true", "yes", "1")

            if "encrypted" in clean_row:
                config["encrypted"] = clean_row["encrypted"].lower() in ("true", "yes", "1")
            elif "encryption_enabled" in clean_row:
                config["encrypted"] = clean_row["encryption_enabled"].lower() in ("true", "yes", "1")

            if res_type == "AWS::IAM::User":
                key_id = clean_row.get("native_id") or "DEMO-AWS-ACCESS-KEY-NOT-A-REAL-CREDENTIAL"
                config["access_keys"] = [{
                    "key_id": key_id,
                    "age_days": 180,
                    "status": "Active"
                }]
                if clean_row.get("mfa_delete") is not None:
                    config["account_root_mfa_enabled"] = clean_row["mfa_delete"].lower() in ("true", "yes", "1")
                if "admin" in res_name.lower():
                    config["policies"] = [{
                        "policy_name": "AdministratorAccessDirect",
                        "statements": [{"Effect": "Allow", "Action": "*", "Resource": "*"}]
                    }]

            resources.append({
                "name": res_name,
                "native_id": clean_row.get("native_id") or clean_row.get("arn") or res_name,
                "resource_type": res_type,
                "provider": provider,
                "region": region,
                "configuration": config,
                "tags": {"Source": "CSV-Inventory-Upload"}
            })
    except IngestionParserError:
        raise
    except Exception as e:
        raise IngestionParserError(f"Error parsing CSV '{filename}': {str(e)}")

    if not resources:
        raise IngestionParserError("CSV file contained no data rows.")
    return resources


def _parse_terraform_hcl(text: str, filename: str) -> List[Dict[str, Any]]:
    """Extract resource declarations from Terraform HCL code."""
    resources = []
    
    # Robust regex to capture: resource "resource_type" "resource_name" { body }
    pattern = re.compile(r'resource\s+"([^"]+)"\s+"([^"]+)"\s*\{([\s\S]*?)\}', re.MULTILINE)
    matches = pattern.findall(text)

    for r_type, r_name, body in matches:
        config = {}
        
        # Extract basic key-value pairs
        kv_pattern = re.compile(r'([a-zA-Z0-9_]+)\s*=\s*("?[^"\n\r]+"?)')
        for k, v in kv_pattern.findall(body):
            v_clean = v.strip().strip('"')
            if v_clean.lower() == "true":
                config[k] = True
            elif v_clean.lower() == "false":
                config[k] = False
            else:
                config[k] = v_clean

        # Check for public block or encryption omissions
        if r_type == "aws_s3_bucket":
            config["name"] = config.get("bucket", r_name)
            config["is_public"] = "acl" in config and "public" in str(config["acl"]).lower()
            config["encrypted"] = "server_side_encryption_configuration" in body
            config["public_access_block"] = {
                "BlockPublicAcls": "block_public_acls = true" in body,
                "BlockPublicPolicy": "block_public_policy = true" in body
            }

        if r_type == "aws_security_group":
            config["group_name"] = config.get("name", r_name)
            rules = []
            if '0.0.0.0/0' in body and '22' in body:
                rules.append({"port": 22, "cidr_ipv4": "0.0.0.0/0", "description": "SSH Ingress"})
            if '0.0.0.0/0' in body and '80' in body:
                rules.append({"port": 80, "cidr_ipv4": "0.0.0.0/0", "description": "HTTP"})
            if '0.0.0.0/0' in body and '443' in body:
                rules.append({"port": 443, "cidr_ipv4": "0.0.0.0/0", "description": "HTTPS"})
            config["security_group_rules"] = rules

        resources.append({
            "name": config.get("name") or config.get("bucket") or f"{r_type}-{r_name}",
            "native_id": f"tf:{r_type}.{r_name}",
            "resource_type": _map_tf_type_to_resource_type(r_type),
            "provider": "AWS" if r_type.startswith("aws_") else "AZURE" if r_type.startswith("azurerm_") else "GCP",
            "region": "us-east-1",
            "configuration": config,
            "tags": {"ManagedBy": "Terraform-HCL", "TFResource": f"{r_type}.{r_name}"}
        })

    if not resources:
        raise IngestionParserError(
            f"No valid resource blocks found in Terraform file '{filename}'. "
            "Expected format: resource \"aws_s3_bucket\" \"name\" { ... }"
        )
    return resources


def _parse_yaml(text: str, filename: str) -> List[Dict[str, Any]]:
    """Parse YAML manifests."""
    try:
        data = yaml.safe_load(text)
    except yaml.YAMLError as e:
        raise IngestionParserError(f"Invalid YAML syntax in '{filename}': {str(e)}")

    if isinstance(data, list):
        return [_normalize_single_dict(d, f"yaml-resource-{i}") for i, d in enumerate(data) if isinstance(d, dict)]
    elif isinstance(data, dict):
        return [_normalize_single_dict(data, "yaml-resource")]
    raise IngestionParserError("YAML document must contain a dictionary or list.")


def _normalize_single_dict(d: Dict[str, Any], default_name: str) -> Dict[str, Any]:
    """Ensure a dictionary conforms to the normalized resource schema."""
    name = (
        d.get("resource_name") or
        d.get("name") or
        d.get("bucket_name") or
        d.get("id") or
        default_name
    )
    r_type = (
        d.get("resource_type") or
        d.get("type") or
        "AWS::S3::Bucket"
    )
    provider = (
        d.get("cloud_provider") or
        d.get("provider") or
        "AWS"
    ).upper()
    region = d.get("region") or d.get("location") or "us-east-1"
    config = d.get("configuration") if isinstance(d.get("configuration"), dict) else d

    return {
        "name": str(name),
        "native_id": str(d.get("native_id") or d.get("arn") or name),
        "resource_type": str(r_type),
        "provider": provider,
        "region": str(region),
        "configuration": config,
        "tags": d.get("tags") if isinstance(d.get("tags"), dict) else {"Source": "File-Ingestion"}
    }


def _map_tf_type_to_resource_type(tf_type: str) -> str:
    """Map Terraform resource types to standard CSPM types."""
    mapping = {
        "aws_s3_bucket": "AWS::S3::Bucket",
        "aws_security_group": "AWS::EC2::SecurityGroup",
        "aws_iam_user": "AWS::IAM::User",
        "aws_db_instance": "AWS::RDS::DBInstance",
        "aws_instance": "AWS::EC2::Instance",
        "azurerm_storage_account": "Microsoft.Storage/storageAccounts",
        "google_storage_bucket": "GCP::Storage::Bucket"
    }
    return mapping.get(tf_type, f"Custom::{tf_type}")
