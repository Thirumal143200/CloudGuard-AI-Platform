import React from 'react';
import {
  DashboardIcon,
  AssetsIcon,
  FindingsIcon,
  IncidentsIcon,
  RemediationIcon,
  ComplianceIcon,
  AuditIcon,
  DataSourcesIcon,
  SettingsIcon,
  ShieldIcon,
} from './Icons';

export default function Sidebar({ activeTab, setActiveTab, metrics }) {
  const primaryNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
    { id: 'assets', label: 'Assets', icon: AssetsIcon, count: metrics?.total_resources },
    { id: 'findings', label: 'Findings', icon: FindingsIcon, count: metrics?.total_findings, alert: (metrics?.findings_by_severity?.CRITICAL || 0) > 0 },
    { id: 'incidents', label: 'Incidents', icon: IncidentsIcon, count: metrics?.open_incidents_count, alert: (metrics?.open_incidents_count || 0) > 0 },
    { id: 'remediations', label: 'Remediation', icon: RemediationIcon },
    { id: 'compliance', label: 'Compliance', icon: ComplianceIcon },
    { id: 'audit', label: 'Audit Log', icon: AuditIcon },
  ];

  const secondaryNavItems = [
    { id: 'datasources', label: 'Data Sources', icon: DataSourcesIcon },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <aside className="soc-sidebar">
      <div className="sidebar-header">
        <div className="logo-badge">
          <ShieldIcon size={18} color="#ffffff" />
        </div>
        <div>
          <div className="brand-text-title">CloudGuard AI</div>
          <div className="brand-text-sub">SOC Operations</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">Operations</div>
        {primaryNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
              type="button"
            >
              <Icon size={17} color={isActive ? '#60a5fa' : '#94a3b8'} />
              <span>{item.label}</span>
              {typeof item.count === 'number' && item.count > 0 && (
                <span className={`nav-badge ${item.alert ? 'badge-critical' : ''}`}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}

        <div className="nav-section-title" style={{ marginTop: '16px' }}>Platform</div>
        {secondaryNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
              type="button"
            >
              <Icon size={17} color={isActive ? '#60a5fa' : '#94a3b8'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>SHA-256 Ledger</span>
          <span className="badge badge-safe" style={{ fontSize: '9px', padding: '1px 5px' }}>VALID</span>
        </div>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          v2.4.0 • SRIJAN 2026
        </div>
      </div>
    </aside>
  );
}
