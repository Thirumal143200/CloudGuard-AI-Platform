# CloudGuard AI — Hackathon Jury Demo Script (5-Minute Winning Walkthrough)

**Target Audience:** SRIJAN Hackathon 2026 Evaluation Jury  
**Duration:** 5 Minutes  
**Goal:** Prove live, evidence-driven, end-to-end cloud security posture management and self-healing.  

---

## 1. Minute 0:00 - 1:00 — The Problem & Executive Posture

- **Visual:** Open CloudGuard AI Dashboard (`http://localhost:5173`).
- **Narrative:**
  > "Distinguished judges, multi-cloud enterprise security today suffers from two fatal flaws: alert fatigue and opaque black-box AI hallucinations. CloudGuard AI solves this through an **evidence-driven, self-healing platform** that combines deterministic CIS rules, Isolation Forest telemetry anomaly detection, and Google Gemini AI root-cause analysis."
- **Action:**
  - Point to the live **Posture Risk Score (76.8/100, Grade D)**.
  - Highlight the 4-pillar breakdown (Severity, Reachability, Criticality, ML Anomaly).

---

## 2. Minute 1:00 - 2:30 — Live Evidence & AI Root Cause

- **Visual:** Navigate to **Security Findings** tab.
- **Action:**
  - Select finding: `AWS-S3-001: S3 Bucket Publicly Accessible`.
  - Click **"View Raw Evidence"** to show actual bucket ACL configuration JSON and CIS 2.1.5 mapping.
  - Click **"Investigate with Gemini AI"**.
  - Show the live Gemini analysis card populating root cause, blast radius (45,000 PII records), and MITRE ATT&CK techniques (`T1530`).
  - Highlight token latency badge (`~250ms`) and model attribution.

---

## 3. Minute 2:30 - 3:45 — One-Click Dry Run & Verified Remediation

- **Visual:** Open **Remediation Plan** for the S3 bucket.
- **Action:**
  - Show generated multi-format fix (AWS CLI `aws s3api put-public-access-block`, Terraform HCL, and Python Boto3 script).
  - Click **"Run Dry-Run Simulation"** → Show simulated state prediction without mutating live cloud state.
  - Click **"Apply Remediation"** → Watch finding state transition to `REMEDIATED`.
  - Point to the **Automated Verification Re-Scan** banner: `VERIFIED_FIXED (Score dropped to 42.0, Grade B)`.

---

## 4. Minute 3:45 - 5:00 — Tamper-Evident Audit Trail & Jury Q&A

- **Visual:** Navigate to **Audit Ledger & Compliance** tab.
- **Action:**
  - Show cryptographic SHA-256 hash chaining of the remediation action just performed.
  - Click **"Verify Cryptographic Ledger"** → Show green badge: `Audit Chain Valid (0 Sequences Broken)`.
  - Close with confidence:
    > "CloudGuard AI delivers complete visibility, explainability, verified self-healing, and tamper-proof compliance."
