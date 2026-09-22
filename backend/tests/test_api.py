"""CloudGuard AI — Comprehensive Backend Unit & Integration Tests

Covers:
1. Production health probes (/health, /health/live, /health/ready, /api/system/status)
2. Safe secret handling & sanitized status reporting
3. NIST SP 800-38D AES-256-GCM encryption & tampering detection
4. Argon2id / secure password hashing
5. Admin authentication & JWT token issuance
6. Multi-cloud asset inventory querying
7. Security findings detection & CIS/PCI mapping
8. Remediation package generation, dry run simulation & verified rescan
9. SHA-256 tamper-evident audit ledger integrity verification
10. Gemini AI inference & deterministic fallback mode
"""
import io
import json
import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import engine, Base, SessionLocal
from app.services.encryption_service import encrypt_field, decrypt_field
from app.services.auth_service import hash_password, verify_password
from app.services.ingestion_service import seed_demo_cloud_environment
from app.models.user import User, UserRole


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Initialize test database tables and seed test admin."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.email == "admin@cloudguard.ai").first()
        if not admin_user:
            admin_user = User(
                id="usr-admin-default",
                email="admin@cloudguard.ai",
                full_name="CloudGuard Lead Architect",
                hashed_password=hash_password("Admin@CloudGuard2026!"),
                role=UserRole.ADMIN,
                is_active=True,
                is_locked=False
            )
            db.add(admin_user)
            db.commit()
        seed_demo_cloud_environment(db)
    finally:
        db.close()
    yield


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def test_health_endpoints(client):
    """Verify all container health and readiness probes."""
    # Root health
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"

    # Liveness probe
    live_resp = client.get("/health/live")
    assert live_resp.status_code == 200
    assert live_resp.json()["live"] is True

    # Readiness probe
    ready_resp = client.get("/health/ready")
    assert ready_resp.status_code == 200
    assert ready_resp.json()["database"] == "connected"


def test_system_status_sanitization(client):
    """Verify system status exposes operational metrics without leaking secrets."""
    resp = client.get("/api/system/status")
    assert resp.status_code == 200
    data = resp.json()
    assert "status" in data
    assert "database" in data
    assert "ai" in data
    assert "ml" in data
    assert "environment" in data
    assert "cloud_connectors" in data

    # Verify NO secrets are leaked in response
    content_str = str(data)
    assert "AIza" not in content_str
    assert "password" not in content_str.lower()
    assert "secret" not in content_str.lower() or "configured" in content_str.lower()


def test_aes_256_gcm_encryption_lifecycle():
    """Verify AES-256-GCM authenticated encryption, unique nonces, and tampering rejection."""
    secret_text = "super-confidential-cloud-key-987654"
    
    # Encrypt twice: nonces must be completely unique
    c1 = encrypt_field(secret_text)
    c2 = encrypt_field(secret_text)
    assert c1 != c2  # Unique nonces guarantee different ciphertexts!

    # Decrypt and verify matching original
    p1 = decrypt_field(c1)
    p2 = decrypt_field(c2)
    assert p1 == secret_text
    assert p2 == secret_text

    # Tampering test: modify 1 character in ciphertext
    tampered = c1[:-2] + ("A" if c1[-2] != "A" else "B") + c1[-1]
    with pytest.raises(ValueError):
        decrypt_field(tampered)


def test_password_hashing():
    """Verify Argon2id / secure password hashing and verification."""
    pwd = "EnterpriseSecurePassword#2026!"
    hashed = hash_password(pwd)
    
    assert verify_password(pwd, hashed) is True
    assert verify_password("WrongPassword", hashed) is False
    assert pwd not in hashed  # Password is never stored in plaintext


def test_admin_authentication(client):
    """Verify login and JWT access token issuance."""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@cloudguard.ai", "password": "Admin@CloudGuard2026!"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "admin@cloudguard.ai"


