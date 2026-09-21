# CloudGuard AI — Product Requirements Document (PRD)

**Version:** 2.0  
**Date:** 2026-09-22  
**Author:** CloudGuard Engineering Team  
**Hackathon:** SRIJAN 2026  

---

## 1. Product Overview

CloudGuard AI is an **evidence-driven, multi-cloud security posture management platform** that detects misconfigurations, predicts risk using real ML, explains threats with Gemini AI, and provides traceable remediation workflows — all backed by real data with full audit trails.

### 1.1 Problem Statement

Organizations adopting multi-cloud infrastructure face:
- **Configuration drift** — resources deployed without security review
- **Alert fatigue** — thousands of findings with no prioritization
- **Visibility gaps** — no unified view across AWS, Azure, GCP
- **Cost waste** — idle/oversized resources costing thousands monthly
- **Compliance burden** — manual mapping to CIS, SOC2, HIPAA, PCI DSS, NIST, GDPR

Current tools either generate random scores with no evidence, or require expensive enterprise licenses.

### 1.2 Existing CloudGuard MVP

The original MVP (CloudGuard-AI repository) is a client-side-only SPA with:
- 25+ security rules running on randomized mock data
- Chart.js visualizations with no backend persistence
- "AI Prediction" backed by Math.random()
- No authentication, no database, no real cloud integration

### 1.3 Why the MVP is Insufficient

| Jury Question | MVP Answer | Required Answer |
|--------------|------------|-----------------|
| Where does data come from? | Math.random() | Real cloud APIs or user uploads |
| Is ML actually running? | No | Isolation Forest with feature extraction |
| Can I see the database? | No database exists | PostgreSQL with full schema |
| Can I prove remediation? | Simulated click | Before/after snapshot comparison |
| What if Gemini fails? | N/A | Deterministic local fallback |

### 1.4 New Product Vision

A **genuinely functional** cloud security platform where every finding is traceable to real data, every score is deterministic and explainable, and every AI analysis is grounded in evidence.

---

## 2. Product Goals

1. **Real Data Pipeline** — ingest from live cloud APIs or user uploads, never fabricate
2. **Evidence-Based Detection** — every finding traces back to a specific resource configuration
3. **Explainable ML** — Isolation Forest with visible features, scores, and thresholds
4. **Grounded AI** — Gemini explains findings using only supplied evidence
5. **Deterministic Risk** — weighted formula (40% Rules + 30% ML + 20% Criticality + 10% Context)
6. **Full Audit Trail** — every action logged, every change tracked
7. **Remediation Proof** — before/after snapshots with rescan verification

### Non-Goals

- Real-time streaming from cloud providers (batch sync is sufficient)
- Multi-tenant SaaS deployment (single-tenant for hackathon)
- Mobile native applications
- Automated destructive remediation without user approval
- Replacing enterprise CSPM tools like Prisma Cloud or Wiz

---

## 3. Personas

### P1: Cloud Security Administrator
- **Role:** Manages cloud security posture across AWS/Azure/GCP
- **Needs:** Unified dashboard, compliance tracking, remediation workflows
- **Pain:** Switching between provider-specific security tools

### P2: Security Analyst
- **Role:** Investigates security findings and incidents
- **Needs:** Evidence panels, data lineage, ML explanations
- **Pain:** Findings with no context or evidence

### P3: DevSecOps Engineer
- **Role:** Integrates security into CI/CD pipelines
- **Needs:** API access, scan automation, cost optimization
- **Pain:** Security tools that don't integrate with dev workflows

### P4: Security Manager
- **Role:** Reports on compliance and risk posture to leadership
- **Needs:** Compliance dashboards, risk trends, export reports
- **Pain:** Manual compliance evidence collection

### P5: Viewer / Jury Demo User
- **Role:** Evaluates the system during hackathon demo
- **Needs:** Clear evidence, traceable data, honest labeling of demo vs real data
- **Pain:** Systems that look impressive but can't answer "show me the data"

---

## 4. User Journeys

### J1: First-Time Setup
Landing → Register → Login → Setup wizard → Add first data source → Dashboard

