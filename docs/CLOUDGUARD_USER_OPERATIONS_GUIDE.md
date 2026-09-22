# CloudGuard AI — Comprehensive SOC Operations Guide
> **SRIJAN Hackathon 2026 — Enterprise Security Operations Center (SOC) Platform**  
> *Confidential Local Reference Guide — For Platform Evaluators, Operators & Security Engineers*

---

## 1. Executive Summary & Architecture Overview

**CloudGuard AI** is a production-grade multi-cloud security operations center (SOC) platform engineered to solve the acute problem of cloud misconfiguration exposure, compliance drift, and alert fatigue across AWS, Microsoft Azure, and Google Cloud Platform (GCP).

### Core Architectural Principles
1. **Light Enterprise SOC Interface**: Built with high-contrast slate neutrals (`#f8fafc` background, `#ffffff` panels, `#0f172a` text) and strict functional color coding (Red = Critical, Orange = High, Amber = Medium, Blue = Low/Action, Green = Safe/Compliant). Purged of generic dark purple, neon, and glowing cards.
2. **Deterministic Detection Engine**: Detection is **100% deterministic** and powered by 26+ native CIS Benchmark and PCI-DSS 4.0 policy rules plus an unsupervised ML anomaly detector (Isolation Forest). **Gemini AI is never a detection dependency**.
3. **Decoupled AI Threat Advisory**: Gemini 2.5 Flash is strictly invoked on-demand via the `[Explain with AI]` button to generate human-readable threat context, blast radius analysis, and attack path simulation. If Gemini is offline, rate-limited, or unconfigured, all detection and remediation functions operate normally.
4. **First-Class Ingestion Hub**: Ingest real cloud security data via:
   - **Method A (Cloud Connectors)**: AWS, Azure, GCP with transparent configuration status, required least-privilege IAM policies, and monitored resource types.
   - **Method B (File Ingestion)**: Multi-format parser supporting JSON (`.json`, `.tfstate`), CSV (`.csv`), Terraform HCL (`.tf`), and YAML (`.yaml`). Machine-readable only; rejects unstructured PDFs.
   - **Method C (REST API)**: Direct programmatic ingestion for CI/CD pipelines via `POST /api/v1/cloud/upload-evidence`.
5. **Cryptographic Integrity & Non-Repudiation**: Every ingestion, scan, policy violation, and remediation is chained into a tamper-evident SHA-256 cryptographic audit ledger.
6. **Verified Self-Healing**: Automated remediation playbooks feature explicit "Dry-Run Simulation" followed by post-execution rescan validation.

---

## 2. Platform Component Topology

```
┌────────────────────────────────────────────────────────────────────────┐
│                        VERCEL EDGE NETWORK                             │
│       React 18 + Vite SPA • Light SOC Theme • Pure Vanilla CSS         │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ HTTPS / REST API
┌──────────────────────────────────▼─────────────────────────────────────┐
│                         RENDER WEB SERVICE                             │
│                  FastAPI 0.110 • Python 3.13 Runtime                   │
│  ┌───────────────────────────────┬──────────────────────────────────┐  │
│  │ Multi-Format Ingestion Parser │ 26+ CIS Rules Evaluation Engine  │  │
│  ├───────────────────────────────┼──────────────────────────────────┤  │
│  │ Isolation Forest Anomaly ML   │ AES-256-GCM Credential Vault     │  │
│  ├───────────────────────────────┼──────────────────────────────────┤  │
│  │ SHA-256 Chained Audit Ledger  │ Gemini 2.5 Flash Advisory Engine │  │
│  └───────────────────────────────┴──────────────────────────────────┘  │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ PostgreSQL Protocol (TLS 1.3)
┌──────────────────────────────────▼─────────────────────────────────────┐
│                    SUPABASE POSTGRESQL 16 CLUSTER                      │
│        PgBouncer Pooler • Alembic Migrations • Relational Schema        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Five-Minute Evaluation & Demo Script

When evaluating or demonstrating CloudGuard AI to judges or stakeholders, follow this exact sequence:

### Step 1: Login & Clean State Demonstration (Minute 0:00 – 1:00)
1. Open the platform at `http://localhost:5173` (or the live Vercel URL).
2. Authenticate using pre-filled credentials:
   - **Email**: `admin@cloudguard.ai`
   - **Password**: `Admin@CloudGuard2026!`
