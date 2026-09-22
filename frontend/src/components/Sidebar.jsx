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
} from './Icons';

export default function Sidebar({ activeTab, setActiveTab, metrics, user, onLogout }) {
  const navSections = [
    {
      title: 'Overview',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
      ],
    },
    {
      title: 'Security',
      items: [
        { id: 'datasources', label: 'Data Sources', icon: DataSourcesIcon },
        { id: 'assets', label: 'Assets', icon: AssetsIcon, count: metrics?.total_resources },
        { id: 'findings', label: 'Findings', icon: FindingsIcon, count: metrics?.total_findings, alert: (metrics?.findings_by_severity?.CRITICAL || 0) > 0 },
        { id: 'incidents', label: 'Incidents', icon: IncidentsIcon, count: metrics?.open_incidents_count, alert: (metrics?.open_incidents_count || 0) > 0 },
      ],
    },
    {
      title: 'Operations',
      items: [
        { id: 'remediations', label: 'Remediation', icon: RemediationIcon },
        { id: 'compliance', label: 'Compliance', icon: ComplianceIcon },
        { id: 'audit', label: 'Audit Log', icon: AuditIcon },
      ],
    },
    {
      title: 'System',
      items: [
        { id: 'settings', label: 'Settings', icon: SettingsIcon },
      ],
    },
  ];

  // User initials
  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'CG';

  return (
    <aside className="soc-sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <img
          src="/cloudguard-mark.svg"
          alt="CloudGuard"
          style={{ width: '28px', height: '28px' }}
        />
        <div>
          <div className="brand-text-title">
            CloudGuard <span style={{ color: 'var(--color-primary)' }}>AI</span>
          </div>
          <div className="brand-text-sub">SOC Operations</div>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="sidebar-nav">
        {navSections.map((sec, idx) => (
          <div key={sec.title} style={{ marginTop: idx > 0 ? '14px' : '4px' }}>
            <div className="nav-section-title">{sec.title}</div>
            {sec.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                  type="button"
                >
                  <Icon size={16} color={isActive ? '#2563eb' : '#64748b'} />
                  <span>{item.label}</span>
                  {typeof item.count === 'number' && item.count > 0 && (
                    <span className={`nav-badge ${item.alert ? 'badge-critical' : ''}`}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Profile & Footer */}
      <div className="sidebar-footer">
        {user && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '10px',
            marginBottom: '10px',
            borderBottom: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'var(--color-primary-subtle)',
                color: 'var(--color-primary)',
                fontSize: '11px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {initials}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {user.full_name || user.email}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {user.role || 'SECURITY_ANALYST'}
                </div>
              </div>
            </div>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                title="Sign out of session"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '11px',
                  cursor: 'pointer',
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-xs)'
                }}
              >
                Sign out
              </button>
            )}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>SHA-256 Ledger</span>
          <span className="badge badge-safe" style={{ fontSize: '9px', padding: '1px 5px' }}>VALID</span>
        </div>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          v2.5.0 • SRIJAN 2026
        </div>
      </div>
    </aside>
  );
}