### J2: Cloud Connection
Dashboard → Data Sources → Add AWS → Enter read-only credentials → Validate → Discover resources → Sync to database → Run initial scan → View findings

### J3: Data Upload
Dashboard → Data Sources → Upload → Select JSON/CSV → Validate schema → Preview data → Import → Resources persisted → Scan triggered → Findings generated

### J4: Resource Scan
Dashboard → Scan Now → Rule engine evaluates resources → Findings created → ML predictions generated → Risk scores calculated → AI analysis on critical findings → Dashboard updated

### J5: Finding Investigation
Findings list → Click finding → Evidence panel (resource config, rule matched, ML score, baseline comparison) → Data lineage trace → Remediation recommendation

### J6: ML Anomaly Investigation
ML Analytics → Anomaly timeline → Click anomaly → Feature values + model version + threshold + baseline → Explain why flagged → Linked findings

### J7: AI Analysis
Finding detail → Request AI analysis → Gemini receives structured evidence → Response validated → Threat summary + recommended actions displayed → Evidence strength indicator

### J8: Incident Handling
Critical finding detected → Incident created automatically → Investigation view → Evidence aggregation → Assign to analyst → Containment actions → Resolution

### J9: Remediation
Finding → Remediation panel → Dry-run preview → User approves → Action executed → Rescan triggered → Before/after comparison → Finding resolved → Audit log entry

### J10: Compliance Review
Compliance page → Select framework (CIS/SOC2/etc.) → View controls → Pass/fail backed by findings → Evidence links → Export compliance report

---

## 5. Functional Requirements

### Authentication & Authorization

| ID | Description | Priority | Acceptance Criteria |
|----|-------------|----------|-------------------|
| FR-001 | User registration with email/password | P0 | User created in database, password hashed with Argon2id |
| FR-002 | User login with JWT token | P0 | Valid credentials return access token; invalid return 401 |
| FR-003 | Role-based access control (ADMIN, SECURITY_ANALYST, VIEWER) | P0 | API endpoints enforce role permissions; VIEWER cannot modify |
| FR-004 | Failed login tracking and throttling | P1 | After 5 failures, account locked for 15 minutes |
| FR-005 | Logout / token revocation | P0 | Token invalidated on logout |

### Data Sources & Ingestion

| ID | Description | Priority | Acceptance Criteria |
|----|-------------|----------|-------------------|
| FR-010 | Connect read-only AWS account | P1 | User enters credentials, backend validates, resources discovered and persisted with source_type=LIVE_AWS |
| FR-011 | Connect read-only Azure subscription | P2 | Same as FR-010 with source_type=LIVE_AZURE |
| FR-012 | Connect read-only GCP project | P2 | Same as FR-010 with source_type=LIVE_GCP |
| FR-013 | Upload JSON resource data | P0 | File validated, parsed, normalized, stored with source_type=USER_UPLOAD |
| FR-014 | Upload CSV resource data | P0 | Same as FR-013 for CSV format |
| FR-015 | Data provenance tracking | P0 | Every record has source_id, source_type, ingested_at, is_simulated |
| FR-016 | Demo mode with isolated synthetic data | P0 | Demo data marked is_simulated=true, source_type=DEMO; UI shows "DEMO MODE" badge |
| FR-017 | No-data rule enforcement | P0 | When no data exists, dashboard shows "No cloud data connected" with action buttons |

### Security Scanning

| ID | Description | Priority | Acceptance Criteria |
|----|-------------|----------|-------------------|
| FR-020 | Rule engine with 25+ security rules | P0 | Rules migrated from MVP, execute on persisted resources, create findings with evidence |
| FR-021 | Scan on demand | P0 | User clicks "Scan Now", rule engine runs, findings stored in database |
| FR-022 | Findings with full evidence | P0 | Each finding links to rule, resource, configuration snapshot, and compliance mapping |
| FR-023 | Change detection (snapshot comparison) | P1 | Compare current vs previous resource snapshots, detect configuration changes |

### ML Engine

