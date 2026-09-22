import React from 'react';
import RiskGauge from '../components/RiskGauge';
import {
  ShieldIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  TerminalIcon,
  UploadIcon,
  ChevronRightIcon,
  RefreshIcon,
  CloudIcon,
} from '../components/Icons';

export default function DashboardPage({ metrics, onNavigate, onInvestigateFinding, systemStatus }) {
  if (!metrics) {
    return (
      <div className="page-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '12px' }}>
            Connecting to CloudGuard Security Engine...
          </div>
        </div>
      </div>
    );
  }

  const mode = systemStatus?.deployment_mode || 'PRODUCTION';
  const isNoData = metrics.total_resources === 0 && metrics.total_findings === 0;

  // Clean empty state (NO DATA MODE)
  if (isNoData) {
    return (
      <div className="page-body">
        <div className="page-header">
          <div>
            <h1 className="page-title">Security Operations Center (SOC)</h1>
            <p className="page-desc">
              Continuous multi-cloud posture management, telemetry anomaly detection, and automated verification.
            </p>
          </div>
          <span className="badge badge-provenance">EMPTY STATE</span>
        </div>

        <div className="soc-card" style={{ padding: '48px 32px', textAlign: 'center', maxWidth: '640px', margin: '40px auto' }}>
          <div style={{ width: '48px', height: '48px', margin: '0 auto 16px', background: 'var(--color-primary-subtle)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/cloudguard-mark.svg" alt="CloudGuard" style={{ width: '28px', height: '28px' }} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Welcome to CloudGuard AI
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Your enterprise security operations center is ready. Get started in three simple steps:
          </p>

          <div style={{ textAlign: 'left', background: 'var(--bg-panel)', padding: '16px 20px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-primary)' }}>
              <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--color-primary)', color: '#ffffff', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>1</span>
              <span><strong>Add a data source</strong> (connect cloud or upload JSON / CSV / Terraform)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-primary)' }}>
              <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--color-primary-subtle)', color: 'var(--color-primary)', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>2</span>
              <span><strong>Run policy evaluation</strong> (26+ native CIS Benchmark rules)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-primary)' }}>
              <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--color-primary-subtle)', color: 'var(--color-primary)', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>3</span>
              <span><strong>Review findings</strong> and execute verified self-healing playbooks</span>
            </div>
          </div>

          <button className="btn btn-primary" onClick={() => onNavigate('datasources')} style={{ padding: '10px 24px', fontSize: '13px' }}>
            <UploadIcon size={15} />
            <span>Add Data Source →</span>
          </button>
        </div>
      </div>
    );
  }

  const sev = metrics.findings_by_severity || { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };

  return (
    <div className="page-body">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Multi-Cloud Security Operations Center</h1>
          <p className="page-desc">
            Real-time multi-cloud security posture management, deterministic CIS rules evaluation, and Gemini AI analysis.
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('assets')}>
            <span>View All Assets ({metrics.total_resources})</span>
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => onNavigate('findings')}>
            <span>Review Findings ({metrics.total_findings})</span>
          </button>
        </div>
      </div>

      {/* 5-Step Operator Quick Start Guide */}
      <div className="quickstart-banner">
        <div className="quickstart-header">
          <div className="quickstart-title-wrap">
            <span className="quickstart-badge">Interactive Workflow</span>
            <span className="quickstart-title">SOC Evaluation & Response Sequence</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Click any step to inspect</span>
        </div>

        <div className="quickstart-steps">
          <div className="quickstart-step" onClick={() => onNavigate('datasources')}>
            <span className="step-num">STEP 01</span>
            <span className="step-heading">Data Ingestion</span>
            <span className="step-desc">Connect AWS/Azure/GCP or upload Terraform & JSON evidence files.</span>
          </div>

          <div className="quickstart-step" onClick={() => onNavigate('findings')}>
            <span className="step-num">STEP 02</span>
            <span className="step-heading">Rule & AI Evaluation</span>
            <span className="step-desc">Review 26+ CIS rules violations paired with Gemini AI root cause insights.</span>
          </div>

          <div className="quickstart-step" onClick={() => onNavigate('incidents')}>
            <span className="step-num">STEP 03</span>
            <span className="step-heading">Incident Correlation</span>
            <span className="step-desc">Investigate attack graphs and Isolation Forest telemetry anomalies.</span>
          </div>

          <div className="quickstart-step" onClick={() => onNavigate('remediations')}>
            <span className="step-num">STEP 04</span>
            <span className="step-heading">Safe Self-Healing</span>
            <span className="step-desc">Execute dry-run simulation first, then apply verified remediation.</span>
          </div>

          <div className="quickstart-step" onClick={() => onNavigate('audit')}>
            <span className="step-num">STEP 05</span>
            <span className="step-heading">Immutable Audit</span>
            <span className="step-desc">Verify cryptographic SHA-256 ledger chaining for compliance audits.</span>
          </div>
        </div>
      </div>

      {/* Top Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-tile" style={{ cursor: 'pointer' }} onClick={() => onNavigate('findings')}>
          <div className="metric-tile-label">
            <span>Critical Exposures</span>
            <span className="badge badge-critical">P1 URGENT</span>
          </div>
          <div className="metric-tile-val" style={{ color: 'var(--sev-critical)' }}>
            {sev.CRITICAL || 0}
          </div>
          <div className="metric-tile-meta">
            {sev.HIGH || 0} High • {sev.MEDIUM || 0} Medium • {sev.LOW || 0} Low
          </div>
        </div>

        <div className="metric-tile" style={{ cursor: 'pointer' }} onClick={() => onNavigate('assets')}>
          <div className="metric-tile-label">
            <span>Monitored Assets</span>
            <span className="badge badge-provenance">MULTI-CLOUD</span>
          </div>
          <div className="metric-tile-val">
            {metrics.total_resources || 0}
          </div>
          <div className="metric-tile-meta">
            AWS, Azure, GCP & Uploaded Resources
          </div>
        </div>

        <div className="metric-tile" style={{ cursor: 'pointer' }} onClick={() => onNavigate('incidents')}>
          <div className="metric-tile-label">
            <span>Correlated Incidents</span>
            <span className="badge badge-high">ACTIVE SOC</span>
          </div>
          <div className="metric-tile-val" style={{ color: 'var(--sev-high)' }}>
            {metrics.open_incidents_count || 0}
          </div>
          <div className="metric-tile-meta">
            Multi-asset attack graphs correlated
          </div>
        </div>

        <div className="metric-tile" style={{ cursor: 'pointer' }} onClick={() => onNavigate('remediations')}>
          <div className="metric-tile-label">
            <span>Remediation Success</span>
            <span className="badge badge-safe">VERIFIED</span>
          </div>
          <div className="metric-tile-val" style={{ color: 'var(--sev-safe)' }}>
            {metrics.remediation_success_rate || 100}%
          </div>
          <div className="metric-tile-meta">
            Automated post-fix rescan validation
          </div>
        </div>
      </div>

      {/* Risk Gauge & High-Risk Assets Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Risk Gauge */}
        <div className="soc-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', textAlign: 'center' }}>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
              Live Security Posture Score
            </span>
            <span className="badge badge-provenance">4-PILLAR ALGORITHM</span>
          </div>

          <RiskGauge
            score={metrics.overall_risk_score || 0}
            delta={metrics.trend_delta_24h || 0}
            grade={metrics.overall_risk_score > 75 ? 'D' : metrics.overall_risk_score > 40 ? 'C' : 'A'}
          />

          <div style={{ fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', width: '100%' }}>
            Formula: 40% Base Severity + 30% Reachability + 20% Asset Criticality + 10% Telemetry
          </div>
        </div>

        {/* Top Risk Assets */}
        <div className="soc-card">
          <div className="soc-card-header">
            <div className="soc-card-title">
              <ShieldIcon size={16} color="#60a5fa" />
              <span>Highest Risk Cloud Assets</span>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('assets')}>
              View All
            </button>
          </div>

          <table className="soc-table">
            <thead>
              <tr>
                <th>Resource Name</th>
                <th>Type</th>
                <th>Risk Score</th>
              </tr>
            </thead>
            <tbody>
              {metrics.top_vulnerable_resources && metrics.top_vulnerable_resources.length > 0 ? (
                metrics.top_vulnerable_resources.map((res) => (
                  <tr key={res.id}>
                    <td style={{ fontWeight: 600 }}>{res.name}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {res.type}
                    </td>
                    <td>
                      <span className={`badge ${res.risk_score >= 80 ? 'badge-critical' : res.risk_score >= 50 ? 'badge-high' : 'badge-medium'}`}>
                        {res.risk_score} / 100
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No vulnerable assets detected.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
