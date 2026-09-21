import React from 'react';

export default function Sidebar({ activeTab, setActiveTab, metrics }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'inventory', label: 'Cloud Inventory', icon: '☁️', count: metrics?.total_resources },
    { id: 'findings', label: 'Security Findings', icon: '🛡️', count: metrics?.total_findings, alert: metrics?.findings_by_severity?.CRITICAL > 0 },
    { id: 'incidents', label: 'Incidents & Forensics', icon: '🚨', count: metrics?.open_incidents_count, alert: metrics?.open_incidents_count > 0 },
    { id: 'remediations', label: 'Self-Healing Actions', icon: '⚡' },
    { id: 'audit', label: 'Audit Ledger & SHA-256', icon: '🔗' },
    { id: 'compliance', label: 'Compliance & CIS', icon: '📋' },
  ];

  return (
    <aside style={{
      width: '260px',
      backgroundColor: 'rgba(11, 17, 33, 0.98)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 16px',
      gap: '8px',
      flexShrink: 0,
    }}>
      <div style={{ padding: '0 12px 12px 12px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '8px' }}>
        <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 700 }}>
          Navigation Command
        </p>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isActive ? 'rgba(0, 245, 255, 0.1)' : 'transparent',
                color: isActive ? 'var(--cyan-glow)' : 'var(--text-secondary)',
                border: isActive ? '1px solid rgba(0, 245, 255, 0.3)' : '1px solid transparent',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 500,
                transition: 'all 0.15s ease',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.5)';
                  e.currentTarget.style.color = '#fff';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              
              {item.count !== undefined && item.count !== null && (
                <span style={{
                  fontSize: '0.7rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: item.alert ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  color: item.alert ? 'var(--sev-critical)' : 'var(--text-muted)',
                  border: item.alert ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid transparent'
                }}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div style={{ marginTop: 'auto', padding: '16px', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span className="pulse-indicator"></span>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--cyan-glow)' }}>AI Threat Copilot</span>
        </div>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
          Google Gemini 2.5 Flash active with Isolation Forest anomaly correlation.
        </p>
      </div>
    </aside>
  );
}