3. In the top navigation bar, point out the real-time engine health dots:
   - `RULES: 26 CIS` (Deterministic policy rules active)
   - `AI: GEMINI LIVE` or `AI: RULE/ML MODE` (Honest status display)
   - `AUDIT: SHA-256` (Cryptographic ledger active)
4. Click `Clear Data` in the top navbar and confirm the dialog. Demonstrate the **Zero-Data State** on the Dashboard:
   - Notice the onboarding banner explaining that no cloud connectors are active and prompting the user to ingest data.

### Step 2: Multi-Format File Ingestion (Minute 1:00 – 2:00)
1. Navigate to **Data Sources** (`/data-sources`).
2. Point out **Method A (Cloud Connectors)**:
   - AWS, Azure, GCP cards honestly state `NOT CONFIGURED (DEMO/FILE MODE ACTIVE)`.
   - Show the exact required least-privilege IAM policies (`SecurityAudit`, `ReadOnlyAccess`, etc.) and monitored resource types.
3. Scroll to **Method B (Security Data File Ingestion)**:
   - Click **`Load Sample AWS JSON`** (or drag & drop `samples/aws_security_export.json`).
   - Watch the 5-stage live pipeline progress indicator:
     `[1. Upload]` → `[2. Format Detect]` → `[3. Normalize]` → `[4. 26+ CIS Rules]` → `[5. Audit Chain]`
   - A green success banner appears: `✓ Ingested 2 assets and generated 3 security findings`.
4. Click **`Load Sample Terraform HCL`** (or upload `samples/terraform_security_example.tf`):
   - Notice instant regex-based HCL parsing discovering S3 buckets and security groups.
5. In **Section D (Recent Ingestion Jobs Log)**, observe the job entries recording filenames, parsed formats, record counts, and timestamps.

### Step 3: Rule-Based Findings & 4-Pillar Risk Engine (Minute 2:00 – 3:00)
1. Navigate to **Findings** (`/findings`).
2. Demonstrate multi-criteria filtering: filter by `CRITICAL` or `AWS`.
3. Notice that demo items are clearly badged with `[DEMO DATASET]`.
4. Click on **`S3 Bucket Lacks Default Server-Side Encryption`**:
   - The unified **Finding Detail Modal** opens.
   - Show the **4-Pillar Posture Risk Formula Breakdown**:
     - *Pillar 1 (35%)*: Base Severity (High/Critical)
     - *Pillar 2 (25%)*: Exploitability (Direct unencrypted storage)
     - *Pillar 3 (25%)*: Network Exposure (Public access settings)
     - *Pillar 4 (15%)*: Anomaly Context (Isolation forest telemetry)
   - View **Deterministic Rule Evidence (Normalized Configuration)** with the copy button and SHA-256 integrity seal.
   - Show the **Prescriptive Remediation Guidance** tabs (AWS CLI vs Terraform fix).

### Step 4: Decoupled Gemini AI Threat Advisory (Minute 3:00 – 4:00)
1. In the same Finding Detail Modal, scroll to the **Gemini AI Threat Advisory** panel.
2. Note the clear disclaimer: *"CIS rules engine performed the deterministic detection above. Gemini generates human-readable threat analysis on-demand."*
3. Click **`[Explain with AI]`**:
   - The system calls `POST /api/v1/ai/analyze-finding`.
   - Shows the latency (e.g., `320ms response`) and model tag (`gemini-2.5-flash`).
   - Displays Executive Threat Summary and Potential Attack Chain.
   - If AI is offline or unconfigured, point out the graceful fallback message: *"AI advisory engine is currently offline. Deterministic CIS rule detection and remediation guidance remain fully valid."*
4. Click **`[Remediate / Self-Heal]`** to jump directly into the Remediation workflow.

### Step 5: Safe Self-Healing & Tamper-Evident Audit Ledger (Minute 4:00 – 5:00)
1. In **Remediation** (`/remediations`):
   - Select the unencrypted S3 bucket plan.
   - Click **`Run Dry-Run Simulation`**: observe pre-flight verification without mutating infrastructure.
   - Click **`Execute Remediation`** and confirm.
   - Observe the automated post-fix rescan validating that the misconfiguration is closed.
2. Navigate to **Audit Log** (`/audit`):
   - Click **`Verify Cryptographic Integrity`**.
   - Show that every file upload, scan, finding, and remediation is chained in the immutable ledger.
   - Display the SHA-256 hashes verifying that the audit trail is 100% tamper-evident.

