# CloudGuard AI — Data Lineage & Provenance Flow

**Version:** 2.0  
**Core Objective:** Full Traceability from Raw Telemetry to Self-Healing Action  

---

## 1. End-to-End Data Pipeline Flow

```
[Raw Ingestion]
CloudTrail / S3 / EC2 Config / VPC Flow Logs
       │
       ▼
[Normalization & Storage]
CloudResource & TelemetryLog (Tagged with is_simulated flag)
       │
       ├─────────────────────────────────┐
       ▼                                 ▼
[Deterministic Rule Engine]       [ML Isolation Forest]
26+ CIS/PCI Security Rules        Anomaly Score & Velocity Deviations
       │                                 │
       ▼                                 ▼
[Security Finding & Evidence]     [Anomaly Event]
Raw JSON Snippet + Hash           Feature Vector + Contributing Factors
       │                                 │
       └────────────────┬────────────────┘
                        │
                        ▼
            [Correlated Incident]
            Multi-Vector Attack Graph & Blast Radius
                        │
                        ▼
            [Gemini AI Inference]
            Root Cause, MITRE ATT&CK, Containment Steps
                        │
                        ▼
            [Remediation Plan]
            CLI / Terraform / Python Code Package
                        │
                        ▼
            [Verification Re-Scan]
            Pass / Fail Proof of Elimination
                        │
                        ▼
            [Chained Audit Log]
            SHA-256 Tamper-Evident Ledger
```
