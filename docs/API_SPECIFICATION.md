# CloudGuard AI — REST API Specification

**Base URL:** `http://localhost:8000/api/v1`  
**Authentication:** Bearer JWT Token in `Authorization: Bearer <token>` header  
**Interactive Docs:** `http://localhost:8000/docs` (Swagger UI)  

---

## Endpoint Directory

### 1. Authentication (`/auth`)
- `POST /auth/register` — Register a new analyst or admin account
- `POST /auth/login` — Authenticate and receive JWT access & refresh tokens
- `GET /auth/me` — Retrieve active user session profile

### 2. Cloud Accounts & Resources (`/cloud`)
- `GET /cloud/accounts` — List connected AWS / Azure / GCP accounts
- `POST /cloud/accounts` — Connect a new cloud tenant
- `GET /cloud/resources` — Filter and list multi-cloud inventory assets
- `GET /cloud/resources/{id}` — Get specific resource configuration and state

### 3. Security Findings & Rules (`/findings`)
- `GET /findings` — Query findings by severity (`CRITICAL`, `HIGH`), status, and cloud account
- `GET /findings/{id}` — Retrieve deep raw evidence and remediation templates
- `GET /findings/rules` — List catalog of 26+ active security rules

### 4. Incidents & Forensics (`/incidents`)
- `GET /incidents` — List correlated high-priority incidents
- `GET /incidents/{id}` — View root cause analysis and blast radius projection
- `GET /incidents/{id}/timeline` — View forensic timeline events

### 5. Remediation Engine (`/remediations`)
- `GET /remediations` — List proposed and executed remediation plans
- `POST /remediations/{id}/dry-run` — Simulate fix without mutating live cloud state
- `POST /remediations/{id}/execute` — Apply security fix and run verification re-scan

### 6. Analytics & Compliance (`/analytics`)
- `GET /analytics/dashboard` — High-level risk score, breakdown, and posture KPI metrics
- `GET /analytics/audit/logs` — Retrieve cryptographically chained audit records
- `GET /analytics/audit/verify` — Validate SHA-256 chain integrity
- `GET /analytics/compliance/frameworks` — CIS Benchmark & PCI-DSS compliance scores

### 7. Gemini AI Assistant (`/ai`)
- `POST /ai/analyze-finding` — Invoke Gemini 2.5 Flash for deep root cause and MITRE mapping

### 8. System & Admin (`/system`)
- `GET /system/health` — Platform health check
- `POST /system/seed-demo-data` — Bootstrap multi-cloud demo environment
