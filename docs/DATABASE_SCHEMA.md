# CloudGuard AI — Database Schema

## Entity-Relationship Overview

```
User ─────────────┐
  │ has_role       │ creates
  ▼                ▼
Role            AuditLog
                   │
CloudAccount ──────┤ linked
  │ has_sources    │
  ▼                │
DataSource ────────┤
  │ has_jobs       │
  ▼                │
IngestionJob       │
  │ creates        │
  ▼                │
CloudResource ─────┤
  │ has_snapshots  │
  ▼                │
ResourceSnapshot   │
  │ scanned_by     │
  ▼                │
SecurityRule ──────┤
  │ triggers       │
  ▼                │
Finding ───────────┤
  │ analyzed_by    │
  ├─→ MLPrediction │
  ├─→ RiskAssess.  │
  ├─→ AIAnalysis   │
  ├─→ Incident     │
  └─→ Remediation  │
       │ produces   │
       ▼            │
  ScanResult ───────┘
```

## Tables

### users
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique user identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email |
| username | VARCHAR(100) | UNIQUE, NOT NULL | Display name |
| password_hash | VARCHAR(255) | NOT NULL | Argon2id hash |
| role | ENUM | NOT NULL, DEFAULT 'VIEWER' | ADMIN, SECURITY_ANALYST, VIEWER |
| is_active | BOOLEAN | DEFAULT true | Account active status |
| failed_login_count | INTEGER | DEFAULT 0 | Failed login attempts |
| locked_until | TIMESTAMP | NULLABLE | Account lock expiry |
| created_at | TIMESTAMP | NOT NULL | Account creation |
| updated_at | TIMESTAMP | NOT NULL | Last modification |

### cloud_accounts
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Account identifier |
| user_id | UUID | FK→users | Owner |
| provider | ENUM | NOT NULL | AWS, AZURE, GCP |
| account_identifier | VARCHAR(255) | NOT NULL | AWS Account ID / Azure Sub / GCP Project |
| display_name | VARCHAR(255) | NOT NULL | User-friendly name |
| credentials_encrypted | TEXT | NULLABLE | AES-256-GCM encrypted credentials |
| status | ENUM | DEFAULT 'PENDING' | PENDING, ACTIVE, FAILED, DISCONNECTED |
| last_synced_at | TIMESTAMP | NULLABLE | Last successful sync |
| created_at | TIMESTAMP | NOT NULL | Created |
| updated_at | TIMESTAMP | NOT NULL | Updated |

### data_sources
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Source identifier |
| name | VARCHAR(255) | NOT NULL | Source name |
| source_type | ENUM | NOT NULL | LIVE_AWS, LIVE_AZURE, LIVE_GCP, USER_UPLOAD, API_INGESTION, DEMO |
| provider | ENUM | NULLABLE | AWS, AZURE, GCP, MULTI |
| cloud_account_id | UUID | FK→cloud_accounts, NULLABLE | Linked account |
| region | VARCHAR(100) | NULLABLE | Cloud region |
| collection_method | VARCHAR(100) | NOT NULL | API, UPLOAD, DEMO_GENERATOR |
| is_simulated | BOOLEAN | DEFAULT false | Demo/synthetic data flag |
| schema_version | VARCHAR(20) | DEFAULT '1.0' | Schema version |
| resource_count | INTEGER | DEFAULT 0 | Number of resources |
| event_count | INTEGER | DEFAULT 0 | Number of events |
| status | ENUM | DEFAULT 'ACTIVE' | ACTIVE, PAUSED, ERROR, DISCONNECTED |
| last_synced_at | TIMESTAMP | NULLABLE | Last sync |
| created_at | TIMESTAMP | NOT NULL | Created |
| updated_at | TIMESTAMP | NOT NULL | Updated |

### ingestion_jobs
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Job identifier |
| data_source_id | UUID | FK→data_sources | Source |
| job_type | ENUM | NOT NULL | FULL_SYNC, INCREMENTAL, UPLOAD |
| status | ENUM | DEFAULT 'PENDING' | PENDING, RUNNING, COMPLETED, FAILED |
| records_processed | INTEGER | DEFAULT 0 | Records processed |
| records_failed | INTEGER | DEFAULT 0 | Records failed |
| error_message | TEXT | NULLABLE | Error details |
| started_at | TIMESTAMP | NULLABLE | Start time |
| completed_at | TIMESTAMP | NULLABLE | End time |
| created_at | TIMESTAMP | NOT NULL | Created |

