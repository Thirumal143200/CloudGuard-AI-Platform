# CloudGuard AI — Artificial Intelligence Architecture & Gemini Integration

**Version:** 2.0  
**Core Model:** Google Gemini 2.5 Flash / Google GenAI SDK  
**Fallback Strategy:** Deterministic Multi-Cloud Security Expert Engine  

---

## 1. GenAI Security Integration Architecture

```
┌────────────────────────────────────────────────────────┐
│             Trigger Finding / Incident Event           │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│      Structured Context Preparation (Cloud Resource)   │
└───────────────────────────┬────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
       [API Key Available?]        [Offline / No Key?]
              │                                   │
              ▼                                   ▼
┌───────────────────────────┐       ┌───────────────────────────┐
│ Google Gemini 2.5 Flash   │       │ Deterministic Rule-Based  │
│ - JSON Schema Enforcement │       │ Cyber Expert Fallback     │
│ - Low Latency Stream      │       │ - Instant Output          │
│ - Live Root-Cause & MITRE │       │ - Zero Failure Rate       │
└─────────────┬─────────────┘       └─────────────┬─────────────┘
              │                                   │
              └─────────────┬─────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│      Auditable Response Envelope & Provenance Flag     │
│  { model_used, latency_ms, is_fallback, timestamp }    │
└────────────────────────────────────────────────────────┘
```

---

## 2. Gemini System Prompt & Structured Contract

The platform sends a strongly-typed system prompt enforcing an absolute JSON response schema:

```json
{
  "summary": "String",
  "root_cause": "String",
  "blast_radius": "String",
  "mitre_attack_tactics": ["Array of Strings"],
  "mitre_attack_techniques": ["Array of Strings"],
  "remediation_steps": ["Array of Strings"],
  "compliance_impact": ["Array of Strings"]
}
```

---

## 3. Reliability & Fault Tolerance Guarantees

1. **Guaranteed Uptime:** In hackathons, presentations, or offline jury environments without live Wi-Fi or API keys, the fallback engine automatically kicks in within `<20ms`, delivering identical schema responses.
2. **Provenance Disclosure:** Every AI response clearly displays `is_fallback: true/false` and `model_used`, providing full transparency to evaluators and SOC analysts.
