import React, { useState, useEffect } from 'react';
import { SettingsIcon, ShieldIcon, CheckCircleIcon, TerminalIcon, RefreshIcon } from '../components/Icons';
import { useToast } from '../components/Toast';
import { getSystemStatus } from '../services/api';

export default function SettingsPage() {
  const { showToast } = useToast();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const data = await getSystemStatus();
      setStatus(data);
    } catch (err) {
      console.error(err);
      showToast('Failed to retrieve system status', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h1 className="page-title">Platform Settings & Security Posture</h1>
          <p className="page-desc">
            Inspect platform runtime configurations, cryptographic engine integrity, AI model binding, and SOC operational parameters.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={fetchStatus}
          disabled={loading}
        >
          <RefreshIcon size={14} className={loading ? 'spin' : ''} />
          <span>Refresh Status</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
        {/* Production Architecture & Infrastructure */}
        <div className="soc-card">
          <div className="soc-card-header">
            <div className="soc-card-title">
              <ShieldIcon size={18} color="#60a5fa" />
              <span>Production Architecture Topology</span>
            </div>
            <span className="badge badge-safe">ONLINE</span>
          </div>

          <table className="soc-table">
            <tbody>
              <tr>
                <td style={{ color: 'var(--text-muted)', width: '40%' }}>Backend Hosting</td>
                <td><strong style={{ color: 'var(--text-primary)' }}>Render</strong> (Docker Web Service)</td>
              </tr>
              <tr>
                <td style={{ color: 'var(--text-muted)' }}>Database Tier</td>
                <td><strong style={{ color: 'var(--text-primary)' }}>Supabase PostgreSQL 16</strong> (PgBouncer Pooler)</td>
              </tr>
              <tr>
                <td style={{ color: 'var(--text-muted)' }}>Frontend Hosting</td>
                <td><strong style={{ color: 'var(--text-primary)' }}>Vercel Edge Network</strong> (Vite SPA)</td>
              </tr>
              <tr>
                <td style={{ color: 'var(--text-muted)' }}>Deployment Mode</td>
                <td>
                  <span className="badge badge-provenance">
                    {status?.deployment_mode || 'PRODUCTION'}
                  </span>
                </td>
              </tr>
              <tr>
                <td style={{ color: 'var(--text-muted)' }}>Alembic Migrations</td>
                <td><span style={{ color: '#34d399', fontWeight: 600 }}>Up to date (Auto-applied)</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Cryptographic Security Specifications */}
        <div className="soc-card">
          <div className="soc-card-header">
            <div className="soc-card-title">
              <ShieldIcon size={18} color="#10b981" />
              <span>Cryptographic Engine Standards</span>
            </div>
            <span className="badge badge-safe">FIPS / NIST COMPLIANT</span>
          </div>

          <table className="soc-table">
            <tbody>
              <tr>
                <td style={{ color: 'var(--text-muted)', width: '40%' }}>Audit Ledger Hash</td>
                <td>
                  <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>SHA-256</strong> (Continuous cryptographic chain)
                </td>
              </tr>
              <tr>
                <td style={{ color: 'var(--text-muted)' }}>Credential Hashing</td>
                <td>
                  <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>Argon2id</strong> (m=65536, t=3, p=4)
                </td>
              </tr>
              <tr>
                <td style={{ color: 'var(--text-muted)' }}>Secret Token Encryption</td>
                <td>
                  <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>AES-256-GCM</strong> (Authenticated Cipher)
                </td>
              </tr>
              <tr>
                <td style={{ color: 'var(--text-muted)' }}>Transport Security</td>
                <td>
                  <strong style={{ color: 'var(--text-primary)' }}>TLS 1.3 / SSL Required</strong> (PostgreSQL & HTTPS)
                </td>
              </tr>
              <tr>
                <td style={{ color: 'var(--text-muted)' }}>Database Connection Pooling</td>
                <td>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>pool_pre_ping=True, pool_recycle=300s</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* AI & Analytics Inference Engine */}
        <div className="soc-card">
          <div className="soc-card-header">
            <div className="soc-card-title">
              <TerminalIcon size={18} color="#a855f7" />
              <span>AI & Threat Detection Pipeline</span>
            </div>
            <span className={`badge ${status?.ai_status === 'LIVE' ? 'badge-safe' : 'badge-low'}`}>
              {status?.ai_status === 'LIVE' ? 'GEMINI 2.5 LIVE' : 'HYBRID RULE/ML ACTIVE'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Primary LLM Model</span>
              <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>gemini-2.5-flash</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Deterministic Engine</span>
              <span style={{ color: 'var(--text-primary)' }}>26+ CIS Cloud Benchmark Rules</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Anomaly Detection Model</span>
              <span style={{ color: 'var(--text-primary)' }}>Isolation Forest (Unsupervised ML)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Remediation Safety Filter</span>
              <span style={{ color: '#34d399', fontWeight: 600 }}>Dry-Run Simulation Required</span>
            </div>
          </div>
        </div>

        {/* Role-Based Access Control (RBAC) */}
        <div className="soc-card">
          <div className="soc-card-header">
            <div className="soc-card-title">
              <ShieldIcon size={18} color="#eab308" />
              <span>SOC Access & Authorization Controls</span>
            </div>
            <span className="badge badge-provenance">JWT AUTH</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Session Expiration</span>
              <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>3600 seconds (1 hour)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Authorized Roles</span>
              <span style={{ color: 'var(--text-primary)' }}>SEC_ADMIN, ANALYST, AUDITOR, DEV</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>High-Risk Actions</span>
              <span style={{ color: 'var(--sev-high)' }}>Explicit Confirmation Enforced</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Audit Logging</span>
              <span style={{ color: '#34d399', fontWeight: 600 }}>100% Mutations Recorded</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