| ID | Description | Priority | Acceptance Criteria |
|----|-------------|----------|-------------------|
| FR-030 | Isolation Forest anomaly detection | P0 | Real scikit-learn model, trained on feature vectors, produces actual scores |
| FR-031 | Feature extraction from resources/events | P0 | Defined feature set, extracted and stored per prediction |
| FR-032 | ML explainability | P0 | Each prediction shows model version, features, values, score, threshold |
| FR-033 | Baseline engine | P1 | Per-environment baselines tracking behavioral patterns; LEARNING state when insufficient data |
| FR-034 | Model versioning | P0 | Each ML model tracked with version, training date, dataset, metrics |

### AI Analysis

| ID | Description | Priority | Acceptance Criteria |
|----|-------------|----------|-------------------|
| FR-040 | Gemini-powered threat analysis | P0 | Structured evidence sent to Gemini, response validated with Pydantic |
| FR-041 | Evidence contract enforcement | P0 | Gemini receives only resource/config/rules/findings/ML/baseline/risk |
| FR-042 | AI fallback on failure | P0 | If Gemini fails, retry once, then use local deterministic fallback |
| FR-043 | INSUFFICIENT_EVIDENCE handling | P0 | AI returns INSUFFICIENT_EVIDENCE when data is lacking, not fabricated analysis |
| FR-044 | Prompt injection defense | P0 | Cloud metadata separated from system instructions; untrusted data never becomes prompts |

### Risk Engine

| ID | Description | Priority | Acceptance Criteria |
|----|-------------|----------|-------------------|
| FR-050 | Deterministic risk scoring (0-100) | P0 | Formula: 40% Rules + 30% ML + 20% Criticality + 10% Context |
| FR-051 | Configurable weights | P1 | Admin can adjust risk weight percentages |
| FR-052 | Risk score explainability | P0 | Dashboard shows score contributors, not just a number |

### Incidents & Remediation

| ID | Description | Priority | Acceptance Criteria |
|----|-------------|----------|-------------------|
| FR-060 | Incident creation from findings | P0 | Incidents linked to findings, risk scores, evidence, AI analysis |
| FR-061 | Remediation dry-run | P0 | Default mode shows what would change without executing |
| FR-062 | Before/after remediation proof | P0 | Snapshot comparison showing configuration change |
| FR-063 | Rescan after remediation | P0 | Automated rescan verifies finding resolution |

### Compliance & Cost

| ID | Description | Priority | Acceptance Criteria |
|----|-------------|----------|-------------------|
| FR-070 | Compliance mapping (CIS, SOC2, HIPAA, PCI DSS, NIST 800-53, GDPR) | P0 | Each control status backed by findings, not hardcoded |
| FR-071 | Cost optimization detection | P0 | Identify idle resources, unattached volumes, unused IPs |
| FR-072 | Cost estimates vs actual billing | P1 | Clearly labeled ESTIMATED when billing API unavailable |

### Audit & Observability

| ID | Description | Priority | Acceptance Criteria |
|----|-------------|----------|-------------------|
| FR-080 | Audit logging of all security operations | P0 | LOGIN, SCAN, RULE_TRIGGERED, ML_PREDICTION, AI_ANALYSIS, REMEDIATION logged |
| FR-081 | Health endpoint | P0 | GET /api/health returns status of backend, database, ML, AI, cloud connectors |
| FR-082 | Structured logging with request IDs | P1 | Every request has unique ID traceable through logs |

---

## 6. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Security** | AES-256-GCM for sensitive data; Argon2id for passwords; no secrets in code/logs |
| **Performance** | Dashboard loads in <3s; API responses <500ms; Gemini called only for high-risk |
| **Auditability** | Every finding traceable to data source; every score explainable |
| **Accessibility** | Keyboard navigation, semantic HTML, ARIA labels, contrast compliance |
| **Maintainability** | Modular architecture, typed schemas, comprehensive tests |
| **Privacy** | Cloud credentials never logged or sent to AI; encrypted at rest |
| **Observability** | Structured JSON logs, health checks, error tracking |
