# CloudGuard AI — Comprehensive Test Plan & Verification Strategy

**Version:** 2.0  
**Coverage Target:** >85% Backend Engine & Critical Flow Coverage  

---

## 1. Test Levels & Strategy

1. **Unit Testing (`pytest`):**
   - Cryptographic hashing & verification routines in `auth_service.py` and `audit_service.py`.
   - Deterministic rule evaluations for each of the 26+ rules in `rule_engine.py`.
   - Feature vector extraction and mathematical scoring in `ml_engine.py` and `risk_engine.py`.
2. **Integration Testing (`FastAPI TestClient`):**
   - Full user authentication lifecycle (Register → Login → Authenticated Calls).
   - End-to-end Remediation flow: Finding detection → Remediation package creation → Dry Run simulation → Execution mutation → Verification re-scan.
   - Hash chain integrity verification under normal and tampered conditions.
3. **AI Fallback Testing:**
   - Verify prompt execution with live Gemini API keys.
   - Force network disconnect / invalid API key and verify graceful fallback to deterministic engine with identical JSON contracts.
