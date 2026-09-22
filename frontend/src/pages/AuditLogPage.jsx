import React, { useState, useEffect } from 'react';
import { AuditIcon, ShieldIcon, CheckCircleIcon, RefreshIcon, SearchIcon, AlertTriangleIcon } from '../components/Icons';
import { useToast } from '../components/Toast';
import { getAuditLogs, verifyAuditChain } from '../services/api';

export default function AuditLogPage() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [integrity, setIntegrity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [logsData, integrityData] = await Promise.all([
        getAuditLogs(),
        verifyAuditChain(),
      ]);
      setLogs(logsData || []);
      setIntegrity(integrityData);
    } catch (err) {
      console.error(err);
      showToast('Failed to load audit ledger data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleVerify = async () => {
    try {
      setVerifying(true);
      const res = await verifyAuditChain();
      setIntegrity(res);
      if (res.valid) {
        showToast(`Cryptographic Verification Succeeded: ${res.total_records} records verified intact with valid SHA-256 hashes.`, 'success');
      } else {
        showToast(`Integrity Warning: Chain anomaly detected at sequence ${res.broken_sequence || 'unknown'}`, 'error');
      }
    } catch (err) {
      showToast(`Verification failed: ${err.message}`, 'error');
    } finally {
      setVerifying(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const q = search.toLowerCase();
    return (
      log.action?.toLowerCase().includes(q) ||
      log.target_resource?.toLowerCase().includes(q) ||
      log.actor?.toLowerCase().includes(q) ||
      log.current_hash?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h1 className="page-title">Immutable SHA-256 Audit Ledger</h1>
          <p className="page-desc">
            Cryptographically chained append-only ledger guaranteeing complete non-repudiation, tamper evidence, and regulatory audit compliance.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleVerify}
          disabled={verifying || loading}
        >
          <ShieldIcon size={14} />
          <span>{verifying ? 'Verifying Chain...' : 'Verify Cryptographic Integrity'}</span>
        </button>
      </div>

      {/* Integrity Posture Banner */}
      <div className="soc-card" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: 'var(--radius-sm)',
            background: integrity?.valid ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${integrity?.valid ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
          }}>
            {integrity?.valid ? (
              <CheckCircleIcon size={24} color="#10b981" />
            ) : (
              <AlertTriangleIcon size={24} color="#ef4444" />
            )}
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {integrity?.valid ? 'Audit Ledger Cryptographically Verified' : 'Integrity Check Pending / Warning'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Chained Records: <strong>{integrity?.total_records || logs.length}</strong> • Broken Links: <strong>{integrity?.broken_sequence || '0'}</strong> • Genesis Hash: <span style={{ fontFamily: 'var(--font-mono)' }}>0000000000000000...</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <span className="badge badge-safe">CHAIN INTACT</span>
          <span className="badge badge-provenance">SHA-256</span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="filter-bar">
        <div className="input-search-wrap">
          <SearchIcon size={14} className="input-search-icon" />
          <input
            type="text"
            className="soc-input"
            placeholder="Search audit actions, resource IDs, actors, or SHA hashes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={loadData}
          disabled={loading}
        >
          <RefreshIcon size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Ledger Table */}
      <div className="table-container">
        <table className="soc-table">
          <thead>
            <tr>
              <th>Sequence / Time</th>
              <th>Action</th>
              <th>Target Resource</th>
              <th>Actor</th>
              <th>Current Block Hash (SHA-256)</th>
              <th>Previous Hash Link</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  No audit logs found matching criteria.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log, idx) => (
                <tr key={log.id || idx}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-primary)' }}>
                      #{log.sequence_id || idx + 1}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-provenance" style={{ fontSize: '11px' }}>
                      {log.action}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                      {log.target_resource || 'System-wide'}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {log.actor || 'automated_agent'}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#60a5fa' }} title={log.current_hash}>
                      {log.current_hash ? `${log.current_hash.substring(0, 16)}...` : 'N/A'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }} title={log.previous_hash}>
                      {log.previous_hash ? `${log.previous_hash.substring(0, 16)}...` : '0000000000... (GENESIS)'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
