# CloudGuard AI — Migration & Upgrade Documentation

**Version:** 2.0  
**Context:** Migration from v1.0 Client-Only MVP to v2.0 Enterprise Cloud Security Platform  

---

## 1. What was Retained & Upgraded from v1.0

1. **Design System & Visual Language:**
   - Retained the dark-mode cyber command palette (`#0a0e1a`, `#111827`, `#00f5ff`, `#3b82f6`).
   - Upgraded to modern responsive layout with live drawers, charts, and real-time state synchronization.

2. **Security Rule Logic:**
   - Migrated 25+ browser-side static rules into server-side Python `rule_engine.py` with formal CIS benchmark and PCI-DSS control tags.

3. **Risk Scoring Philosophy:**
   - Replaced single static numbers with the evidence-driven **4-Pillar Mathematical Formula** (40% Severity, 30% Reachability, 20% Criticality, 10% ML Anomaly).

---

## 2. What was Newly Built in v2.0

1. **Real FastAPI Backend:** Replaced client-side mocks with 25+ REST API endpoints.
2. **Normalized SQL Database:** Implemented 15+ relational ORM tables using SQLAlchemy.
3. **Machine Learning Anomaly Engine:** Integrated real scikit-learn Isolation Forest telemetry modeling.
4. **Google Gemini GenAI Integration:** Integrated live Gemini 2.5 Flash for contextual threat analysis with deterministic offline fallbacks.
5. **Verified Self-Healing Engine:** Automated CLI/Terraform remediation generation, zero-risk dry runs, and post-execution verification re-scans.
6. **Tamper-Evident Audit Ledger:** Cryptographically chained SHA-256 audit log system.
