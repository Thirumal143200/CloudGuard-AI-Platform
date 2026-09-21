import React from 'react';

export default function Navbar({ user, onLogout, onSeedDemo, systemStatus }) {
  const isLiveAI = systemStatus?.ai === 'configured' && systemStatus?.ai_status === 'LIVE';
  const mode = systemStatus?.deployment_mode || 'DEMO';

  return (
    <header style={{
      height: '64px',
      backgroundColor: 'rgba(17, 24, 39, 0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      position: 'sticky',
      top: 0,
      zIndex: 40,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #00f5ff 0%, #3b82f6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-glow-cyan)'
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0a0e1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.125rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>CloudGuard</span>
            <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--cyan-glow)' }}>AI</span>
            <span className={`badge ${mode === 'PRODUCTION' ? 'badge-safe' : 'badge-ai'}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
              {mode} MODE
            </span>
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SRIJAN Hackathon 2026 Edition</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
        {/* Dynamic AI Status Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(0,0,0,0.35)',
          padding: '6px 12px',
          borderRadius: 'var(--radius-full)',
          border: `1px solid ${isLiveAI ? 'rgba(0, 245, 255, 0.4)' : 'rgba(234, 179, 8, 0.4)'}`
        }}>
          <span className={`pulse-indicator ${isLiveAI ? 'green' : ''}`}></span>
          <span style={{ fontSize: '0.75rem', color: isLiveAI ? 'var(--cyan-glow)' : 'var(--sev-medium)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
            {isLiveAI ? 'AI STATUS: LIVE' : 'AI STATUS: UNAVAILABLE — RULE/ML MODE ACTIVE'}
          </span>
        </div>

        {mode === 'DEMO' && (
          <button 
            className="btn btn-secondary btn-sm"
            onClick={onSeedDemo}
            title="Reset & seed multi-cloud test data"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
            Reset Demo Data
          </button>
        )}

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '16px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.8rem',
              color: 'var(--cyan-glow)'
            }}>
              {user.email ? user.email[0].toUpperCase() : 'A'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{user.full_name || user.email}</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--cyan-glow)', fontFamily: 'var(--font-mono)' }}>{user.role || 'ADMIN'}</span>
            </div>
            <button 
              onClick={onLogout}
              className="btn btn-secondary btn-sm"
              style={{ padding: '4px 8px', fontSize: '0.7rem' }}
              title="Logout"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
