# CloudGuard AI — Environment Configuration & Secrets Specification

**Version:** 2.0  
**Classification:** Enterprise Security Baseline  
**Audience:** DevSecOps, SRE, Systems Architects  

---

## 1. Master Environment Variable Matrix

The following table documents all core runtime environment variables required by the CloudGuard AI Platform:

| Variable | Purpose | Required | Example/Format | Secret |
| :--- | :--- | :---: | :--- | :---: |
| `DATABASE_URL` | Database connection | Yes | PostgreSQL URL | Yes |
| `JWT_SECRET` | JWT signing (alias: `JWT_SECRET_KEY`) | Yes | Random secret (64-char hex) | Yes |
| `JWT_REFRESH_SECRET` | Refresh token signing (alias: `JWT_REFRESH_SECRET_KEY`) | Yes | Random secret (64-char hex) | Yes |
| `GEMINI_API_KEY` | Gemini API | AI mode | Provider key (`AIzaSy...`) | Yes |
| `GEMINI_MODEL` | Gemini model | Yes | Configurable model name (`gemini-2.5-flash`) | No |
| `ENCRYPTION_KEY` | AES-256-GCM master key | Yes | 32-byte key (64 hex characters) | Yes |
| `CORS_ORIGIN` | Allowed frontend origin | Yes | Production URL (`https://app.cloudguard.ai`) | No |
| `VITE_API_URL` | Backend API URL | Yes | Backend URL (`https://api.cloudguard.ai`) | No |
| `PORT` | Backend port | Yes | `8000` | No |
| `ENVIRONMENT` | Runtime environment | Yes | `development`/`staging`/`production` | No |
| `DEPLOYMENT_MODE` | Runtime operational mode | Yes | `PRODUCTION`/`DEMO`/`NO_DATA` | No |
| `HOST` | Backend host binding address | No | `0.0.0.0` or `127.0.0.1` | No |
| `GEMINI_TIMEOUT_SECONDS` | Gemini request timeout | No | `15` | No |

---

## 2. Cloud Provider Credentials (Optional & Independent)

CloudGuard AI connects to major hyperscalers using read-only, least-privilege credentials. **No cloud provider is mandatory.** If credentials for a provider are omitted, that provider status is marked as `NOT CONFIGURED` and no synthetic resources are fabricated.

### A. Amazon Web Services (AWS)
| Variable | Purpose | Required | Example / Format | Secret |
|:---|:---|:---:|:---|:---:|
| `AWS_ACCESS_KEY_ID` | IAM identity access key | Optional | `AKIAIOSFODNN7EXAMPLE` | **Yes** |
| `AWS_SECRET_ACCESS_KEY` | IAM identity secret access key | Optional | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` | **Yes** |
| `AWS_DEFAULT_REGION` | Default AWS region to scan | Optional | `us-east-1` | No |
| `AWS_ROLE_ARN` | Cross-account SecurityAudit role to assume | Optional | `arn:aws:iam::123456789012:role/CloudGuardAudit` | No |

### B. Microsoft Azure
| Variable | Purpose | Required | Example / Format | Secret |
|:---|:---|:---:|:---|:---:|
| `AZURE_SUBSCRIPTION_ID` | Target Azure subscription GUID | Optional | `c9b74b1e-0000-0000-0000-000000000000` | No |
| `AZURE_TENANT_ID` | Entra ID tenant GUID | Optional | `72f988bf-0000-0000-0000-000000000000` | No |
| `AZURE_CLIENT_ID` | Service principal App ID | Optional | `a1b2c3d4-0000-0000-0000-000000000000` | No |
| `AZURE_CLIENT_SECRET` | Service principal password / secret | Optional | `~SampleSecretValue...` | **Yes** |

### C. Google Cloud Platform (GCP)
| Variable | Purpose | Required | Example / Format | Secret |
|:---|:---|:---:|:---|:---:|
| `GCP_PROJECT_ID` | Google Cloud project identifier | Optional | `cloudguard-prod-2026` | No |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to service account JSON key file | Optional | `/secrets/gcp/sa-audit-key.json` | **Yes** |

---

## 3. Deployment Modes Explained

### 1. `PRODUCTION` Mode
- Used in live staging and production enterprise deployments.
- Only real connected cloud data and user-provided configuration files are scanned.
- No synthetic data is generated.
- Hardcoded test credentials are fully deactivated.
- Missing mandatory secrets immediately abort process startup with a fatal exit code.

### 2. `DEMO` Mode
- Used for hackathons, jury presentations, and sales demonstrations.
- Loads a pre-built, realistic multi-cloud test topology (`prod-finance-backup-2026`, `web-public-ingress-sg`, etc.).
- Every synthetic resource and event is tagged with `is_simulated = true`.
- The user interface clearly displays `[SIMULATED DATASET]` badges.

### 3. `NO_DATA` Mode
- Used when newly onboarded without credentials or uploads.
- The UI displays:
  > **No data source configured.**  
  > Actions available: `[Connect Cloud]` • `[Upload Evidence]` • `[Import Telemetry]`
- Never fabricates fake findings or simulated entities.

---

## 4. Secret Sanitization & Logging Security Rules

1. **Zero Secret Printing:** No secret value (`GEMINI_API_KEY`, `JWT_SECRET_KEY`, `ENCRYPTION_KEY`, DB passwords) may ever be printed to console, logged via logger, or exposed through HTTP response payloads.
2. **Startup Health Check Sanity:** Startup logs only confirm configuration existence:
   ```json
   {
     "DATABASE_URL": "configured (postgresql)",
     "JWT_SECRET_KEY": "configured (sha256-entropy)",
     "GEMINI_API_KEY": "configured",
     "ENCRYPTION_KEY": "configured (aes-256-gcm)",
     "ENVIRONMENT": "production",
     "DEPLOYMENT_MODE": "PRODUCTION"
   }
   ```
3. **Frontend Boundary:** No backend secret is ever embedded in client JavaScript bundles or stored in `localStorage`.