### cloud_resources
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Resource identifier |
| resource_id | VARCHAR(255) | NOT NULL | Cloud resource ID |
| name | VARCHAR(255) | NOT NULL | Resource name |
| provider | ENUM | NOT NULL | AWS, AZURE, GCP |
| service | VARCHAR(100) | NOT NULL | EC2, S3, IAM, etc. |
| resource_type | VARCHAR(100) | NOT NULL | Compute, Storage, etc. |
| region | VARCHAR(100) | NOT NULL | Cloud region |
| status | VARCHAR(50) | NOT NULL | running, stopped, etc. |
| configuration | JSON | NOT NULL | Full resource configuration |
| tags | JSON | NULLABLE | Resource tags |
| monthly_spend | DECIMAL(10,2) | NULLABLE | Monthly cost |
| utilization | INTEGER | NULLABLE | Utilization % |
| data_source_id | UUID | FK→data_sources | Data source |
| is_simulated | BOOLEAN | DEFAULT false | Synthetic flag |
| created_at | TIMESTAMP | NOT NULL | Created |
| updated_at | TIMESTAMP | NOT NULL | Updated |
| INDEX | | (provider, service) | Performance |
| INDEX | | (data_source_id) | Lookup |

### resource_snapshots
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Snapshot identifier |
| resource_id | UUID | FK→cloud_resources | Resource |
| configuration | JSON | NOT NULL | Config at snapshot time |
| scan_id | UUID | FK→scans, NULLABLE | Related scan |
| snapshot_at | TIMESTAMP | NOT NULL | Snapshot time |

### security_rules
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Rule identifier |
| rule_id | VARCHAR(100) | UNIQUE, NOT NULL | Human-readable rule ID |
| name | VARCHAR(255) | NOT NULL | Rule name |
| description | TEXT | NOT NULL | Rule description |
| category | ENUM | NOT NULL | DATA_EXPOSURE, ENCRYPTION, NETWORK_EXPOSURE, IDENTITY, DATA_PROTECTION, MONITORING, CONTAINER_SECURITY, MAINTENANCE, COST_WASTE |
| severity | ENUM | NOT NULL | CRITICAL, HIGH, MEDIUM, LOW, INFO |
| condition_logic | TEXT | NOT NULL | Rule condition description |
| remediation | TEXT | NOT NULL | Remediation steps |
| compliance_mappings | JSON | NOT NULL | Array of framework IDs |
| is_active | BOOLEAN | DEFAULT true | Rule active |
| created_at | TIMESTAMP | NOT NULL | Created |

### findings
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Finding identifier |
| resource_id | UUID | FK→cloud_resources | Affected resource |
| rule_id | UUID | FK→security_rules | Triggered rule |
| scan_id | UUID | FK→scans, NULLABLE | Scan that found it |
| severity | ENUM | NOT NULL | CRITICAL, HIGH, MEDIUM, LOW, INFO |
| title | VARCHAR(500) | NOT NULL | Finding title |
| description | TEXT | NOT NULL | Detailed description |
| evidence | JSON | NOT NULL | Evidence data |
| status | ENUM | DEFAULT 'OPEN' | OPEN, ACKNOWLEDGED, IN_PROGRESS, RESOLVED, FALSE_POSITIVE |
| is_simulated | BOOLEAN | DEFAULT false | From demo data |
| resolved_at | TIMESTAMP | NULLABLE | Resolution time |
| created_at | TIMESTAMP | NOT NULL | Created |
| updated_at | TIMESTAMP | NOT NULL | Updated |
| INDEX | | (severity, status) | Filtering |
| INDEX | | (resource_id) | Lookup |

### ml_models
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Model identifier |
| name | VARCHAR(255) | NOT NULL | Model name |
| version | VARCHAR(50) | NOT NULL | Version string |
| algorithm | VARCHAR(100) | NOT NULL | e.g., IsolationForest |
| parameters | JSON | NOT NULL | Hyperparameters |
| features | JSON | NOT NULL | Feature list |
| training_dataset_info | JSON | NOT NULL | Dataset metadata |
| training_date | TIMESTAMP | NOT NULL | Training time |
| sample_count | INTEGER | NOT NULL | Training samples |
| threshold | FLOAT | NOT NULL | Anomaly threshold |
| metrics | JSON | NULLABLE | Performance metrics |
| model_path | VARCHAR(500) | NOT NULL | Serialized model path |
| is_active | BOOLEAN | DEFAULT true | Active model |
| created_at | TIMESTAMP | NOT NULL | Created |

