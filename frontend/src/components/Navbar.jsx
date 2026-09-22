import React from 'react';
import { RefreshIcon } from './Icons';

export default function Navbar({ user, onLogout, onSeedDemo, systemStatus, activeTab }) {
  const isLiveAI = systemStatus?.ai === 'configured' && systemStatus?.ai_status === 'LIVE';
  const mode = systemStatus?.deployment_mode || 'PRODUCTION';

  const tabLabels = {
    dashboard: 'SOC Overview & Posture',
    assets: 'Asset Inventory & Cloud Resources',
    findings: 'Security Findings & Misconfigurations',
    incidents: 'Security Incidents & Telemetry',
    remediations: 'Automated Remediation & Playbooks',
    compliance: 'Regulatory & Framework Compliance',
    audit: 'Immutable SHA-256 Audit Ledger',
    datasources: 'Data Sources & Evidence Ingestion',
    settings: 'Platform Settings & Cryptography',
  };

  return (
    <header className="soc-navbar">
      <div className="navbar-left">
        <div className="page-context-title">
          <span>{tabLabels[activeTab] || 'SOC Dashboard'}</span>
          <span className="badge badge-provenance" style={{ marginLeft: '6px' }}>
            {mode}
          </span>
        </div>
      </div>

      <div className="navbar-right">
        {/* Real-time AI Status Indicator */}
        <div className="status-indicator">
          <span className={`status-dot ${isLiveAI ? 'pulsing' : 'warning'}`}></span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600 }}>
            {isLiveAI ? 'AI: GEMINI LIVE' : 'AI: HEURISTIC / RULE ENGINE'}
          </span>
        </div>

        {/* Quick Rescan / Seed Data button */}
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onSeedDemo}
          title="Seed realistic multi-cloud test resources and findings"
        >
          <RefreshIcon size={13} />
          <span>Seed / Rescan Data</span>
        </button>

        {/* User Info & Logout */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '6px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {user.email || user.username || 'SecOps Lead'}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                {user.role || 'SECURITY_ANALYST'}
              </div>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onLogout}
              style={{ fontSize: '11px', padding: '4px 8px' }}
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
