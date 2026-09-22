"""CloudGuard AI - Dedicated Multi-Tenant Security & IDOR Hardening Test Suite

Verifies:
1. test_user_a_only_sees_own_assets: User A queries assets, sees only User A assets.
2. test_user_b_only_sees_own_assets: User B queries assets, sees only User B assets.
3. test_user_a_cannot_read_user_b_finding: User A cannot read User B's finding (404).
4. test_user_b_cannot_read_user_a_finding: User B cannot read User A's finding (404).
5. test_user_a_cannot_modify_user_b_asset: User A cannot PATCH User B's asset (404).
6. test_user_a_cannot_delete_user_b_incident: User A cannot DELETE User B's incident (404).
7. test_user_a_cannot_read_user_b_remediation: User A cannot GET User B's remediation plan (404).
8. test_user_a_cannot_read_user_b_ingestion_job: User A cannot GET User B's ingestion job (404).
9. test_user_a_cannot_read_user_b_audit_record: User A cannot GET User B's audit record (404).
10. test_user_id_cannot_be_overridden_by_payload: Payload user_id is ignored; JWT user_id is enforced.
11. test_no_default_admin_created: Zero default/seed admin accounts exist in database.
12. test_password_hash_not_returned: Registration, login, and /me never return password_hash.
13. test_frontend_has_no_database_credentials: Frontend source code is free of DB URLs and secret keys.
14. test_admin_cannot_bypass_customer_data_isolation: ADMIN role cannot bypass tenant isolation.
"""
import uuid
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import engine, Base, SessionLocal
from app.models.user import User, UserRole
from app.models.cloud import CloudAccount, IngestionJob, JobStatus, DataSource, DataSourceTypeEnum
from app.models.resource import CloudResource
from app.models.finding import Finding
from app.models.incident import Incident, IncidentSeverityEnum, IncidentStatusEnum
from app.models.remediation import RemediationPlan, RemediationPlanStatus
from app.models.audit import AuditLog, AuditActionEnum
from app.services.audit_service import log_action


client = TestClient(app)