---

## 4. Ingestion Engine & Supported Formats

The ingestion engine is implemented in `backend/app/services/parser_service.py` and supports four distinct formats:

| Format | File Extensions | Parser Strategy | Expected Data Model |
| :--- | :--- | :--- | :--- |
| **JSON** | `.json`, `.tfstate` | Native JSON deserialization with schema detection | CloudGuard schema, AWS Config/CLI exports, or Terraform state files. |
| **CSV** | `.csv` | Python `csv.DictReader` with header normalization | Inventory export spreadsheets containing `name`, `type`, `provider`, `region`. |
| **Terraform HCL** | `.tf` | Robust Regex Block Parser | HCL resource blocks: `resource "aws_s3_bucket" "name" { ... }`. |
| **YAML** | `.yaml`, `.yml` | Safe YAML loader (`yaml.safe_load`) | Cloud infrastructure configurations or Kubernetes manifests. |
| **PDF** | `.pdf` | **Strictly Rejected with HTTP 400** | Human-oriented binary reports cannot be reliably evaluated deterministically. Returns informative error. |

### Provided Sample Test Files
Three realistic test files are pre-bundled in the `samples/` directory:
- `samples/aws_security_export.json`: S3 unencrypted bucket + Open port 22/5432 security group.
- `samples/aws_security_export.csv`: Multi-asset inventory table with CIS flags.
- `samples/terraform_security_example.tf`: Terraform HCL infrastructure defining insecure public assets.

---

## 5. Security & Cryptographic Standards

1. **Password Hashing**: Salted Argon2id / BCrypt with work factor 12.
2. **Secret Encryption at Rest**: AES-256-GCM with 96-bit unique IV and 128-bit authentication tag. Plaintext secrets are never stored.
3. **Audit Hash Chaining**: Deterministic SHA-256 blockchain-style chaining:
   $$\text{Hash}_i = \text{SHA256}(\text{Hash}_{i-1} \parallel \text{Seq}_i \parallel \text{Action} \parallel \text{Entity} \parallel \text{Actor} \parallel \text{Payload} \parallel \text{Timestamp})$$
4. **JWT Authentication**: HS256 signed tokens with 120-minute expiration.
5. **Least Privilege**: Read-only cloud connector access models with zero write permissions required.

---

## 6. Automated Verification Test Suite

The platform includes **47 comprehensive backend integration, unit, and multi-tenant security isolation tests** across `backend/tests/test_api.py` and `backend/tests/test_multi_tenant_security.py`.

### Running the Test Suite
Open PowerShell or bash in the backend directory:
```powershell
# From workspace root:
.\backend\venv\Scripts\python.exe -m pytest backend/tests -v

# Or from backend directory:
cd backend
pytest -v
```

### Complete Test Coverage Breakdown (47 Passed):

#### 1. Core Platform & API Capabilities (`test_api.py` - 15 Tests)
- `test_health_endpoints`: Verifies `/api/v1/health`, `/api/v1/health/live`, and `/api/v1/health/ready`.
- `test_system_status_sanitization`: Verifies zero sensitive credentials or private keys are exposed in telemetry.
- `test_aes_256_gcm_encryption_lifecycle`: Verifies cryptographic AES-256-GCM authenticated encryption and decryption.
- `test_password_hashing`: Verifies Argon2id password hashing and resistance to timing attacks.
- `test_dashboard_metrics`: Verifies calculation of posture score, severity breakdown, and top-risk assets.
- `test_security_findings_listing`: Verifies deterministic CIS benchmark and PCI-DSS detection.
- `test_remediation_dry_run_and_verified_rescan`: Verifies pre-execution simulation followed by automatic rescan validation.
- `test_tamper_evident_audit_ledger`: Verifies SHA-256 genesis-to-head cryptographic chain integrity.
- `test_file_upload_json`: Verifies parsing of JSON and AWS/Azure Terraform state files.
- `test_file_upload_csv`: Verifies parsing of cloud asset CSV inventories and finding generation.
- `test_file_upload_demo_csv_fixture`: Verifies safe handling of demo fixtures without false credential triggers.
- `test_file_upload_terraform`: Verifies parsing of native Terraform HCL (`.tf`) infrastructure definitions.
- `test_file_upload_pdf_rejection`: Verifies explicit rejection of binary/PDF files with actionable feedback.
- `test_honest_data_sources_status`: Verifies transparent reporting of connector readiness and IAM requirements.
- `test_ingestion_jobs_history`: Verifies persistent job recording and ingestion provenance.

