# CloudGuard AI — Comprehensive Test Plan & Verification Strategy

**Version:** 3.0.0  
**Coverage Target:** >90% Backend Engine, Multi-Tenant Security & Critical Flow Coverage  
**Current Status:** 47 Tests Passing (100% Pass Rate)

---

## 1. Test Levels & Strategy

1. **Unit Testing (`pytest`):**
   - Cryptographic hashing & Argon2id verification routines in `auth_service.py`.
   - AES-256-GCM authenticated encryption/decryption in `crypto_service.py`.
   - SHA-256 cryptographic hash-chaining ledger integrity in `audit_service.py`.
   - Deterministic rule evaluations for each of the 26+ rules in `rule_engine.py`.
   - Feature vector extraction and mathematical scoring in `ml_engine.py` and `risk_engine.py`.
   - Multi-format file ingestion parsing (JSON, CSV, Terraform HCL, and PDF rejection) in `parser_service.py`.

2. **Integration Testing (`FastAPI TestClient`):**
   - Full user authentication lifecycle (Register → Login → Authenticated Calls → Logout).
   - End-to-end Remediation flow: Finding detection → Remediation package creation → Dry-Run simulation → Execution mutation → Automatic verification re-scan.
   - Hash chain integrity verification under normal and tampered conditions.
   - Transparent data source status reporting and ingestion job tracking.

3. **Multi-Tenant Security & IDOR Defenses:**
   - Strict tenant data partitioning: User A and User B cross-visibility assertions.
   - IDOR prevention: Cross-tenant access to findings, incidents, remediations, and ingestion jobs yields 404 Not Found.
   - Zero Admin Bypass: Platform administrators have zero access to customer tenant data.
   - JWT Subject Scoping: Request payloads cannot override the cryptographically signed JWT `sub` identity.
   - Foreign key and non-null constraints on `user_id` across all database models.

4. **Secret Scanning & Security Gates:**
   - Automated git index check ensuring `.env` is untracked.
   - Regex scanning for cloud credentials (`AKIA...`), database connection strings, and private keys.
   - Static asset inspection ensuring frontend production bundle contains zero database credentials or service-role keys.

---

## 2. Automated Test Suite Matrix (47 Passed)

### Suite 1: Core Platform & Engine Tests (`backend/tests/test_api.py`)

| Test Name | Target Component | Verification Objective |
| :--- | :--- | :--- |
| `test_health_endpoints` | Health API | Validates `/health`, `/health/live`, `/health/ready` |
| `test_system_status_sanitization` | System API | Verifies zero credentials leaked in status response |
| `test_aes_256_gcm_encryption_lifecycle` | Crypto Vault | Verifies AES-256-GCM encryption, decryption & auth tag |
| `test_password_hashing` | Auth Engine | Verifies Argon2id one-way hashing & timing resistance |
| `test_dashboard_metrics` | Analytics API | Verifies 4-pillar risk engine & posture score math |
| `test_security_findings_listing` | Findings API | Verifies 26+ CIS benchmark rule detections |
| `test_remediation_dry_run_and_verified_rescan`| Remediation Engine | Verifies dry-run simulation & automatic rescan |
| `test_tamper_evident_audit_ledger` | Audit Ledger | Verifies SHA-256 hash chaining & genesis verification |
| `test_file_upload_json` | Ingestion Engine | Verifies parsing of JSON and Terraform state files |
| `test_file_upload_csv` | Ingestion Engine | Verifies parsing of CSV inventories & finding extraction |
| `test_file_upload_demo_csv_fixture` | Ingestion Engine | Verifies demo CSV fixture without false credential scan |
| `test_file_upload_terraform` | Ingestion Engine | Verifies Terraform HCL (`.tf`) block extraction |
| `test_file_upload_pdf_rejection` | Ingestion Engine | Verifies explicit rejection of binary/PDF files |
| `test_honest_data_sources_status` | Connectors | Verifies honest status and documented IAM policies |
| `test_ingestion_jobs_history` | Ingestion History | Verifies persistent job recording and record counting |

### Suite 2: Multi-Tenant Security & Frontend Integrity (`backend/tests/test_api.py::TestMultiTenantSecuritySuite`)

