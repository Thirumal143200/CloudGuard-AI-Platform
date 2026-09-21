# CloudGuard AI — Backend Schema & Data Models Specification

**Version:** 2.0  
**ORM Framework:** SQLAlchemy 2.0 (Declarative Mapping)  
**Pydantic Engine:** Pydantic v2  

---

## 1. ORM Entity Model Mapping

| Table Name | Model Class | Key Fields & Types | Indexes & Constraints |
|---|---|---|---|
| `users` | `User` | `id (PK)`, `email (Unique)`, `hashed_password`, `role (Enum)`, `is_active`, `is_locked` | Unique index on `email` |
| `cloud_accounts` | `CloudAccount` | `id (PK)`, `name`, `provider (Enum)`, `account_id`, `environment` | Unique composite `(provider, account_id)` |
| `cloud_resources` | `CloudResource` | `id (PK)`, `cloud_account_id (FK)`, `native_id`, `resource_type`, `configuration (JSON)` | Index on `cloud_account_id`, `provider` |
| `findings` | `Finding` | `id (PK)`, `rule_id (FK)`, `resource_id (FK)`, `severity (Enum)`, `status (Enum)`, `raw_evidence (JSON)` | Indexes on `(account_id, severity)`, `(account_id, status)` |
| `security_rules` | `SecurityRule` | `id (PK)`, `name`, `category (Enum)`, `default_severity (Enum)`, `framework_mappings (JSON)` | Index on `category`, `provider` |
| `incidents` | `Incident` | `id (PK)`, `title`, `severity (Enum)`, `status (Enum)`, `mitre_attack_tactics (JSON)` | Index on `status`, `cloud_account_id` |
| `remediation_plans` | `RemediationPlan` | `id (PK)`, `finding_id (FK)`, `status (Enum)`, `risk_tier (Enum)`, `cli_commands (JSON)` | Index on `finding_id`, `status` |
| `telemetry_logs` | `TelemetryLog` | `id (PK)`, `source_type (Enum)`, `event_name`, `source_ip`, `is_anomalous`, `raw_payload (JSON)` | Index on `event_timestamp`, `is_anomalous` |
| `anomaly_events` | `AnomalyEvent` | `id (PK)`, `detector_name`, `anomaly_score (Float)`, `top_contributing_features (JSON)` | Index on `cloud_account_id` |
| `audit_logs` | `AuditLog` | `id (PK)`, `sequence_number (Unique)`, `action (Enum)`, `previous_hash`, `current_hash` | Unique index on `current_hash`, `sequence_number` |
| `compliance_frameworks` | `ComplianceFramework` | `id (PK)`, `name`, `version`, `total_controls` | Primary key on `id` |
| `gemini_audit_logs` | `GeminiAuditLog` | `id (PK)`, `category (Enum)`, `model_name`, `system_prompt`, `user_prompt`, `raw_response` | Index on `target_entity_id` |