#### 2. Multi-Tenant User Isolation & IDOR Defenses (`test_api.py::TestMultiTenantSecuritySuite` - 18 Tests)
- `test_01_user_a_signup`: Verifies registration of primary tenant analyst.
- `test_02_user_b_signup`: Verifies registration of secondary isolated tenant analyst.
- `test_03_user_a_login`: Verifies JWT issuance and token validation for User A.
- `test_04_user_b_login`: Verifies JWT issuance and token validation for User B.
- `test_05_user_a_creates_asset`: Verifies User A can provision isolated cloud resources.
- `test_06_user_b_creates_asset`: Verifies User B can provision isolated cloud resources.
- `test_07_user_a_sees_only_own_asset`: Verifies User A asset query results never contain User B resources.
- `test_08_user_b_sees_only_own_asset`: Verifies User B asset query results never contain User A resources.
- `test_09_user_a_cannot_access_user_b_finding`: Verifies 404 Not Found on cross-tenant finding access (IDOR prevention).
- `test_10_user_b_cannot_access_user_a_incident`: Verifies 404 Not Found on cross-tenant incident access.
- `test_11_user_a_cannot_modify_user_b_remediation`: Verifies 404 Not Found on cross-tenant remediation execution.
- `test_12_logout_invalidates_client_session`: Verifies session invalidation and client-side credential clearing.
- `test_13_login_form_contains_no_default_credentials`: Verifies zero hardcoded emails or passwords in DOM fixtures.
- `test_14_production_startup_does_not_create_admin`: Verifies production startup never creates backdoor default admins.
- `test_15_api_never_returns_password_hash`: Verifies user password hashes are excluded from all API responses.
- `test_16_frontend_contains_no_database_credentials`: Verifies frontend build bundle contains zero database URLs.
- `test_17_frontend_contains_no_service_role_key`: Verifies frontend build contains zero Supabase service-role secrets.
- `test_18_jwt_identity_cannot_be_overridden_by_request_user_id`: Verifies JWT `sub` claim strictly supersedes any payload ID.

#### 3. Zero-Trust Non-Bypass Security (`test_multi_tenant_security.py` - 14 Tests)
- `test_user_a_only_sees_own_assets`: Independent assertion of asset isolation for User A.
- `test_user_b_only_sees_own_assets`: Independent assertion of asset isolation for User B.
- `test_user_a_cannot_read_user_b_finding`: Re-asserts cross-tenant finding isolation.
- `test_user_b_cannot_read_user_a_finding`: Symmetrical assertion of finding isolation.
- `test_user_a_cannot_modify_user_b_asset`: Prevents cross-tenant asset updates or tampering.
- `test_user_a_cannot_delete_user_b_incident`: Prevents cross-tenant incident purging.
- `test_user_a_cannot_read_user_b_remediation`: Verifies remediation plan confidentiality.
- `test_user_a_cannot_read_user_b_ingestion_job`: Verifies ingestion telemetry confidentiality.
- `test_user_a_cannot_read_user_b_audit_record`: Verifies audit log ledger separation across tenants.
- `test_user_id_cannot_be_overridden_by_payload`: Deep validation of body payload injection resistance.
- `test_no_default_admin_created`: Verifies database has zero pre-seeded default administrative users.
- `test_password_hash_not_returned`: Verifies JSON serializer omits hash fields on all routes.
- `test_frontend_has_no_database_credentials`: Scans frontend static assets for credential patterns.
- `test_admin_cannot_bypass_customer_data_isolation`: **Zero Admin Bypass Guarantee** — Even platform administrators cannot query, inspect, or modify another customer's tenant data.

---

## 7. Operational API Reference

