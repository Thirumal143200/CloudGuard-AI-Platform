import React from 'react';
import RiskGauge from '../components/RiskGauge';

export default function DashboardPage({ metrics, onNavigate, onInvestigateFinding, systemStatus }) {
  if (!metrics) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
        <span className="pulse-indicator"></span>
        <span style={{ marginLeft: '10px', color: 'var(--text-secondary)' }}>Loading Real-Time Security Posture...</span>
      </div>
    );
  }

  const mode = systemStatus?.deployment_mode || 'DEMO';
  const isNoData = metrics.total_resources === 0 && metrics.total_findings === 0;

  // NO_DATA Mode State
  if (isNoData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
              Security Posture Command Center
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Real-time multi-cloud posture management, telemetry anomaly detection, and automated verification.
            </p>
          </div>
          <span className="badge badge-low" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>NO DATA MODE</span>
        </div>

        <div className="cyber-card" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto',
            fontSize: '1.8rem'
          }}>
            ☁️
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
            No Data Source Configured
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto 24px auto', fontSize: '0.9rem' }}>
            No cloud connectors are currently bound and no offline telemetry has been imported. 
            Connect a cloud provider or upload infrastructure definitions to begin automated continuous compliance scanning.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => onNavigate('inventory')}>
              ⚡ Connect Cloud (AWS / Azure / GCP)
            </button>
            <button className="btn btn-secondary" onClick={() => alert('Upload Evidence: Drag & drop Terraform state, AWS config JSON, or Kubernetes manifest.')}>
              📁 Upload Evidence
            </button>
            <button className="btn btn-secondary" onClick={() => alert('Import Telemetry: Ingest CloudTrail JSON, VPC Flow log CSV, or GuardDuty findings.')}>
              📥 Import Telemetry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const sev = metrics.findings_by_severity || { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
              Multi-Cloud Security Command Center
            </h1>
            {mode === 'DEMO' && (
              <span className="badge badge-ai" style={{ fontSize: '0.7rem' }}>
                SIMULATED DATASET
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Continuous real-time posture management, telemetry anomaly detection, and automated verification.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => onNavigate('inventory')}>
            ☁️ Cloud Inventory ({metrics.total_resources})
          </button>
          <button className="btn btn-primary" onClick={() => onNavigate('findings')}>
            🛡️ Review Open Findings ({metrics.total_findings})
          </button>
        </div>
      </div>

      {/* Main Grid: Posture Risk Gauge + KPI Metric Cards */}
      <div className="grid-dashboard-main">
        {/* Risk Gauge Card */}
        <div className="cyber-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', textAlign: 'center' }}>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
              Live Posture Score
            </span>
            <span className="badge badge-ai" style={{ fontSize: '0.65rem' }}>4-PILLAR MODEL</span>
          </div>

          <RiskGauge 
            score={metrics.overall_risk_score} 
            delta={metrics.trend_delta_24h} 
            grade={metrics.overall_risk_score > 75 ? 'D' : metrics.overall_risk_score > 40 ? 'C' : 'A'}
          />

          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            Formula: 40% Base Severity + 30% Reachability + 20% Asset Criticality + 10% ML Telemetry
          </p>
        </div>

        {/* 4 KPI Grid Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {/* Card 1: Critical & High Findings */}
          <div className="cyber-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('findings')}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Critical Exposures</p>
                <h3 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--sev-critical)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                  {sev.CRITICAL}
                </h3>
              </div>
              <span className="badge badge-critical">P1 URGENT</span>
            </div>
            <div style={{ marginTop: '16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {sev.HIGH} High Severity • {sev.MEDIUM} Medium • {sev.LOW} Low
            </div>
          </div>

          {/* Card 2: Active Correlated Incidents */}
          <div className="cyber-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('incidents')}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Correlated Incidents</p>
                <h3 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--sev-high)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                  {metrics.open_incidents_count}
                </h3>
              </div>
              <span className="badge badge-high">INVESTIGATING</span>
            </div>
            <div style={{ marginTop: '16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Multi-asset attack graph with root cause isolated
            </div>
          </div>

          {/* Card 3: ML Anomaly Detector */}
          <div className="cyber-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Isolation Forest Anomalies</p>
                <h3 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--cyan-glow)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                  {metrics.ml_anomaly_count_24h}
                </h3>
              </div>
              <span className="badge badge-ai">ML ACTIVE</span>
            </div>
            <div style={{ marginTop: '16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Behavioral baseline deviation detected in CloudTrail
            </div>
          </div>

          {/* Card 4: Remediation Success Rate */}
          <div className="cyber-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('remediations')}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Verified Fix Rate</p>
                <h3 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--sev-safe)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                  {metrics.remediation_success_rate}%
                </h3>
              </div>
              <span className="badge badge-safe">VERIFIED</span>
            </div>
            <div style={{ marginTop: '16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Automated re-scan validation active
            </div>
          </div>
        </div>
      </div>

      {/* Second Row: Top Vulnerable Assets + Compliance Posture */}
      <div className="grid-2">
        {/* Top Vulnerable Assets */}
        <div className="cyber-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>🔥 Top Risk Cloud Assets</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('inventory')}>View All</button>
          </div>

          <div className="cyber-table-container">
            <table className="cyber-table">
              <thead>
                <tr>
                  <th>Resource Name</th>
                  <th>Type</th>
                  <th>Risk Score</th>
                </tr>
              </thead>
              <tbody>
                {metrics.top_vulnerable_resources?.map((res) => (
                  <tr key={res.id}>
                    <td style={{ fontWeight: 600, color: '#fff' }}>{res.name}</td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{res.type}</td>
                    <td>
                      <span className={`badge ${res.risk_score >= 80 ? 'badge-critical' : res.risk_score >= 50 ? 'badge-high' : 'badge-medium'}`}>
                        {res.risk_score} / 100
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Regulatory Compliance Overview */}
        <div className="cyber-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>📋 Benchmark Compliance Scores</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('compliance')}>Full Report</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {Object.entries(metrics.compliance_scores || {}).map(([key, val]) => (
              <div key={key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{key}</span>
                  <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: 'var(--cyan-glow)' }}>{val}% Passed</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                  <div style={{ width: `${val}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6, #00f5ff)', borderRadius: 'var(--radius-full)' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