| Test Name | Target Component | Verification Objective |
| :--- | :--- | :--- |
| `test_01_user_a_signup` | Auth Service | Registers User A successfully |
| `test_02_user_b_signup` | Auth Service | Registers User B successfully |
| `test_03_user_a_login` | Auth Service | Issues valid JWT access token for User A |
| `test_04_user_b_login` | Auth Service | Issues valid JWT access token for User B |
| `test_05_user_a_creates_asset` | Cloud Service | User A creates cloud resource bound to User A |
| `test_06_user_b_creates_asset` | Cloud Service | User B creates cloud resource bound to User B |
| `test_07_user_a_sees_only_own_asset` | Tenant Scoping | User A resource listing excludes User B assets |
| `test_08_user_b_sees_only_own_asset` | Tenant Scoping | User B resource listing excludes User A assets |
| `test_09_user_a_cannot_access_user_b_finding` | IDOR Defense | Cross-tenant finding access returns 404 |
| `test_10_user_b_cannot_access_user_a_incident` | IDOR Defense | Cross-tenant incident access returns 404 |
| `test_11_user_a_cannot_modify_user_b_remediation` | IDOR Defense | Cross-tenant remediation modification returns 404 |
| `test_12_logout_invalidates_client_session` | Session Lifecycle | Logout invalidates token & clears storage |
| `test_13_login_form_contains_no_default_credentials` | Auth Security | Form contains zero default credentials |
| `test_14_production_startup_does_not_create_admin` | Startup Security | Server startup creates zero backdoor accounts |
| `test_15_api_never_returns_password_hash` | Data Privacy | Password hashes omitted from all API responses |
| `test_16_frontend_contains_no_database_credentials` | Bundle Audit | Static bundle contains zero DB connection strings |
| `test_17_frontend_contains_no_service_role_key` | Bundle Audit | Static bundle contains zero Supabase service keys |
| `test_18_jwt_identity_cannot_be_overridden_by_request_user_id`| Identity Binding | Injected `user_id` in body is strictly ignored |

### Suite 3: Deep Zero-Trust Isolation & Zero Admin Bypass (`backend/tests/test_multi_tenant_security.py`)

| Test Name | Target Component | Verification Objective |
| :--- | :--- | :--- |
| `test_user_a_only_sees_own_assets` | Asset Scoping | User A sees only User A assets |
| `test_user_b_only_sees_own_assets` | Asset Scoping | User B sees only User B assets |
| `test_user_a_cannot_read_user_b_finding` | Finding Isolation | User A cannot read User B finding (404) |
| `test_user_b_cannot_read_user_a_finding` | Finding Isolation | User B cannot read User A finding (404) |
| `test_user_a_cannot_modify_user_b_asset` | Asset Mutation | User A cannot alter User B asset |
| `test_user_a_cannot_delete_user_b_incident` | Incident Deletion | User A cannot delete User B incident |
| `test_user_a_cannot_read_user_b_remediation` | Remediation Isolation | User A cannot access User B remediation plan |
| `test_user_a_cannot_read_user_b_ingestion_job` | Ingestion Isolation | User A cannot view User B ingestion telemetry |
| `test_user_a_cannot_read_user_b_audit_record` | Audit Isolation | User A cannot view User B audit events |
| `test_user_id_cannot_be_overridden_by_payload` | Payload Injection | Body `user_id` parameter injection is blocked |
| `test_no_default_admin_created` | Account Audit | Zero default or hardcoded admin users exist |
| `test_password_hash_not_returned` | Schema Audit | User models never serialize `hashed_password` |
| `test_frontend_has_no_database_credentials` | Frontend Scan | Zero database URLs or keys in client source |
| `test_admin_cannot_bypass_customer_data_isolation` | Zero Admin Bypass | **ADMIN role has zero access to tenant data** |

---

## 3. Test Execution Instructions

### Local PowerShell / Bash:
```powershell
# Run entire test suite
.\backend\venv\Scripts\python.exe -m pytest backend/tests -v

# Run with coverage report
.\backend\venv\Scripts\python.exe -m pytest backend/tests --cov=backend/app --cov-report=term-missing
```

### Frontend Build Verification:
```bash
cd frontend
npm run build
```

### Secret Scan & Credential Leak Check:
```bash
# Check .env is untracked
git ls-files --error-unmatch .env 2>/dev/null && echo "FAIL" || echo "PASS"

# Scan source code for exposed access keys
grep -rnE "AKIA[0-9A-Z]{16}" --exclude-dir={.git,node_modules,venv,__pycache__} .
```

---

## 4. Continuous Integration Pipeline (GitHub Actions)

Every pull request and push to `main` triggers `.github/workflows/ci.yml` running through 12 validation stages:
1. Checkout Repository
2. Python 3.11 Setup & Dependency Caching
3. Backend Syntax (`compileall`)
4. Backend Pytest Unit Tests
5. Multi-Tenant Integration Tests
6. Node.js 20 Setup & Frontend Dependency Caching
7. Frontend Production Bundle Compilation
8. Frontend Bundle Secret & Artifact Audit
9. Strict Secret Scanning & Credential Leak Gate
10. Docker Backend & Frontend Image Build Gate
11. Containerized Compose Deployment
12. Automated Health & Readiness Probe Smoke Tests
