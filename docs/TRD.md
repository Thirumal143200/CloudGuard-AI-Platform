# CloudGuard AI — Technical Requirements Document (TRD)

**Version:** 2.0  
**Date:** 2026-09-22  

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React + Vite)                   │
│  TypeScript │ CSS Design System │ Chart.js │ React Router        │
├─────────────────────────────────────────────────────────────────┤
│                        REST API (HTTPS/JSON)                     │
├─────────────────────────────────────────────────────────────────┤
│                    Backend (Python FastAPI)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │Auth/RBAC │ │Rule Eng. │ │ML Engine │ │ Gemini AI Service│   │
│  │Argon2id  │ │25+ Rules │ │IsoForest │ │ Evidence Contract│   │
│  │JWT       │ │Evidence  │ │Features  │ │ Pydantic Valid.  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │Risk Eng. │ │Baseline  │ │Ingestion │ │ Cloud Adapters   │   │
│  │40/30/20  │ │Profiles  │ │JSON/CSV  │ │ AWS/Azure/GCP    │   │
│  │/10 wts   │ │Learning  │ │Validate  │ │ Read-Only        │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────────────┐    │
│  │Encrypt   │ │Audit Log │ │ Incident + Remediation       │    │
│  │AES-256   │ │Structured│ │ Dry-Run + Rescan + Proof     │    │
│  └──────────┘ └──────────┘ └──────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│               Database (SQLite/PostgreSQL + SQLAlchemy)           │
│               Alembic Migrations │ 25+ Normalized Tables         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Choices

### 2.1 Backend: Python + FastAPI

**WHY?**
- Python is the only language where scikit-learn (ML), google-genai (Gemini), boto3 (AWS), and azure SDK all exist natively
- FastAPI provides automatic OpenAPI docs, Pydantic validation (critical for AI output validation), async support
- Fastest Python web framework for our API-heavy architecture
- Type hints enable better code quality and IDE support

**Alternatives considered:**
- Node.js/Express — no native scikit-learn, would need Python subprocess for ML
- Django — heavier, more opinionated, slower API performance
- Flask — less built-in validation, no auto-generated API docs

### 2.2 Database: SQLite (dev) / PostgreSQL (prod)

**WHY?**
- SQLite: zero-config for hackathon demo, no separate process needed
- PostgreSQL: production-grade with JSONB support for resource configs
- SQLAlchemy ORM works with both transparently
- Alembic provides schema migration versioning

**WHY NOT MongoDB?**
- Security findings need relational integrity (finding → rule → resource → source)
- Compliance mappings are inherently relational
- Audit trails require ACID guarantees
- Data lineage queries are join-heavy

### 2.3 Frontend: React + Vite

**WHY?**
- Component architecture maps to our 20+ page requirement
- Vite provides instant HMR during development
- Rich ecosystem for charts (Chart.js), tables, forms
- The existing MVP CSS design system ports cleanly to React components

**WHY NOT vanilla JS (like MVP)?**
- 20+ pages with complex state (auth, filters, data sources) exceeds vanilla JS maintainability
- React Router handles multi-page navigation
- Component reuse for design system (Button, Card, Table, Modal, etc.)

### 2.4 ML: scikit-learn Isolation Forest

**WHY?**
- Isolation Forest is the standard algorithm for unsupervised anomaly detection
- No labeled attack data needed — learns "normal" and flags deviations
- Fast training and prediction (sub-second for our data volumes)
- scikit-learn provides model serialization (joblib), feature importance, and explainability
- Well-understood by technical jury

**WHY NOT deep learning?**
- Our data volumes (hundreds to low thousands of resources) are too small for neural networks
- Isolation Forest is more interpretable — critical for "show me why this is anomalous"
- Training is deterministic and reproducible

### 2.5 AI: Google Gemini (gemini-2.0-flash)

