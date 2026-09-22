# CloudGuard AI — Enterprise Multi-Cloud Security Operations Center (SOC) & Automated Self-Healing Platform

[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.13-3776AB?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5.4.21-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%20(Supabase)-4169E1?logo=postgresql&logoColor=white)](https://supabase.com)
[![Tests](https://img.shields.io/badge/Pytest-47%2F47%20Passed%20(100%25)-brightgreen?logo=pytest&logoColor=white)](./docs/TEST_PLAN.md)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-12--Stage%20Pipeline%20Passing-success?logo=githubactions&logoColor=white)](./.github/workflows/ci.yml)
[![Security Gate](https://img.shields.io/badge/Secret%20Scan-Zero%20Credential%20Leaks-blue?logo=shield&logoColor=white)](./docs/SECURITY_ARCHITECTURE.md)
[![Multi-Tenancy](https://img.shields.io/badge/Multi--Tenant-Zero--Trust%20Isolated-blueviolet?logo=auth0&logoColor=white)](./docs/CLOUDGUARD_USER_OPERATIONS_GUIDE.md)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

> **SRIJAN Hackathon 2026 — Enterprise Cybersecurity Track**  
> *Production-Grade Automated Cloud Security Posture Management (CSPM), Threat Detection & Verifiable Remediation Platform*

---

## 🌟 Executive Summary

**CloudGuard AI** is a production-ready, multi-cloud automated security posture management (CSPM) and self-healing platform engineered to solve cloud misconfiguration exposure, compliance drift, and alert fatigue across **Amazon Web Services (AWS)**, **Microsoft Azure**, and **Google Cloud Platform (GCP)**.

Unlike typical tools that suffer from AI hallucinations or surface endless unprioritized alerts, CloudGuard AI enforces a **deterministic-first, zero-trust architecture**:
1. **100% Deterministic Detection Engine**: Evaluates infrastructure against **26+ native CIS Benchmark and PCI-DSS 4.0 policy rules** with precise technical JSON evidence extraction. Detection never depends on generative AI.
2. **Real Machine Learning Anomaly Detection**: Unsupervised `scikit-learn` Isolation Forest trained on CloudTrail and VPC Flow Log telemetry to detect behavioral anomalies without static signatures.
3. **Evidence-Driven 4-Pillar Risk Engine**: Mathematically combines $40\%$ Severity + $30\%$ Reachability + $20\%$ Criticality + $10\%$ ML Anomaly into an actionable composite risk score ($0-100$).
4. **Decoupled Gemini 2.5 Flash Advisory**: Generates human-readable threat context, blast radius analysis, and attack path simulation strictly on-demand. If Gemini is unavailable, detection and self-healing continue uninterrupted with offline fallbacks.
5. **Verified Self-Healing Automation**: Generates multi-format remediation playbooks (AWS CLI, Azure CLI, Terraform HCL, Python Boto3) with mandatory **Dry-Run Simulation** followed by **Automated Post-Execution Re-Scan Validation**.
6. **Cryptographic SHA-256 Chained Audit Ledger**: Every ingestion, scan, policy violation, and remediation mutation is chained into a tamper-evident audit ledger with genesis-to-head mathematical verification.
7. **Strict Multi-Tenant Isolation & Zero Admin Bypass**: Complete data partitioning, zero IDOR, and absolute isolation where even platform administrators have zero access to customer tenant data (`test_admin_cannot_bypass_customer_data_isolation`).
8. **Light Enterprise SOC Interface**: Clean, high-contrast slate neutral design (`#f8fafc`, `#ffffff`, `#0f172a`) built for real security analysts, completely free of generic dark-neon and glowing card clutter.

---

## 🏗️ Platform Architecture Topology

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

## 🔐 Zero-Trust Security & Multi-Tenancy Architecture

| Security Dimension | Technical Implementation | Verification Gate |
| :--- | :--- | :--- |
| **Identity Scoping** | Cryptographically signed JWT `sub` claim extraction | Injected `user_id` in request body/query is rejected |
| **Tenant Isolation** | Symmetrical 2-user test suite (User A vs User B) | 404 Not Found on cross-tenant findings/incidents/assets |
| **Zero Admin Bypass** | Database-level scoping on all routes | **Admins have zero access to customer data** |
| **Data Integrity** | Foreign key & NOT NULL constraints on `user_id` | Alembic migration enforced across all 7 core tables |
| **Password Security** | Argon2id salted hashing with work factor 12 | Password hashes omitted from all API schemas |
| **Password Reset** | Cryptographic 6-digit OTP with SHA-256 salt & rate-limits | Anti-enumeration responses & authentic SMTP delivery |
| **Secret Vault** | AES-256-GCM authenticated envelope encryption | System status API strictly sanitizes all credentials |
| **Row Level Security** | Supabase RLS policies documented and exportable | [SUPABASE_RLS_POLICIES.sql](./docs/SUPABASE_RLS_POLICIES.sql) |

---

## 📥 First-Class Ingestion Hub

CloudGuard AI ingests infrastructure configurations through three first-class methods:

### Method A: Cloud Connectors (AWS, Azure, GCP)
- Transparent connector status reporting (e.g., `NOT CONFIGURED (DEMO/FILE MODE ACTIVE)`).
- Documented least-privilege IAM policies (`SecurityAudit`, `Reader`, `Security Reviewer`).
- Zero simulated or fake cloud connections.

### Method B: Machine-Readable File Ingestion
- **JSON / Terraform State**: Ingest AWS, Azure, GCP resource states (`.json`, `.tfstate`).
- **CSV Asset Inventory**: Parses asset identifiers, types, providers, and configurations (`.csv`).
- **Terraform HCL**: Parses native infrastructure definitions (`.tf`).
- **YAML**: Parses Kubernetes and CI/CD security definitions (`.yaml`).
- **Strict PDF Rejection**: Explicitly rejects unstructured documents (PDF/Word/Binaries) with clear error guidance.

### Method C: Programmatic REST API
- Direct ingestion for CI/CD pipelines via `POST /api/v1/cloud/upload-evidence`.

---

## 🚀 Quickstart Guide

### Option 1: Docker Compose (One-Click Production Run)

```bash
# Clone the repository
git clone https://github.com/Thirumal143200/CloudGuard-AI-Platform.git
cd CloudGuard-AI-Platform

# Launch full stack (Frontend + Backend + SQLite/Postgres)
docker compose up --build
```
- **Frontend SOC Portal**: `http://localhost:5173`
- **Backend Swagger API Docs**: `http://localhost:8000/docs`
- **Health Probe**: `http://localhost:8000/health`

---

### Option 2: Local Development Setup

#### 1. Backend Service (FastAPI)
```powershell
# Navigate to backend directory
cd backend

# Create and activate Python virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload --port 8000
```

#### 2. Frontend Application (React + Vite)
```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Vite dev server
npm run dev
```

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env` in the `backend/` directory:

```env
# Platform Mode
ENVIRONMENT=development
DEPLOYMENT_MODE=DEMO

# Security & Cryptographic Keys (Must be 32+ bytes)
JWT_SECRET_KEY=generate-secure-random-32-byte-hex-key
JWT_REFRESH_SECRET_KEY=generate-secure-refresh-32-byte-hex-key
ENCRYPTION_KEY=generate-secure-aes-256-gcm-hex-key

# Database Connection (Supabase PostgreSQL or Local SQLite fallback)
DATABASE_URL=sqlite:///./cloudguard.db

# Optional: Google Gemini 2.5 Flash GenAI (Threat Advisory)
GEMINI_API_KEY=your-gemini-api-key

# Optional: Outgoing SMTP Email Delivery (Password Reset OTP)
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USERNAME=your-smtp-username
SMTP_PASSWORD=your-smtp-password
SMTP_FROM=security@yourdomain.com
SMTP_TLS=true
```

---

## 🧪 Testing & Automated Verification

CloudGuard AI is backed by **47 automated tests** covering core platform operations, cryptographic lifecycles, and multi-tenant isolation.

```powershell
# Run the complete test suite
.\backend\venv\Scripts\python.exe -m pytest backend/tests -v

# Run with test coverage report
.\backend\venv\Scripts\python.exe -m pytest backend/tests --cov=backend/app --cov-report=term-missing
```

### Test Suite Summary (47 / 47 Passed)
- **Core Platform & API Suite (`test_api.py`)**: 15 tests verifying health probes, sanitization, AES-256-GCM lifecycle, password hashing, dashboard risk math, 26+ CIS rules, dry-run remediation with automatic rescan, SHA-256 audit ledger, and multi-format file ingestion (JSON, CSV, Terraform, and PDF rejection).
- **Multi-Tenant Security Suite (`test_api.py::TestMultiTenantSecuritySuite`)**: 18 tests verifying User A and User B signup/login, asset creation, strict asset isolation, cross-tenant IDOR prevention, logout invalidation, zero default credentials in login forms, zero default admin creation, and password hash concealment.
- **Deep Zero-Trust Isolation Suite (`test_multi_tenant_security.py`)**: 14 tests verifying symmetrical cross-tenant data isolation, non-nullable foreign keys, payload body injection protection, static bundle credential absence, and the **Zero Admin Bypass Guarantee** (`test_admin_cannot_bypass_customer_data_isolation`).

### Frontend Production Build Verification
```bash
cd frontend
npm run build
```
*Compiles cleanly with 0 errors in under 2 seconds.*

### Strict Secret Scanning Gate
```bash
# Verify .env is untracked
git ls-files --error-unmatch .env 2>/dev/null && echo "FAIL: .env tracked" || echo "PASS: .env untracked"

# Scan entire repository for potential AWS access key patterns
grep -rnE "AKIA[0-9A-Z]{16}" --exclude-dir={.git,node_modules,venv,__pycache__} .
```

---

## 🔄 12-Stage GitHub Actions CI/CD Pipeline

Every commit and pull request to `main` is gated by `.github/workflows/ci.yml`:

```
[1. Checkout] ──► [2. Setup Python] ──► [3. Syntax/Lint (compileall)]
                      │
                      ▼
[4 & 5. Pytest 47/47 Tests (Unit, Integration, Multi-Tenant Isolation)]
                      │
                      ▼
[6. Setup Node.js] ──► [7 & 8. Vite Production Build & Asset Audit]
                      │
                      ▼
[9. Secret Scanning Gate (.env exclusion + strict AKIA regex)]
                      │
                      ▼
[10. Docker Image Build Gate (Backend & Frontend Images)]
                      │
                      ▼
[11 & 12. Containerized Compose Deployment & Readiness Smoke Tests]
```

---

## 📡 Operational REST API Catalog

| Endpoint | Method | Purpose | Authentication |
| :--- | :---: | :--- | :---: |
| `/api/v1/auth/signup` | `POST` | Self-service analyst account registration | Public |
| `/api/v1/auth/token` | `POST` | User login & JWT issuance | Public |
| `/api/v1/auth/forgot-password` | `POST` | Anti-enumeration 6-digit OTP generation | Public |
| `/api/v1/auth/verify-otp` | `POST` | Verify OTP code & receive reset token | Public |
| `/api/v1/auth/reset-password` | `POST` | Password reset with Argon2id re-hash | Reset Token |
| `/api/v1/auth/logout` | `POST` | Session termination & audit event | Bearer JWT |
| `/api/v1/auth/me` | `GET` | Authenticated profile & permissions | Bearer JWT |
| `/api/v1/cloud/data-sources` | `GET` | Connector statuses & IAM permissions | Bearer JWT |
| `/api/v1/cloud/upload-file` | `POST` | Multipart upload (JSON, CSV, TF, YAML) | Bearer JWT |
| `/api/v1/cloud/upload-evidence` | `POST` | Direct JSON ingestion for CI/CD | Bearer JWT |
| `/api/v1/cloud/ingestion-jobs` | `GET` | Ingestion job history & records | Bearer JWT |
| `/api/v1/cloud/resources` | `GET` | Discovered resources with risk scores | Bearer JWT |
| `/api/v1/findings` | `GET` | CIS benchmark violations & evidence | Bearer JWT |
| `/api/v1/ai/analyze-finding` | `POST` | On-demand Gemini AI threat advisory | Bearer JWT |
| `/api/v1/remediations` | `GET` | Self-healing playbooks (CLI, TF, Boto3) | Bearer JWT |
| `/api/v1/remediations/{id}/dry-run` | `POST` | Safe pre-flight execution simulation | Bearer JWT |
| `/api/v1/remediations/{id}/execute` | `POST` | Apply fix & trigger verified rescan | Bearer JWT |
| `/api/v1/audit/logs` | `GET` | Cryptographic audit trail ledger | Bearer JWT |
| `/api/v1/audit/verify` | `GET` | SHA-256 genesis-to-head verification | Bearer JWT |
| `/api/v1/system/status` | `GET` | Sanitized system status & telemetry | Public |

---

## ⏱️ 5-Minute Evaluator & Demo Script

Follow this structured workflow to evaluate the platform in under 5 minutes:

1. **Minute 0:00 – 1:00 (Authentication & Clean State)**:
   - Register a new security analyst account at `/signup`.
   - Log in and observe the clean SOC Dashboard with high-contrast slate aesthetics and zero default data.
2. **Minute 1:00 – 2:00 (Multi-Format File Ingestion)**:
   - Navigate to **Data Sources** → **Upload Evidence File**.
   - Upload sample test file `backend/sample_data/aws_infrastructure_sample.json` or `azure_security_sample.csv`.
   - Observe format auto-detection, parsing, and immediate CIS rule evaluation.
3. **Minute 2:00 – 3:00 (Rule-Based Findings & 4-Pillar Risk Engine)**:
   - Navigate to **Security Findings** to inspect detected CIS benchmark violations.
   - Click a finding to view exact technical JSON evidence, reachability status, and risk score breakdown.
4. **Minute 3:00 – 4:00 (Decoupled Gemini AI Threat Advisory)**:
   - Click `[Explain with AI]` on any finding.
   - Observe human-readable threat analysis, blast radius calculation, and MITRE ATT&CK mapping generated in milliseconds.
5. **Minute 4:00 – 5:00 (Self-Healing & Tamper-Evident Ledger)**:
   - Navigate to **Remediations**, select a remediation playbook, and click **Simulate (Dry-Run)**.
   - Click **Execute Remediation** and observe the automated post-fix rescan validating closure.
   - Navigate to **Audit Ledger** and verify the cryptographic SHA-256 chain integrity.

---

## 📂 Documentation Suite Directory

All engineering architecture specifications, security analyses, and operational guides are maintained in `docs/`:

| Document | Description |
| :--- | :--- |
| [`CLOUDGUARD_USER_OPERATIONS_GUIDE.md`](./docs/CLOUDGUARD_USER_OPERATIONS_GUIDE.md) | **Comprehensive Enterprise SOC Operations & Evaluation Guide** |
| [`PRODUCTION_VERIFICATION.md`](./docs/PRODUCTION_VERIFICATION.md) | **Production Verification & Deployment Gate Checklist** |
| [`SECURITY_ARCHITECTURE.md`](./docs/SECURITY_ARCHITECTURE.md) | **Zero-Trust Architecture, STRIDE Threat Model & Cryptographic Chaining** |
| [`TEST_PLAN.md`](./docs/TEST_PLAN.md) | **Comprehensive 47-Test Strategy & CI/CD Verification Matrix** |
| [`DATABASE_SCHEMA.md`](./docs/DATABASE_SCHEMA.md) | **Normalized 15-Table Relational Schema & Foreign Key Constraints** |
| [`SUPABASE_RLS_POLICIES.sql`](./docs/SUPABASE_RLS_POLICIES.sql) | **Supabase Row Level Security (RLS) Multi-Tenant Policies** |
| [`ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | **System Architecture Topologies & Data Flow Specifications** |
| [`PRD.md`](./docs/PRD.md) | **Product Requirements Document** |
| [`TRD.md`](./docs/TRD.md) | **Technical Requirements Document** |
| [`APP_FLOW.md`](./docs/APP_FLOW.md) | **Application User Journeys & State Transitions** |
| [`UI_UX_DESIGN_BRIEF.md`](./docs/UI_UX_DESIGN_BRIEF.md) | **UI/UX Design System & Slate Neutrals Palette** |
| [`BACKEND_SCHEMA.md`](./docs/BACKEND_SCHEMA.md) | **Backend Pydantic & SQLAlchemy Models Specification** |
| [`ML_DESIGN.md`](./docs/ML_DESIGN.md) | **Isolation Forest ML Anomaly Detection & Feature Vectors** |
| [`AI_DESIGN.md`](./docs/AI_DESIGN.md) | **Gemini 2.5 Flash Prompt Engineering & Offline Fallback Engine** |
| [`API_SPECIFICATION.md`](./docs/API_SPECIFICATION.md) | **Complete OpenAPI/REST Endpoints Reference** |
| [`DATA_LINEAGE.md`](./docs/DATA_LINEAGE.md) | **End-to-End Data Provenance & Cryptographic Chaining** |
| [`DEPLOYMENT_PLAN.md`](./docs/DEPLOYMENT_PLAN.md) | **Container Orchestration & Cloud Hosting Architecture** |
| [`DEMO_SCRIPT.md`](./docs/DEMO_SCRIPT.md) | **5-Minute Hackathon Winning Presentation & Demo Script** |
| [`MIGRATION.md`](./docs/MIGRATION.md) | **v1.0 Prototype to v2.0 Platform Upgrade Changelog** |
| [`ENVIRONMENT_CONFIGURATION.md`](./docs/ENVIRONMENT_CONFIGURATION.md) | **Environment Variables & Production Secret Provisioning** |

---

## 👥 Contributors & Acknowledgements

Developed for the **SRIJAN Hackathon 2026 — Enterprise Cybersecurity Track**.  
Built with FastAPI, React, Vite, Supabase PostgreSQL, and Google Gemini AI.