### ml_predictions
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Prediction identifier |
| model_id | UUID | FK→ml_models | Model used |
| resource_id | UUID | FK→cloud_resources, NULLABLE | Related resource |
| features | JSON | NOT NULL | Feature values used |
| anomaly_score | FLOAT | NOT NULL | Raw anomaly score |
| threshold | FLOAT | NOT NULL | Threshold at prediction time |
| is_anomaly | BOOLEAN | NOT NULL | Anomaly classification |
| classification | ENUM | NOT NULL | NORMAL, ANOMALOUS, SUSPICIOUS |
| created_at | TIMESTAMP | NOT NULL | Prediction time |
| INDEX | | (is_anomaly, created_at) | Timeline queries |

### baseline_profiles
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Profile identifier |
| environment | VARCHAR(100) | NOT NULL | production, staging, etc. |
| metric_name | VARCHAR(255) | NOT NULL | What is tracked |
| baseline_value | FLOAT | NOT NULL | Baseline value |
| std_deviation | FLOAT | NOT NULL | Standard deviation |
| sample_count | INTEGER | NOT NULL | Samples used |
| status | ENUM | DEFAULT 'LEARNING' | LEARNING, ESTABLISHED, STALE |
| last_updated_at | TIMESTAMP | NOT NULL | Last update |
| created_at | TIMESTAMP | NOT NULL | Created |

### risk_assessments
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Assessment identifier |
| resource_id | UUID | FK→cloud_resources | Resource |
| overall_score | INTEGER | NOT NULL | 0-100 |
| rule_score | FLOAT | NOT NULL | Rule component |
| ml_score | FLOAT | NOT NULL | ML component |
| criticality_score | FLOAT | NOT NULL | Asset criticality |
| context_score | FLOAT | NOT NULL | Context component |
| weights | JSON | NOT NULL | Weight config used |
| factors | JSON | NOT NULL | Score contributors |
| risk_level | ENUM | NOT NULL | MINIMAL, LOW, MEDIUM, HIGH, CRITICAL |
| created_at | TIMESTAMP | NOT NULL | Created |

### ai_analyses
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Analysis identifier |
| finding_id | UUID | FK→findings, NULLABLE | Related finding |
| resource_id | UUID | FK→cloud_resources, NULLABLE | Related resource |
| model_used | VARCHAR(100) | NOT NULL | Gemini model version |
| evidence_sent | JSON | NOT NULL | What Gemini received |
| prompt_hash | VARCHAR(64) | NOT NULL | SHA-256 of prompt |
| response | JSON | NOT NULL | Validated AI output |
| threat_type | VARCHAR(255) | NULLABLE | Detected threat type |
| summary | TEXT | NULLABLE | Threat summary |
| evidence_strength | ENUM | NOT NULL | STRONG, MODERATE, WEAK, INSUFFICIENT |
| confidence | FLOAT | NOT NULL | 0.0-1.0 |
| is_fallback | BOOLEAN | DEFAULT false | Local fallback used |
| created_at | TIMESTAMP | NOT NULL | Created |

### incidents
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Incident identifier |
| title | VARCHAR(500) | NOT NULL | Incident title |
| severity | ENUM | NOT NULL | CRITICAL, HIGH, MEDIUM, LOW |
| risk_score | INTEGER | NOT NULL | Associated risk score |
| status | ENUM | DEFAULT 'OPEN' | OPEN, INVESTIGATING, CONTAINED, RESOLVED, CLOSED |
| description | TEXT | NOT NULL | Description |
| evidence | JSON | NOT NULL | Aggregated evidence |
| finding_ids | JSON | NOT NULL | Related finding UUIDs |
| resource_ids | JSON | NOT NULL | Related resource UUIDs |
| ai_analysis_id | UUID | FK→ai_analyses, NULLABLE | AI analysis |
| assigned_to | UUID | FK→users, NULLABLE | Assigned analyst |
| resolution | TEXT | NULLABLE | Resolution details |
| resolved_at | TIMESTAMP | NULLABLE | Resolution time |
| created_at | TIMESTAMP | NOT NULL | Created |
| updated_at | TIMESTAMP | NOT NULL | Updated |

