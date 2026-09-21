# CloudGuard AI — Evidence-Driven Multi-Cloud Security & Self-Healing Platform

**SRIJAN Hackathon 2026 | Enterprise Cybersecurity Track**  
**Lead Architecture & Engineering**  

---

## 🌟 Executive Summary

**CloudGuard AI** is a production-grade, multi-cloud automated security posture management (CSPM) and self-healing platform. It eliminates alert fatigue and AI hallucination through:
1. **Deterministic 26+ CIS Benchmark & PCI-DSS Rule Engine** with exact technical JSON evidence extraction.
2. **Real scikit-learn Isolation Forest ML Anomaly Detector** flagging behavioral deviations across CloudTrail and VPC Flow Logs.
3. **Evidence-Driven 4-Pillar Risk Engine** ($40\%$ Severity + $30\%$ Reachability + $20\%$ Criticality + $10\%$ ML Anomaly).
4. **Google Gemini 2.5 Flash GenAI Integration** for root-cause isolation and MITRE ATT&CK mapping with deterministic offline fallbacks.
5. **Self-Healing Automation** generating AWS/Azure CLI, Terraform HCL, and Python Boto3 remediations with pre-execution dry runs and immediate verification re-scans.
6. **Tamper-Evident SHA-256 Chained Audit Ledger** guaranteeing verifiable compliance.

---

## 🚀 Quickstart Guide

### Option 1: Docker Compose (One-Click Production Run)
```bash
docker-compose up --build
```
- Frontend UI: `http://localhost:5173`
- Backend Swagger API Docs: `http://localhost:8000/docs`

### Option 2: Local Development
#### 1. Backend:
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### 2. Frontend:
```bash
cd frontend
npm install
npm run dev
```

---

## 🔑 Default Demo Credentials

| Role | Email | Password |
|---|---|---|
| **Lead Security Architect / Admin** | `admin@cloudguard.ai` | `Admin@CloudGuard2026!` |

*(A 1-click "Fill Demo Admin Credentials" button is also provided directly on the login screen).*

---

## 📂 Documentation Suite Directory

All engineering architecture documents are organized in `docs/`:
- [`PRD.md`](./docs/PRD.md) — Product Requirements Document
- [`TRD.md`](./docs/TRD.md) — Technical Requirements Document
- [`APP_FLOW.md`](./docs/APP_FLOW.md) — Application Flow & User Journeys
- [`UI_UX_DESIGN_BRIEF.md`](./docs/UI_UX_DESIGN_BRIEF.md) — UI/UX Design System
- [`BACKEND_SCHEMA.md`](./docs/BACKEND_SCHEMA.md) — Backend Models Specification
- [`DATABASE_SCHEMA.md`](./docs/DATABASE_SCHEMA.md) — Normalized 15-Table Relational Schema
- [`ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — System Architecture & Data Topologies
- [`SECURITY_ARCHITECTURE.md`](./docs/SECURITY_ARCHITECTURE.md) — Zero Trust, STRIDE & Crypto Chaining
- [`ML_DESIGN.md`](./docs/ML_DESIGN.md) — Isolation Forest & Anomaly Feature Vectors
- [`AI_DESIGN.md`](./docs/AI_DESIGN.md) — Gemini 2.5 Flash Prompting & Fallback Engine
- [`API_SPECIFICATION.md`](./docs/API_SPECIFICATION.md) — REST API Endpoints Catalog
- [`DATA_LINEAGE.md`](./docs/DATA_LINEAGE.md) — End-to-End Data Pipeline Provenance
- [`TEST_PLAN.md`](./docs/TEST_PLAN.md) — Verification & Test Strategy
- [`DEPLOYMENT_PLAN.md`](./docs/DEPLOYMENT_PLAN.md) — Deployment & Container Orchestration
- [`DEMO_SCRIPT.md`](./docs/DEMO_SCRIPT.md) — 5-Minute Hackathon Winning Demo Script
- [`MIGRATION.md`](./docs/MIGRATION.md) — v1.0 Client Prototype to v2.0 Platform Upgrade
