# CloudGuard AI — UI / UX Design Brief & Design System

**Version:** 2.0  
**Design Philosophy:** Evidence-First Cyber Command Interface  
**Target Resolution:** Responsive (Optimized for 1920x1080 & 1440x900 SOC displays)  

---

## 1. Design Token System

### Color Palette (Cyberpunk Deep Navy Theme)

| Token Name | Hex Code | Purpose |
|---|---|---|
| `--bg-app` | `#0a0e1a` | Main Application Background |
| `--bg-card` | `#111827` | Surface Card & Container Background |
| `--bg-card-hover` | `#1e293b` | Interactive Surface Hover State |
| `--border-subtle` | `#1f293d` | Dividers and Subtle Structural Borders |
| `--border-accent` | `#3b82f6` | Active / Focus Accent Borders |
| `--text-primary` | `#f8fafc` | Primary High-Contrast Typography |
| `--text-secondary` | `#94a3b8` | Muted Subtext & Secondary Metadata |
| `--accent-cyan` | `#00f5ff` | AI Copilot, Live Indicators & Telemetry Highlights |
| `--severity-critical` | `#ef4444` | P1 Critical Alerting, Critical Findings |
| `--severity-high` | `#f97316` | P2 High Severity Risks |
| `--severity-medium` | `#eab308` | P3 Medium Priority Issues |
| `--severity-low` | `#3b82f6` | P4 Informational & Low Impact Alerts |
| `--severity-safe` | `#10b981` | Remediated, Verified, Compliant Status |

---

## 2. Typography Hierarchy

- **Font Family:** `'Inter', system-ui, -apple-system, sans-serif`
- **Monospace Family (CLI, Logs, Hashes):** `'JetBrains Mono', 'Fira Code', monospace`
- **Headings:**
  - `H1 (Page Title):` `1.875rem (30px)` | Weight: 700 | Tracking: `-0.025em`
  - `H2 (Section Header):` `1.25rem (20px)` | Weight: 600
  - `H3 (Card Title):` `1.0rem (16px)` | Weight: 600
- **Body & Data:**
  - `Body Standard:` `0.875rem (14px)` | Weight: 400 | Line Height: 1.5
  - `Badge / Label:` `0.75rem (12px)` | Weight: 600 | Uppercase Tracking: `0.05em`
  - `Log Snippet:` `0.8125rem (13px)` | Line Height: 1.4

---

## 3. Core Component Guidelines

### A. Real-Time Risk Score Gauge
- Dual-arc circular gauge rendering score `0 - 100`.
- Animated gradient transition (`#10b981` → `#eab308` → `#ef4444`).
- Center readout displaying numeric score, delta comparison vs 24h ago, and security grade (`A+` through `F`).

### B. Security Finding Evidence Drawer
- Slides in from right on finding row selection.
- Displays:
  1. Header with severity badge, cloud provider icon, and status badge.
  2. Deep raw JSON evidence box with syntax highlighting.
  3. MITRE ATT&CK technique tags.
  4. 1-Click "Remediate with Dry-Run" action bar.

### C. AI Copilot Overlay / Drawer
- Expandable Gemini AI investigation panel.
- Clear badge indicating inference source: `Live Gemini 2.5 Flash` vs `Expert Fallback Engine`.
- Real-time token latency tracker (`e.g., 284ms`).

### D. Tamper-Evident Audit Verification Banner
- Real-time cryptographic status widget showing sequence head hash and unbroken chain indicator.
