# CloudGuard AI — System Architecture Document

**Version:** 2.0  
**Status:** Approved  
**Author:** CloudGuard Principal Systems Architect  

---

## 1. High-Level Architecture Topology

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             PRESENTATION LAYER                              │
│  React 18 + Vite SPA | Cyber Command Theme | Evidence Drawers | Charts       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTPS / WSS / REST API
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                            FASTAPI BACKEND CORE                             │
│                                                                             │
│  ┌───────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐  │
│  │   Auth & RBAC Service │  │ Cloud Ingestion Engine│  │ Security Rule Eng│  │
│  │   (JWT + PBKDF2)      │  │ (Multi-Cloud Assets)  │  │ (26+ CIS/PCI)    │  │
│  └───────────────────────┘  └──────────────────────┘  └──────────────────┘  │
│  ┌───────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐  │
│  │   ML Anomaly Engine   │  │  4-Pillar Risk Engine │  │ Gemini AI Service│  │
│  │  (Isolation Forest)   │  │   (40/30/20/10)       │  │ (GenAI & Fallback│  │
│  └───────────────────────┘  └──────────────────────┘  └──────────────────┘  │
│  ┌───────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐  │
│  │  Remediation & Rescan │  │ Tamper-Evident Audit │  │ Compliance Eval  │  │
│  │ (CLI/Terraform/Script)│  │ (SHA-256 Hash Chain) │  │ (CIS/PCI/SOC2)   │  │
│  └───────────────────────┘  └──────────────────────┘  └──────────────────┘  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                              PERSISTENCE LAYER                              │
│  PostgreSQL / SQLite 3 | SQLAlchemy ORM | 15 Normalized Relational Tables   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Subsystems & Responsibilities

### 1. Ingestion Subsystem
- Ingests structured JSON/CSV telemetry and resource inventory from AWS, Azure, GCP, and Kubernetes.
- Normalizes configurations into a standardized JSON payload structure.
- Tracks `is_simulated` provenance flags on all synthetic telemetry.

### 2. Multi-Cloud Rule Engine
- Evaluates 26+ deterministic security rules mapped to CIS Benchmarks and PCI-DSS requirements.
- Performs zero-side-effect static analysis on asset configurations.
- Generates structured findings containing exact technical evidence snippets.

### 3. ML Anomaly Subsystem
- Extracts 6-dimensional telemetry feature vectors (hour, off-hours flag, risk tier, error rate, IP novelty, privilege intent).
- Trains Isolation Forest models on baseline normal behavioral clusters.
- Flags deviations and correlates anomaly scores directly into incident triage.

### 4. 4-Pillar Risk Engine
- Mathematical composite scoring formula:
  $$\text{Risk} = (0.40 \times \text{Severity}) + (0.30 \times \text{Reachability}) + (0.20 \times \text{Asset Criticality}) + (0.10 \times \text{ML Anomaly})$$
- Deterministic, verifiable, explainable without black-box opacity.

### 5. Google Gemini AI Subsystem
- Utilizes Google Gemini 2.5 Flash with structured JSON schema outputs.
- Produces root cause analysis, blast radius projections, and MITRE ATT&CK mappings.
- Fully decoupled with deterministic fallback to guarantee uninterrupted execution.

### 6. Remediation & Verification Subsystem
- Multi-format code generation (AWS/Azure CLI, Terraform HCL, Python Boto3).
- Dry-run validation capability with zero state mutations.
- Immediate automated verification re-scan to prove vulnerability mitigation.

### 7. Tamper-Evident Audit Logging Subsystem
- Append-only cryptographic ledger linking every user and automated action via SHA-256 hash chains.
- Continuous integrity checking endpoint to verify ledger immutability.