**WHY?**
- Flash model is cost-efficient for analysis tasks
- Supports structured output (JSON mode) for reliable parsing
- google-genai Python SDK provides clean integration
- Pydantic validation ensures AI outputs conform to expected schema

**WHY FLASH, NOT PRO?**
- Flash is 10x cheaper per token
- Our prompts are structured evidence (not creative tasks) — Flash handles these well
- Response time is faster (critical for interactive demo)

### 2.6 Authentication: Argon2id + JWT

**WHY ARGON2ID?**
- Winner of the Password Hashing Competition
- Memory-hard: resistant to GPU/ASIC attacks
- Recommended by OWASP over bcrypt for new applications

**WHY JWT?**
- Stateless authentication for API-first architecture
- No session storage needed on backend
- Standard support in React and FastAPI

### 2.7 Encryption: AES-256-GCM

**WHY?**
- Authenticated encryption: provides both confidentiality and integrity
- GCM mode: parallelizable, fast, with built-in authentication tag
- 256-bit key: meets all compliance requirements (HIPAA, PCI DSS, NIST)
- Standard library support in Python (cryptography package)

---

## 3. API Architecture

RESTful JSON APIs with:
- Pydantic request/response validation
- JWT Bearer token authentication
- Role-based authorization middleware
- Request ID tracking (X-Request-ID header)
- Structured error responses with error codes
- Pagination (limit/offset) on list endpoints
- Filtering and sorting query parameters
- Rate limiting on auth endpoints

### API Groups

| Group | Base Path | Description |
|-------|-----------|-------------|
| Auth | /api/auth | Login, register, logout, refresh |
| Users | /api/users | User management (admin) |
| Cloud | /api/cloud | Cloud account connections |
| Data Sources | /api/data-sources | Source management, sync |
| Resources | /api/resources | Cloud resource CRUD |
| Findings | /api/findings | Security findings |
| Rules | /api/rules | Security rule definitions |
| ML | /api/ml | ML models, predictions, anomalies |
| AI | /api/ai | Gemini analysis requests |
| Risk | /api/risk | Risk assessments |
| Incidents | /api/incidents | Incident management |
| Remediation | /api/remediation | Remediation actions |
| Compliance | /api/compliance | Compliance frameworks/controls |
| Cost | /api/cost | Cost optimization findings |
| Audit | /api/audit | Audit log retrieval |
| Scans | /api/scans | Scan management |
| Ingestion | /api/ingestion | Data upload/import |
| Dashboard | /api/dashboard | Aggregated metrics |
| Health | /api/health | System health check |

---

## 4. Security Controls

| Control | Implementation |
|---------|---------------|
| Password storage | Argon2id hash (never reversible) |
| Sensitive data at rest | AES-256-GCM encryption |
| API authentication | JWT with expiration |
| Authorization | RBAC middleware (ADMIN, SECURITY_ANALYST, VIEWER) |
| Cloud credentials | Environment variables only, never logged/stored in DB/AI prompts |
| Input validation | Pydantic schemas on all endpoints |
| Rate limiting | 5 req/min on auth endpoints |
| CORS | Restricted to frontend origin |
| Prompt injection | System/evidence/output separation |
| Secret management | .env files, never committed |
| SQL injection | SQLAlchemy parameterized queries |

---

## 5. Logging & Monitoring

- **Structured JSON logging** via Python `logging` + `structlog`
- **Request IDs** generated per request, propagated through call chain
- **Health endpoint** at `/api/health` reporting: backend, database, ML, AI, cloud connectors
- **Audit log** in database for security-sensitive operations
- **Never log**: passwords, API keys, JWT secrets, encryption keys, cloud credentials

---

## 6. Deployment

| Component | Technology |
|-----------|-----------|
| Containerization | Docker + docker-compose |
| Backend | Python 3.11+ / uvicorn |
| Frontend | Node.js 18+ / Vite build |
| Database | SQLite (dev) / PostgreSQL 15+ (prod) |
| CI/CD | GitHub Actions |
| Environment | .env file with all secrets |