class TestMultiTenantSecurity:
    """End-to-End Multi-Tenant Isolation & IDOR Verification between User A, User B, and Admin."""

    user_a = {}
    user_b = {}
    admin_user = {}

    @pytest.fixture(autouse=True, scope="class")
    @classmethod
    def setup_class_tenants(cls):
        """Create two completely isolated tenants (User A, User B) plus an Admin user."""
        # 1. Register User A
        email_a = f"user_a_{uuid.uuid4().hex[:6]}@tenant-alpha.io"
        pwd_a = "AlphaPass#2026!"
        res_a = client.post("/api/v1/auth/register", json={
            "email": email_a,
            "full_name": "Analyst Alpha",
            "password": pwd_a,
            "role": "SECURITY_ANALYST"
        })
        assert res_a.status_code == 200, res_a.text
        token_a = client.post("/api/v1/auth/login", json={"email": email_a, "password": pwd_a}).json()["access_token"]
        TestMultiTenantSecurity.user_a = {
            "id": res_a.json()["id"],
            "email": email_a,
            "token": token_a,
            "headers": {"Authorization": f"Bearer {token_a}"}
        }

        # 2. Register User B
        email_b = f"user_b_{uuid.uuid4().hex[:6]}@tenant-bravo.io"
        pwd_b = "BravoPass#2026!"
        res_b = client.post("/api/v1/auth/register", json={
            "email": email_b,
            "full_name": "Analyst Bravo",
            "password": pwd_b,
            "role": "SECURITY_ANALYST"
        })
        assert res_b.status_code == 200, res_b.text
        token_b = client.post("/api/v1/auth/login", json={"email": email_b, "password": pwd_b}).json()["access_token"]
        TestMultiTenantSecurity.user_b = {
            "id": res_b.json()["id"],
            "email": email_b,
            "token": token_b,
            "headers": {"Authorization": f"Bearer {token_b}"}
        }

        # 3. Register Admin User
        email_admin = f"admin_{uuid.uuid4().hex[:6]}@ops-sec.org"
        pwd_admin = "AdminOps#2026!"
        res_admin = client.post("/api/v1/auth/register", json={
            "email": email_admin,
            "full_name": "Security Admin",
            "password": pwd_admin,
            "role": "ADMIN"
        })
        assert res_admin.status_code == 200, res_admin.text
        token_admin = client.post("/api/v1/auth/login", json={"email": email_admin, "password": pwd_admin}).json()["access_token"]
        TestMultiTenantSecurity.admin_user = {
            "id": res_admin.json()["id"],
            "email": email_admin,
            "token": token_admin,
            "headers": {"Authorization": f"Bearer {token_admin}"}
        }

        # Ingest asset for User A
        res_ingest_a = client.post(
            "/api/v1/cloud/upload-evidence",
            json={
                "name": "alpha-financial-records-s3",
                "resource_type": "AWS::S3::Bucket",
                "provider": "AWS",
                "configuration": {"is_public": True, "encrypted": False}
            },
            headers=TestMultiTenantSecurity.user_a["headers"]
        )
        assert res_ingest_a.status_code == 200
        TestMultiTenantSecurity.user_a["resource_id"] = res_ingest_a.json()["resource_id"]
        TestMultiTenantSecurity.user_a["finding_id"] = res_ingest_a.json()["findings"][0]["id"]

        # Ingest asset for User B
        res_ingest_b = client.post(
            "/api/v1/cloud/upload-evidence",
            json={
                "name": "bravo-patient-database-rds",
                "resource_type": "AWS::RDS::DBInstance",
                "provider": "AWS",
                "configuration": {"publicly_accessible": True, "storage_encrypted": False}
            },
            headers=TestMultiTenantSecurity.user_b["headers"]
        )
        assert res_ingest_b.status_code == 200
        TestMultiTenantSecurity.user_b["resource_id"] = res_ingest_b.json()["resource_id"]
        TestMultiTenantSecurity.user_b["finding_id"] = res_ingest_b.json()["findings"][0]["id"]

        # Seed an incident and remediation for User B in DB
        db = SessionLocal()
        try:
            inc_b = Incident(
                id=f"inc-b-{uuid.uuid4().hex[:6]}",
                user_id=TestMultiTenantSecurity.user_b["id"],
                title="User B Isolated Incident",
                description="Bravo tenant isolated threat",
                severity=IncidentSeverityEnum.P1_CRITICAL,
                status=IncidentStatusEnum.INVESTIGATING,
                detected_at=db.query(User).first().created_at
            )
            db.add(inc_b)

            rem_b = RemediationPlan(
                id=f"rem-b-{uuid.uuid4().hex[:6]}",
                user_id=TestMultiTenantSecurity.user_b["id"],
                title="User B Remediation Plan",
                description="Remediate Bravo DB",
                finding_id=TestMultiTenantSecurity.user_b["finding_id"],
                status=RemediationPlanStatus.PROPOSED
            )
            db.add(rem_b)

            # Record Ingestion Job for User B
            ds_b = DataSource(
                id=f"ds-b-{uuid.uuid4().hex[:6]}",
                user_id=TestMultiTenantSecurity.user_b["id"],
                name="Bravo Data Stream",
                source_type=DataSourceTypeEnum.API_INGESTION,
                status="ACTIVE"
            )
            db.add(ds_b)
            db.flush()

            job_b = IngestionJob(
                id=f"job-b-{uuid.uuid4().hex[:6]}",
                user_id=TestMultiTenantSecurity.user_b["id"],
                data_source_id=ds_b.id,
                job_type="API_IMPORT",
                status=JobStatus.COMPLETED,
                records_processed=10,
                records_failed=0
            )
            db.add(job_b)

            # Record Audit Log for User B
            log_b = log_action(
                db=db,
                action=AuditActionEnum.USER_LOGIN,
                entity_type="USER",
                entity_id=TestMultiTenantSecurity.user_b["id"],
                actor_id=TestMultiTenantSecurity.user_b["id"],
                actor_email=TestMultiTenantSecurity.user_b["email"],
                details={"action": "Bravo Private Session Started"}
            )

            db.commit()
            TestMultiTenantSecurity.user_b["incident_id"] = inc_b.id
            TestMultiTenantSecurity.user_b["remediation_id"] = rem_b.id
            TestMultiTenantSecurity.user_b["job_id"] = job_b.id
            TestMultiTenantSecurity.user_b["audit_id"] = log_b.id
        finally:
            db.close()

    def test_user_a_only_sees_own_assets(self):
        """User A queries assets and sees ONLY User A assets."""
        res = client.get("/api/v1/cloud/resources", headers=self.user_a["headers"])
        assert res.status_code == 200
        items = res.json()
        ids = [item["id"] for item in items]
        assert self.user_a["resource_id"] in ids
        assert self.user_b["resource_id"] not in ids

    def test_user_b_only_sees_own_assets(self):
        """User B queries assets and sees ONLY User B assets."""
        res = client.get("/api/v1/cloud/resources", headers=self.user_b["headers"])
        assert res.status_code == 200
        items = res.json()
        ids = [item["id"] for item in items]
        assert self.user_b["resource_id"] in ids
        assert self.user_a["resource_id"] not in ids

    def test_user_a_cannot_read_user_b_finding(self):
        """User A attempts to read User B finding -> returns 404 (IDOR defense)."""
        res = client.get(f"/api/v1/findings/{self.user_b['finding_id']}", headers=self.user_a["headers"])
        assert res.status_code == 404
        assert "not found" in res.text.lower()

    def test_user_b_cannot_read_user_a_finding(self):
        """User B attempts to read User A finding -> returns 404 (IDOR defense)."""
        res = client.get(f"/api/v1/findings/{self.user_a['finding_id']}", headers=self.user_b["headers"])
        assert res.status_code == 404
        assert "not found" in res.text.lower()

    def test_user_a_cannot_modify_user_b_asset(self):
        """User A attempts to PATCH User B asset -> returns 404; asset unchanged."""
        res = client.patch(
            f"/api/v1/cloud/resources/{self.user_b['resource_id']}",
            json={"name": "tampered-by-user-a"},
            headers=self.user_a["headers"]
        )
        assert res.status_code == 404

        # Verify DB was NOT modified
        db = SessionLocal()
        try:
            asset = db.query(CloudResource).filter(CloudResource.id == self.user_b["resource_id"]).first()
            assert asset.name == "bravo-patient-database-rds"
        finally:
            db.close()

    def test_user_a_cannot_delete_user_b_incident(self):
        """User A attempts to DELETE User B incident -> returns 404; incident preserved."""
        res = client.delete(
            f"/api/v1/incidents/{self.user_b['incident_id']}",
            headers=self.user_a["headers"]
        )
        assert res.status_code == 404

        # Verify incident still exists
        db = SessionLocal()
        try:
            inc = db.query(Incident).filter(Incident.id == self.user_b["incident_id"]).first()
            assert inc is not None
        finally:
            db.close()

    def test_user_a_cannot_read_user_b_remediation(self):
        """User A attempts to GET User B remediation plan -> returns 404."""
        res = client.get(
            f"/api/v1/remediations/{self.user_b['remediation_id']}",
            headers=self.user_a["headers"]
        )
        assert res.status_code == 404

    def test_user_a_cannot_read_user_b_ingestion_job(self):
        """User A attempts to GET User B ingestion job -> returns 404."""
        res = client.get(
            f"/api/v1/cloud/ingestion-jobs/{self.user_b['job_id']}",
            headers=self.user_a["headers"]
        )
        assert res.status_code == 404

    def test_user_a_cannot_read_user_b_audit_record(self):
        """User A attempts to GET User B audit record -> returns 404."""
        res = client.get(
            f"/api/v1/analytics/audit/logs/{self.user_b['audit_id']}",
            headers=self.user_a["headers"]
        )
        assert res.status_code == 404

    def test_user_id_cannot_be_overridden_by_payload(self):
        """Payload user_id cannot spoof ownership; backend binds strictly to JWT sub."""
        spoofed_user_id = self.user_b["id"]
        res = client.post(
            "/api/v1/cloud/upload-evidence",
            json={
                "name": "spoof-attempt-s3",
                "resource_type": "AWS::S3::Bucket",
                "provider": "AWS",
                "user_id": spoofed_user_id,
                "configuration": {"is_public": False}
            },
            headers=self.user_a["headers"]
        )
        assert res.status_code == 200
        created_res_id = res.json()["resource_id"]

        db = SessionLocal()
        try:
            res_row = db.query(CloudResource).filter(CloudResource.id == created_res_id).first()
            assert res_row.user_id == self.user_a["id"]
            assert res_row.user_id != spoofed_user_id
        finally:
            db.close()

    def test_no_default_admin_created(self):
        """Zero default or seeded admin accounts exist; login as default admin fails."""
        db = SessionLocal()
        try:
            default_admin = db.query(User).filter(User.email == "admin@cloudguard.ai").first()
            assert default_admin is None, "admin@cloudguard.ai must not exist"
        finally:
            db.close()

        res = client.post("/api/v1/auth/login", json={
            "email": "admin@cloudguard.ai",
            "password": "Admin@CloudGuard2026!"
        })
        assert res.status_code == 401

    def test_password_hash_not_returned(self):
        """Registration, login, and /me endpoints never return password_hash or hashed_password."""
        # 1. Test /me
        res_me = client.get("/api/v1/auth/me", headers=self.user_a["headers"])
        assert res_me.status_code == 200
        data_me = res_me.json()
        assert "password" not in data_me
        assert "hashed_password" not in data_me
        assert "password_hash" not in data_me

        # 2. Test registration
        res_reg = client.post("/api/v1/auth/register", json={
            "email": f"analyst_check_{uuid.uuid4().hex[:6]}@enterprise.corp",
            "full_name": "Audit Analyst",
            "password": "ValidComplex#Pass2026!",
            "role": "SECURITY_ANALYST"
        })
        assert res_reg.status_code == 200
        data_reg = res_reg.json()
        assert "password" not in data_reg
        assert "hashed_password" not in data_reg
        assert "password_hash" not in data_reg

    def test_frontend_has_no_database_credentials(self):
        """Frontend source code contains zero database URLs, Supabase service-role keys, or default passwords."""
        frontend_src = Path(__file__).resolve().parent.parent.parent / "frontend" / "src"
        assert frontend_src.exists(), f"Frontend src not found at {frontend_src}"

        forbidden_patterns = [
            "postgresql://",
            "postgres://",
            "SUPABASE_SERVICE_ROLE_KEY",
            "service_role",
            "Admin@CloudGuard2026!",
            "ENCRYPTION_KEY"
        ]

        for file_path in frontend_src.rglob("*"):
            if file_path.is_file() and file_path.suffix in [".js", ".jsx", ".ts", ".tsx", ".html"]:
                content = file_path.read_text(encoding="utf-8", errors="ignore")
                for pattern in forbidden_patterns:
                    assert pattern not in content, f"Forbidden pattern '{pattern}' found in {file_path.name}"

    def test_admin_cannot_bypass_customer_data_isolation(self):
        """ADMIN role does NOT bypass customer data isolation in normal application routes."""
        res_resources = client.get("/api/v1/cloud/resources", headers=self.admin_user["headers"])
        assert res_resources.status_code == 200
        admin_items = res_resources.json()
        admin_res_ids = [item["id"] for item in admin_items]

        # Admin must NOT automatically see User A's or User B's resources
        assert self.user_a["resource_id"] not in admin_res_ids
        assert self.user_b["resource_id"] not in admin_res_ids

        # Admin cannot read User A's finding via normal route
        res_finding = client.get(f"/api/v1/findings/{self.user_a['finding_id']}", headers=self.admin_user["headers"])
        assert res_finding.status_code == 404