| Endpoint | Method | Purpose |
| :--- | :---: | :--- |
| `/api/v1/auth/login` | POST | Authenticate analyst and retrieve JWT access token |
| `/api/v1/cloud/data-sources` | GET | List cloud connectors status, required permissions, and supported formats |
| `/api/v1/cloud/upload-file` | POST | Multipart upload for JSON, CSV, Terraform HCL, and YAML |
| `/api/v1/cloud/upload-evidence` | POST | Direct JSON payload ingestion for CI/CD pipelines |
| `/api/v1/cloud/ingestion-jobs` | GET | Retrieve recent ingestion jobs history and record counts |
| `/api/v1/cloud/resources` | GET | List discovered cloud resources with risk scores |
| `/api/v1/cloud/rescan` | POST | Re-evaluate all discovered resources against active CIS catalog |
| `/api/v1/cloud/clear-data` | DELETE | Purge all resources, findings, and incidents for zero-data testing |
| `/api/v1/findings` | GET | List all security findings with severity and provider filters |
| `/api/v1/ai/analyze-finding` | POST | On-demand Gemini AI threat advisory and blast radius modeling |
| `/api/v1/remediations` | GET | List automated self-healing playbooks |
| `/api/v1/remediations/{id}/dry-run` | POST | Execute safe pre-flight simulation |
| `/api/v1/remediations/{id}/execute` | POST | Apply fix and trigger automated verification rescan |
| `/api/v1/audit/logs` | GET | Retrieve chronological audit trail records |
| `/api/v1/audit/verify` | GET | Verify cryptographic SHA-256 chain integrity |
| `/api/v1/system/status` | GET | System status with zero-credential disclosure |
| `/api/v1/system/seed-demo-data` | POST | Seed simulated multi-cloud environment |

---
*CloudGuard AI Platform • SRIJAN Hackathon 2026 • Document Version 3.0.0*

---

## 8. Authentication & Password Reset System (OTP & SMTP Delivery)

CloudGuard AI features a zero-trust enterprise authentication architecture with strict role-based access control (RBAC), cryptographically salted one-time passwords (OTP), and anti-enumeration protections.

### 8.1 Authentication Endpoints

| Endpoint | Method | Purpose | Security Controls |
| :--- | :--- | :--- | :--- |
| /api/v1/auth/token | POST | User Login & Token Grant | Argon2id verification, returns JWT access & refresh tokens |
| /api/v1/auth/signup | POST | Account Registration | Strict password complexity enforcement, duplicate email check |
| /api/v1/auth/forgot-password | POST | Request Password Reset OTP | Anti-enumeration (identical 200 OK response), 60s cooldown |
| /api/v1/auth/verify-otp | POST | Verify 6-Digit OTP | Max 5 failed attempts lockout, 10-minute expiry, issues reset token |
| /api/v1/auth/reset-password | POST | Execute Password Reset | Validates reset token purpose, updates hash, revokes prior sessions |
| /api/v1/auth/logout | POST | Session Termination | Invalidates client session, records audit event |
| /api/v1/auth/me | GET | Authenticated Profile | Requires Bearer token, returns identity and roles |

### 8.2 Cryptographic OTP Lifecycle

`
[User Request] 
      |  POST /api/v1/auth/forgot-password
      ?
[Anti-Enumeration Guard] --> Check rate-limit (60s cooldown per email)
      |
      ?
[OTP Generator] --> secrets.randbelow(900000) + 100000 (Crypto-secure 6-digit)
      |
      +--> SHA-256 Hash with JWT_SECRET_KEY salt --> Stored in PasswordResetOTP
      |    (Plaintext OTP is never stored in DB or returned in API)
      |
      ?
[Email Delivery Service]
      +--> Production: Authenticated TLS SMTP (AWS SES / SendGrid / Postmark)
      +--> Dev Fallback: Secure server stdout logger (Honest "UNCONFIGURED" status)
      |
      ?
[User Submits Code] --> POST /api/v1/auth/verify-otp
      +--> Verify hash: SHA-256(input + salt) == stored_hash
      +--> Verify not expired (<= 10 minutes)
      +--> Verify attempts <= 5 (Locks out on 5th failure)
      +--> Success: Mark is_used=True, Issue single-use reset token (JWT purpose="password_reset")
      |
      ?
[Password Reset] --> POST /api/v1/auth/reset-password
      +--> Enforce complexity (>= 8 chars, Aa1@)
      +--> Argon2id re-hash
      +--> Chained Audit Event: USER_PASSWORD_RESET
`

### 8.3 Required Environment Variables for Email Delivery

To enable real external email transmission in your Render production environment, set the following environment variables in your Render Web Service dashboard:

| Variable | Recommended Production Value | Description |
| :--- | :--- | :--- |
| SMTP_HOST | email-smtp.us-east-1.amazonaws.com / smtp.sendgrid.net | Outgoing SMTP server hostname |
| SMTP_PORT | 587 | Outgoing SMTP port (587 for STARTTLS) |
| SMTP_USERNAME | [Your SMTP User / API Key ID] | SMTP authentication username |
| SMTP_PASSWORD | [Your SMTP Secret / API Key] | SMTP authentication password |
| SMTP_FROM | security@yourdomain.com / noreply@cloudguard.ai | From email address |
| SMTP_TLS | true | Enforces STARTTLS encryption |

> **Development Fallback Transparency**: If SMTP variables are not configured in Render, CloudGuard AI will honestly record delivery_status: "UNCONFIGURED" and output the OTP to secure server logs for local verification. The platform will **never fake email delivery** or return a fraudulent success message.

---

## 9. Multi-Tenant Data Isolation, IDOR Defenses & User Ownership

CloudGuard AI enforces cryptographically bound multi-tenant data isolation at the application gateway and database engine layers.

### 9.1 Core Multi-Tenant Architecture
- **Verified JWT Subject Scoping**: The authenticated user's identity is extracted exclusively from the cryptographically signed JWT sub claim. The platform rejects or ignores all request-body, query-string, or client-supplied user_id parameters.
- **Resource Ownership**: Every CloudResource, Finding, Incident, RemediationPlan, DataSource, IngestionJob, and GeminiAuditLog record possesses an indexed user_id foreign key referencing users.id.
- **Insecure Direct Object Reference (IDOR) Defense**:
  - GET /api/v1/findings/{id} verifies finding.user_id == current_user.id. Unauthorized access attempts return a safe 404 Not Found (preventing existence enumeration).
  - GET /api/v1/incidents/{id} verifies incident.user_id == current_user.id -> 404 Not Found.
  - POST /api/v1/remediations/{id}/dry-run and /execute verify plan.user_id == current_user.id -> 404 Not Found.
- **Role Separation & Zero Admin Bypass**:
  - **Standard Users (`SECURITY_ANALYST` / `VIEWER`)**: Query scope is strictly restricted to their own `user_id`. Every API route automatically injects `filter(Entity.user_id == current_user.id)`.
  - **Platform Administrators (`ADMIN`)**: Admin capabilities are restricted to system health monitoring, infrastructure scaling, and tenant account provisioning. **Admins have ZERO bypass into customer data** (`test_admin_cannot_bypass_customer_data_isolation`). Customer security findings, cloud resources, incidents, and remediation playbooks are mathematically inaccessible to cross-tenant operators.
- **Strict Database Foreign Key & NOT NULL Integrity**:
  - All tenant records (`CloudResource`, `Finding`, `Incident`, `RemediationPlan`, `DataSource`, `IngestionJob`, `GeminiAuditLog`) enforce non-nullable `user_id` foreign key columns referencing `users.id`.
- **Supabase Row Level Security (RLS)**: Documented and exportable via `docs/SUPABASE_RLS_POLICIES.sql`, establishing zero-trust database policies for direct database access while allowing FastAPI service pooling.

---

## 10. Enterprise 12-Stage CI/CD Pipeline & Security Gates

CloudGuard AI is guarded by a comprehensive 12-stage GitHub Actions CI/CD pipeline defined in `.github/workflows/ci.yml`:

| Stage | Name | Gates & Verifications |
|:---:|:---|:---|
| **Stage 1** | Repository Checkout | Clones complete tree with full commit history |
| **Stage 2** | Backend Dependencies | Installs and caches Python 3.11 requirements |
| **Stage 3** | Syntax & Lint Gate | Executes `python -m compileall` across `app/` and `tests/` |
| **Stage 4 & 5** | Unit & Integration Tests | Runs all 47 pytest test cases across isolation, API, and crypto suites |
| **Stage 6** | Frontend Dependencies | Installs Node.js 20 dependencies via `npm ci` |
| **Stage 7 & 8** | Production Bundle Compilation | Builds Vite production bundle with zero compiler errors or missing assets |
| **Stage 9** | Secret Scanning Gate | Enforces zero tracked `.env` files and zero live cloud API keys with demo-fixture false-positive prevention |
| **Stage 10** | Container Build Gate | Builds backend (`cloudguard-backend:latest`) and frontend (`cloudguard-frontend:latest`) Docker images |
| **Stage 11 & 12** | Deployment & Smoke Tests | Launches Docker Compose stack, validates `/health`, `/health/live`, `/health/ready`, and `/api/system/status` |