### remediation_actions
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Action identifier |
| finding_id | UUID | FK→findings | Related finding |
| action_type | ENUM | NOT NULL | DRY_RUN, APPROVED, EXECUTED, ROLLED_BACK |
| description | TEXT | NOT NULL | What the action does |
| before_snapshot | JSON | NOT NULL | Config before |
| after_snapshot | JSON | NULLABLE | Config after |
| approved_by | UUID | FK→users, NULLABLE | Approver |
| executed_at | TIMESTAMP | NULLABLE | Execution time |
| rescan_triggered | BOOLEAN | DEFAULT false | Rescan triggered |
| rescan_result | ENUM | NULLABLE | RESOLVED, PARTIALLY_RESOLVED, UNRESOLVED |
| created_at | TIMESTAMP | NOT NULL | Created |

### compliance_frameworks
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Framework identifier |
| framework_id | VARCHAR(50) | UNIQUE, NOT NULL | cis, soc2, hipaa, etc. |
| name | VARCHAR(255) | NOT NULL | Full name |
| version | VARCHAR(50) | NOT NULL | Version |
| description | TEXT | NULLABLE | Description |

### compliance_results
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Result identifier |
| framework_id | UUID | FK→compliance_frameworks | Framework |
| scan_id | UUID | FK→scans, NULLABLE | Related scan |
| total_controls | INTEGER | NOT NULL | Total controls |
| passed_controls | INTEGER | NOT NULL | Passed |
| failed_controls | INTEGER | NOT NULL | Failed |
| score | INTEGER | NOT NULL | 0-100 |
| status | ENUM | NOT NULL | COMPLIANT, PARTIALLY_COMPLIANT, NON_COMPLIANT |
| details | JSON | NOT NULL | Control-level details |
| created_at | TIMESTAMP | NOT NULL | Created |

### cost_findings
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Finding identifier |
| resource_id | UUID | FK→cloud_resources | Resource |
| finding_type | VARCHAR(100) | NOT NULL | idle_resource, unattached_volume, etc. |
| description | TEXT | NOT NULL | Description |
| current_monthly_cost | DECIMAL(10,2) | NOT NULL | Current cost |
| estimated_savings | DECIMAL(10,2) | NOT NULL | Potential savings |
| is_estimated | BOOLEAN | DEFAULT true | ESTIMATED vs ACTUAL |
| recommendation | TEXT | NOT NULL | Action recommendation |
| created_at | TIMESTAMP | NOT NULL | Created |

### scans
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Scan identifier |
| data_source_id | UUID | FK→data_sources, NULLABLE | Source scanned |
| scan_type | ENUM | NOT NULL | MANUAL, SCHEDULED, RESCAN |
| status | ENUM | DEFAULT 'PENDING' | PENDING, RUNNING, COMPLETED, FAILED |
| resources_scanned | INTEGER | DEFAULT 0 | Resources processed |
| findings_created | INTEGER | DEFAULT 0 | New findings |
| findings_resolved | INTEGER | DEFAULT 0 | Resolved findings |
| started_at | TIMESTAMP | NULLABLE | Start |
| completed_at | TIMESTAMP | NULLABLE | End |
| created_at | TIMESTAMP | NOT NULL | Created |

### audit_logs
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Log identifier |
| user_id | UUID | FK→users, NULLABLE | Acting user |
| action | ENUM | NOT NULL | LOGIN, FAILED_LOGIN, SCAN, RULE_TRIGGERED, etc. |
| resource_type | VARCHAR(100) | NULLABLE | Affected entity type |
| resource_id | VARCHAR(255) | NULLABLE | Affected entity ID |
| details | JSON | NULLABLE | Additional context |
| ip_address | VARCHAR(45) | NULLABLE | Client IP |
| request_id | VARCHAR(100) | NULLABLE | Request tracking ID |
| created_at | TIMESTAMP | NOT NULL | Timestamp |
| INDEX | | (action, created_at) | Filtering |
| INDEX | | (user_id, created_at) | User activity |

## Design Principles

1. **Normalized relational structure** — no "everything in one JSON field"
2. **Foreign keys with referential integrity** — findings → rules → resources → sources
3. **Timestamps on everything** — created_at, updated_at
4. **is_simulated flag** on all data-bearing entities — never mix demo with real
5. **Soft-delete** via status fields (not physical deletion)
6. **JSON columns** only for genuinely variable data (configs, tags, evidence)
7. **Indexes** on frequently queried columns
8. **UUIDs** as primary keys for distributed-safety