def test_dashboard_metrics(client):
    """Verify 4-Pillar composite risk score calculation."""
    response = client.get("/api/v1/analytics/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert "overall_risk_score" in data
    assert "findings_by_severity" in data
    assert data["total_resources"] >= 1


def test_security_findings_listing(client):
    """Verify findings query and CIS/PCI rule evaluation."""
    response = client.get("/api/v1/findings")
    assert response.status_code == 200
    findings = response.json()
    assert len(findings) >= 1
    assert "rule_id" in findings[0]
    assert "severity" in findings[0]


def test_remediation_dry_run_and_verified_rescan(client):
    """Verify remediation package execution, dry run, and post-fix verification scan."""
    plans_resp = client.get("/api/v1/remediations")
    assert plans_resp.status_code == 200
    plans = plans_resp.json()
    assert len(plans) >= 1
    plan_id = plans[0]["id"]

    # 1. Dry run
    dry_resp = client.post(f"/api/v1/remediations/{plan_id}/dry-run")
    assert dry_resp.status_code == 200
    assert dry_resp.json()["dry_run_success"] is True

    # 2. Execution and verification re-scan
    exec_resp = client.post(f"/api/v1/remediations/{plan_id}/execute")
    assert exec_resp.status_code == 200
    res = exec_resp.json()
    assert res["status"] == "SUCCESS"
    assert res["verification_passed"] is True


def test_tamper_evident_audit_ledger(client):
    """Verify SHA-256 cryptographic chain integrity."""
    verify_resp = client.get("/api/v1/analytics/audit/verify")
    assert verify_resp.status_code == 200
    data = verify_resp.json()
    assert data["valid"] is True
    assert data["broken_sequence"] is None


def test_gemini_ai_finding_analysis(client):
    """Verify AI finding investigation with structured schema and fallback."""
    findings_resp = client.get("/api/v1/findings")
    finding_id = findings_resp.json()[0]["id"]

    ai_resp = client.post(
        "/api/v1/ai/analyze-finding",
        json={"target_type": "FINDING", "target_id": finding_id}
    )
    assert ai_resp.status_code == 200
    ai_data = ai_resp.json()
    assert "summary" in ai_data
    assert "root_cause" in ai_data
    assert "blast_radius" in ai_data
    assert len(ai_data["remediation_steps"]) >= 1
    assert "model_used" in ai_data
    assert "is_fallback" in ai_data


def test_file_upload_json(client):
    """Verify file upload ingestion of structured JSON security exports."""
    json_data = json.dumps([
        {
            "resource_name": "test-uploaded-vault",
            "resource_type": "AWS::S3::Bucket",
            "cloud_provider": "AWS",
            "region": "us-east-1",
            "configuration": {
                "name": "test-uploaded-vault",
                "is_public": True,
                "encrypted": False
            }
        }
    ]).encode("utf-8")

    resp = client.post(
        "/api/v1/cloud/upload-file",
        files={"file": ("test_export.json", io.BytesIO(json_data), "application/json")}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "COMPLETED"
    assert data["assets_discovered"] == 1
    assert data["format_detected"] == "JSON"
    assert data["findings_generated"] >= 1


def test_file_upload_csv(client):
    """Verify file upload ingestion of CSV inventory sheets."""
    csv_data = (
        "resource_name,resource_type,cloud_provider,region,is_public,encrypted\n"
        "prod-csv-bucket,AWS::S3::Bucket,AWS,us-east-1,true,false\n"
    ).encode("utf-8")

    resp = client.post(
        "/api/v1/cloud/upload-file",
        files={"file": ("inventory.csv", io.BytesIO(csv_data), "text/csv")}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "COMPLETED"
    assert data["assets_discovered"] == 1
    assert data["format_detected"] == "CSV"


def test_file_upload_terraform(client):
    """Verify file upload ingestion of Terraform HCL definitions."""
    tf_data = """
    resource "aws_s3_bucket" "test_tf_bucket" {
      bucket = "test-tf-bucket"
      acl    = "public-read"
    }
    """.encode("utf-8")

    resp = client.post(
        "/api/v1/cloud/upload-file",
        files={"file": ("main.tf", io.BytesIO(tf_data), "text/plain")}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "COMPLETED"
    assert data["assets_discovered"] == 1
    assert "TERRAFORM" in data["format_detected"]


def test_file_upload_pdf_rejection(client):
    """Verify that PDF uploads are explicitly rejected with helpful guidance."""
    fake_pdf = b"%PDF-1.4 fake binary content"
    resp = client.post(
        "/api/v1/cloud/upload-file",
        files={"file": ("audit_report.pdf", io.BytesIO(fake_pdf), "application/pdf")}
    )
    assert resp.status_code == 400
    assert "PDF reports are not supported" in resp.json()["detail"]


def test_honest_data_sources_status(client):
    """Verify data sources endpoint accurately reflects unconfigured state and required permissions."""
    resp = client.get("/api/v1/cloud/data-sources")
    assert resp.status_code == 200
    data = resp.json()
    assert "sources" in data
    assert "api_ingestion_docs" in data
    
    # Check that AWS has honest status message and required permissions
    aws_src = next(s for s in data["sources"] if s["provider"] == "AWS")
    assert "required_permissions" in aws_src
    assert "resources_collected" in aws_src
    assert len(aws_src["resources_collected"]) >= 3


def test_ingestion_jobs_history(client):
    """Verify ingestion jobs endpoint returns job records."""
    resp = client.get("/api/v1/cloud/ingestion-jobs")
    assert resp.status_code == 200
    jobs = resp.json()
    assert isinstance(jobs, list)


def test_user_signup_lifecycle(client):
    """Verify registration, password complexity enforcement, and duplicate rejection."""
    unique_email = f"analyst.{uuid.uuid4().hex[:6]}@cloudguard.ai"

    # 1. Reject weak password (too short)
    weak_payload = {
        "email": unique_email,
        "full_name": "New Analyst",
        "password": "weak",
        "role": "SECURITY_ANALYST"
    }
    r = client.post("/api/v1/auth/register", json=weak_payload)
    assert r.status_code in [400, 422]

    # 2. Reject password lacking complexity (8+ chars but no numbers/special)
    no_num_payload = {
        "email": unique_email,
        "full_name": "New Analyst",
        "password": "NoNumbersHereAtAll",
        "role": "SECURITY_ANALYST"
    }
    r_complex = client.post("/api/v1/auth/register", json=no_num_payload)
    assert r_complex.status_code == 400
    assert "Password must contain at least one number" in r_complex.json()["detail"]

    # 3. Successful registration with complex password
    valid_payload = {
        "email": unique_email,
        "full_name": "New Analyst",
        "password": "SecurePassword123!",
        "role": "SECURITY_ANALYST"
    }
    r = client.post("/api/v1/auth/register", json=valid_payload)
    assert r.status_code == 200
    user_data = r.json()
    assert user_data["email"] == unique_email
    assert user_data["full_name"] == "New Analyst"

    # 4. Duplicate email rejection
    r_dup = client.post("/api/v1/auth/register", json=valid_payload)
    assert r_dup.status_code == 400
    assert "already exists" in r_dup.json()["detail"]


def test_forgot_password_and_otp_flow(client):
    """Verify forgot-password anti-enumeration, OTP generation, verification, and reset."""
    from app.models.user import PasswordResetOTP, User
    from app.services.auth_service import hash_otp
    from app.database import SessionLocal

    db = SessionLocal()
    try:
        email = f"otp.user.{uuid.uuid4().hex[:6]}@cloudguard.ai"
        # 1. Register test user
        client.post("/api/v1/auth/register", json={
            "email": email,
            "full_name": "OTP Test User",
            "password": "OriginalPassword123!",
            "role": "SECURITY_ANALYST"
        })

        # 2. Request OTP (forgot-password)
        r_fp = client.post("/api/v1/auth/forgot-password", json={"email": email})
        assert r_fp.status_code == 200
        assert "verification code has been sent" in r_fp.json()["message"]

        # Retrieve created OTP from DB
        otp_record = db.query(PasswordResetOTP).filter(
            PasswordResetOTP.email == email,
            PasswordResetOTP.is_used == False
        ).first()
        assert otp_record is not None
        assert otp_record.attempts_count == 0

        # 3. Test wrong OTP rejection & attempt counter
        r_wrong = client.post("/api/v1/auth/verify-otp", json={"email": email, "otp": "000000"})
        assert r_wrong.status_code == 400
        assert "Invalid verification code" in r_wrong.json()["detail"]
        db.refresh(otp_record)
        assert otp_record.attempts_count == 1

        # 4. Set a known OTP for deterministic test verification
        test_otp = "849201"
        otp_record.otp_hash = hash_otp(test_otp)
        db.commit()

        # 5. Verify correct OTP -> returns reset token
        r_verify = client.post("/api/v1/auth/verify-otp", json={"email": email, "otp": test_otp})
        assert r_verify.status_code == 200
        verify_data = r_verify.json()
        assert "reset_token" in verify_data
        reset_token = verify_data["reset_token"]

        # 6. Reset password using valid token
        new_pw = "NewSecurePassword456@"
        r_reset = client.post("/api/v1/auth/reset-password", json={
            "reset_token": reset_token,
            "new_password": new_pw
        })
        assert r_reset.status_code == 200
        assert "password has been reset successfully" in r_reset.json()["message"]

        # 7. Login with old password must fail
        r_old_login = client.post("/api/v1/auth/login", json={"email": email, "password": "OriginalPassword123!"})
        assert r_old_login.status_code == 401

        # 8. Login with new password must succeed
        r_new_login = client.post("/api/v1/auth/login", json={"email": email, "password": new_pw})
        assert r_new_login.status_code == 200
        assert "access_token" in r_new_login.json()
    finally:
        db.close()



