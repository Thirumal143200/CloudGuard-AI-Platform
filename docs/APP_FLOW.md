# CloudGuard AI — Application Flow

## Primary Flow

```
USER → Landing Page
  │
  ├─→ Register → Create Account → Login
  │
  └─→ Login → JWT Token → Dashboard
       │
       ├─→ Dashboard (KPIs, Charts, Score)
       │     └─→ All metrics from /api/dashboard (never hardcoded)
       │
       ├─→ Data Sources
       │     ├─→ Connect Cloud Account
       │     │     ├─→ Select Provider (AWS/Azure/GCP)
       │     │     ├─→ Enter Read-Only Credentials
       │     │     ├─→ Backend Validates Credentials
       │     │     ├─→ Discover Resources via Cloud API
       │     │     ├─→ Persist to Database (source_type=LIVE_*)
       │     │     └─→ Trigger Initial Scan
       │     │
       │     ├─→ Upload Data (JSON/CSV)
       │     │     ├─→ Select File
       │     │     ├─→ Backend Validates Schema
       │     │     ├─→ Preview Parsed Data
       │     │     ├─→ Confirm Import
       │     │     ├─→ Persist (source_type=USER_UPLOAD)
       │     │     └─→ Trigger Scan
       │     │
       │     └─→ Enable Demo Mode
       │           ├─→ Load Synthetic Data (is_simulated=true)
       │           ├─→ UI shows "DEMO MODE" badge
       │           └─→ Trigger Scan on Demo Data
       │
       ├─→ Security Scan
       │     ├─→ Rule Engine (25+ rules on actual config)
       │     │     └─→ Findings Created → Database
       │     ├─→ ML Engine (Isolation Forest)
       │     │     ├─→ Feature Extraction
       │     │     ├─→ Anomaly Scoring
       │     │     └─→ Predictions Stored
       │     ├─→ Baseline Comparison
       │     │     └─→ Deviation Detection
       │     ├─→ Risk Engine (40/30/20/10 weights)
       │     │     └─→ Risk Scores Calculated
       │     └─→ AI Analysis (for high-risk only)
       │           ├─→ Structured Evidence Sent to Gemini
       │           ├─→ Response Validated (Pydantic)
       │           └─→ Analysis Stored
       │
       ├─→ Findings
       │     ├─→ List (filtered by severity/provider/search)
       │     └─→ Detail View
       │           ├─→ Evidence Panel
       │           │     ├─→ Resource Configuration
       │           │     ├─→ Rule That Triggered
       │           │     ├─→ ML Prediction (if any)
       │           │     ├─→ Baseline Comparison
       │           │     └─→ Risk Score Breakdown
       │           ├─→ AI Analysis (on demand)
       │           ├─→ Remediation Recommendation
       │           └─→ Compliance Impact
       │
       ├─→ Incidents
       │     ├─→ Created from Critical Findings + Risk
       │     ├─→ Investigation View
       │     │     ├─→ Linked Findings
       │     │     ├─→ Evidence Aggregation
       │     │     └─→ AI Correlation
       │     └─→ Status: OPEN → INVESTIGATING → CONTAINED → RESOLVED
       │
       ├─→ Remediation
       │     ├─→ Select Finding
       │     ├─→ View Recommendation
       │     ├─→ Dry Run (default)
       │     │     ├─→ What changes?
       │     │     ├─→ Why?
       │     │     ├─→ Risk?
       │     │     └─→ Expected result?
       │     ├─→ User Approves → Execute
       │     ├─→ Rescan Triggered
       │     └─→ Before/After Comparison
       │           ├─→ Previous Snapshot
       │           ├─→ Current Snapshot
       │           └─→ Finding Status: RESOLVED
       │
       ├─→ ML Analytics
       │     ├─→ Anomaly Timeline
       │     ├─→ Model Information (version, features, threshold)
       │     ├─→ Feature Importance
       │     └─→ Baseline Status (LEARNING / ESTABLISHED)
       │
       ├─→ Compliance
       │     ├─→ Framework Selection (CIS/SOC2/HIPAA/PCI/NIST/GDPR)
       │     ├─→ Control Status (backed by findings)
       │     └─→ Evidence Links
       │
       ├─→ Cost Optimization
       │     ├─→ Idle Resources
       │     ├─→ Unattached Volumes
       │     ├─→ Unused IPs
       │     └─→ Savings Estimates (labeled ESTIMATED)
       │
       ├─→ Audit Logs
       │     └─→ All security operations logged
       │
       └─→ System Health
             └─→ /api/health status for all subsystems
```

## Alternative Flows

### No Cloud Credentials
```
Data Sources → Connect Cloud → Enter Credentials → VALIDATION FAILS
  └─→ Error: "Invalid credentials or insufficient permissions"
  └─→ Options: Retry | Upload Data Instead | Use Demo Mode
```

### No Historical Data (Baseline Learning)
```
ML Analytics → Baseline Status
  └─→ "BASELINE: LEARNING"
  └─→ "Insufficient historical data for behavioral baseline"
  └─→ "Minimum 7 days of data required"
  └─→ Risk Engine uses: Rules + ML only (no baseline component)
```

### Gemini Unavailable
```
AI Analysis → Send Evidence → API ERROR / TIMEOUT
  └─→ Retry once
  └─→ STILL FAILS
  └─→ Local Deterministic Fallback
        ├─→ Rule-based severity assessment
        ├─→ Standard remediation recommendations
        └─→ UI badge: "AI: Local Fallback"
```

### No Data Connected
```
Dashboard → No Data Sources
  └─→ "No cloud data is connected yet."
  └─→ Actions:
        ├─→ Connect Cloud Account
        ├─→ Upload Security Data
        ├─→ Create Test Environment
        └─→ Run Demo Mode
  └─→ NO fabricated findings
```

### Invalid Upload Data
```
Upload → Select File → Validate Schema → VALIDATION FAILS
  └─→ Error: "Invalid schema: missing required field 'provider'"
  └─→ Show expected format / download template
  └─→ User corrects and re-uploads
```

### Insufficient Evidence for AI
```
AI Analysis → Structured Evidence → Gemini → INSUFFICIENT_EVIDENCE
  └─→ "Insufficient data for AI analysis"
  └─→ "Evidence strength: WEAK"
  └─→ No fabricated analysis
  └─→ Recommend: Collect more data / Add cloud connection
```

### Remediation Approval Required
```
Remediation → Dry Run → User Reviews → DESTRUCTIVE ACTION
  └─→ "This action will modify cloud resources"
  └─→ Explicit confirmation required
  └─→ AI NEVER independently performs destructive operations
```
