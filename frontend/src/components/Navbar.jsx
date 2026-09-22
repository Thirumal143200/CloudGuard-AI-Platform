import React, { useState } from 'react';
import { RefreshIcon, ShieldIcon, TrashIcon } from './Icons';
import ConfirmationModal from './ConfirmationModal';
import { triggerRescan, clearAllData } from '../services/api';
import { useToast } from './Toast';

export default function Navbar({ user, onLogout, onSeedDemo, systemStatus, activeTab, onRefreshMetrics }) {
  const { showToast } = useToast();
  const [rescanning, setRescanning] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

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

  const handleRescan = async () => {
    try {
      setRescanning(true);
      const res = await triggerRescan();
      showToast(`Policy rescan completed: ${res.new_findings_detected} new findings detected across ${res.resources_evaluated} resources`, 'success');
      if (onRefreshMetrics) onRefreshMetrics();
    } catch (err) {
      showToast('Policy rescan failed', 'error');
    } finally {
      setRescanning(false);
    }
  };

  const handleClear = async () => {
    try {
      setClearing(true);
      await clearAllData();
      setIsClearModalOpen(false);
      showToast('All resources, findings, and incidents cleared. System reset to clean state.', 'info');
      if (onRefreshMetrics) onRefreshMetrics();
    } catch (err) {
      showToast('Failed to clear platform data', 'error');
    } finally {
      setClearing(false);
    }
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
        {/* Real-time Engine Status Indicators */}
        <div className="status-indicator" title="26+ Deterministic CIS Policy Rules Engine">
          <span className="status-dot safe"></span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600 }}>
            RULES: 26 CIS
          </span>
        </div>

        <div className="status-indicator" title="Gemini AI Threat Inference">
          <span className={`status-dot ${isLiveAI ? 'pulsing' : 'warning'}`}></span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600 }}>
            {isLiveAI ? 'AI: GEMINI LIVE' : 'AI: RULE/ML MODE'}
          </span>
        </div>

        <div className="status-indicator" title="Cryptographically chained SHA-256 ledger">
          <span className="status-dot safe"></span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600 }}>
            AUDIT: SHA-256
          </span>
        </div>

        {/* Rescan Button */}
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleRescan}
          disabled={rescanning}
          title="Re-run 26+ CIS rules against discovered resources"
          style={{ fontSize: '11px' }}
        >
          <RefreshIcon size={12} className={rescanning ? 'spin' : ''} />
          <span>{rescanning ? 'Scanning...' : 'Policy Rescan'}</span>
        </button>

        {/* Reset / Clear Data */}
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setIsClearModalOpen(true)}
          title="Clear all data to test empty state"
          style={{ fontSize: '11px', color: 'var(--sev-critical-text)' }}
        >
          <TrashIcon size={12} />
          <span>Clear Data</span>
        </button>

        {/* User Info & Logout */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '6px', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '10px' }}>
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
              style={{ fontSize: '11px', padding: '3px 8px' }}
            >
              Sign out
            </button>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={isClearModalOpen}
        title="Reset & Purge All Platform Data"
        message="This action will delete all cloud accounts, discovered resources, security findings, incidents, and remediation plans. Use this to verify the zero-data onboarding flow."
        confirmText="Purge All Data"
        confirmType="danger"
        isLoading={clearing}
        onConfirm={handleClear}
        onCancel={() => setIsClearModalOpen(false)}
      />
    </header>
  );
}
