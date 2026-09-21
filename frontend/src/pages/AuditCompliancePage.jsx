import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function AuditCompliancePage() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [integrityStatus, setIntegrityStatus] = useState(null);
  const [frameworks, setFrameworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    loadAuditAndCompliance();
  }, []);

  async function loadAuditAndCompliance() {
    setLoading(true);
    try {
      const [logs, fws, integrity] = await Promise.all([
        api.getAuditLogs(),
        api.getComplianceFrameworks(),
        api.verifyAuditChain()
      ]);
      setAuditLogs(logs);
      setFrameworks(fws);
      setIntegrityStatus(integrity);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyChain() {
    setVerifying(true);
    try {
      const res = await api.verifyAuditChain();
      setIntegrityStatus(res);
      alert(`Ledger Cryptographic Verification Complete:\nValid: ${res.valid}\nTotal Records Scanned: ${res.total_records}\nBroken Sequences: ${res.broken_sequence || '0 (Chain Intact)'}`);
    } catch (err) {
      alert(`Verification failed: ${err.message}`);
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>Tamper-Evident Audit Ledger & Compliance</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Cryptographically chained SHA-256 append-only ledger guaranteeing regulatory audit integrity.
          </p>
        </div>

        <button 
          className="btn btn-primary"
          disabled={verifying}
          onClick={handleVerifyChain}
        >
          🔗 Verify SHA-256 Ledger Integrity
        </button>
      </div>

      {/* Integrity Status Card */}
      {integrityStatus && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: integrityStatus.valid ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
          border: `1px solid ${integrityStatus.valid ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          padding: '16px 20px',
          borderRadius: 'var(--radius-md)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className={`pulse-indicator ${integrityStatus.valid ? 'green' : 'red'}`}></span>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: integrityStatus.valid ? 'var(--sev-safe)' : 'var(--sev-critical)' }}>
                {integrityStatus.valid ? 'CRYPTOGRAPHIC LEDGER VALIDATED — ZERO TAMPERING DETECTED' : 'ALERT: AUDIT CHAIN INTEGRITY BREACH'}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Latest Block Hash: {integrityStatus.latest_hash || 'Genesis Sequence Active'}
              </p>
            </div>
          </div>

          <span className="badge badge-safe">
            {integrityStatus.total_records} RECORDS VERIFIED
          </span>
        </div>
      )}

      {/* Audit Logs Table */}
      <div className="cyber-card" style={{ padding: '0' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Immutable Action Log</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>SHA-256 Chained</span>
        </div>

        <div className="cyber-table-container">
          <table className="cyber-table">
            <thead>
              <tr>
                <th>Seq #</th>
                <th>Action</th>
                <th>Actor</th>
                <th>Entity</th>
                <th>SHA-256 Hash Signature</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}><span className="pulse-indicator"></span> Loading ledger...</td>
                </tr>
              ) : auditLogs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--cyan-glow)' }}>
                    #{log.sequence_number || 1}
                  </td>
                  <td>
                    <span className="badge badge-low" style={{ fontSize: '0.65rem' }}>{log.action}</span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#fff' }}>{log.actor_email}</td>
                  <td style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{log.entity_type}</td>
                  <td style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--cyan-glow)' }}>
                    {log.current_hash ? log.current_hash.substring(0, 24) + '...' : 'GENESIS'}
                  </td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(log.created_at).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
