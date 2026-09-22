import React, { useState } from 'react';
import { login, setAuthToken } from '../services/api';
import { ShieldIcon, CheckCircleIcon } from '../components/Icons';

export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('admin@cloudguard.ai');
  const [password, setPassword] = useState('Admin@CloudGuard2026!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await login(email, password);
      setAuthToken(res.access_token);
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  }

  function handleFillDemo() {
    setEmail('admin@cloudguard.ai');
    setPassword('Admin@CloudGuard2026!');
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-app)',
      padding: '24px'
    }}>
      <div className="soc-card" style={{ width: '100%', maxWidth: '440px', padding: '36px' }}>
        {/* Branding */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div className="logo-badge" style={{ width: '44px', height: '44px', margin: '0 auto 12px auto', borderRadius: 'var(--radius-md)' }}>
            <ShieldIcon size={24} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            CloudGuard AI
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Enterprise Security Operations Center • SRIJAN 2026
          </p>
        </div>

        {error && (
          <div style={{
            background: 'var(--sev-critical-bg)',
            border: '1px solid var(--sev-critical-border)',
            color: '#f87171',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            marginBottom: '18px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Analyst Email / Identity
            </label>
            <input
              type="email"
              className="soc-input"
              style={{ paddingLeft: '12px' }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Master Security Key / Password
            </label>
            <input
              type="password"
              className="soc-input"
              style={{ paddingLeft: '12px' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '10px', marginTop: '4px' }}
            disabled={loading}
          >
            {loading ? 'Authenticating with Argon2id...' : 'Sign in to Security Console'}
          </button>
        </form>

        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleFillDemo}
            style={{ width: '100%' }}
          >
            Pre-fill Demo SOC Credentials
          </button>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
            admin@cloudguard.ai • Admin@CloudGuard2026!
          </div>
        </div>
      </div>
    </div>
  );
}
