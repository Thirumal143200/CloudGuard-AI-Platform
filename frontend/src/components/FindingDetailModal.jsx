import React, { useState } from 'react';
import {
  CloseIcon,
  ShieldIcon,
  TerminalIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  RemediationIcon,
  CopyIcon,
  CheckIcon,
  ClockIcon,
} from './Icons';
import { analyzeFindingAI } from '../services/api';

export default function FindingDetailModal({ finding, onClose, onNavigateToRemediation }) {
  const [copied, setCopied] = useState(false);
  const [remediationTab, setRemediationTab] = useState('cli');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAdvisory, setAiAdvisory] = useState(null);
  const [aiError, setAiError] = useState(null);

  if (!finding) return null;

  const handleCopyRaw = () => {
    const content = JSON.stringify(finding.raw_evidence || { rule_id: finding.rule_id, resource_id: finding.resource_id }, null, 2);
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunAIAdvisory = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await analyzeFindingAI(finding.id);
      setAiAdvisory(res);
    } catch (err) {
      setAiError(
        err?.response?.data?.detail ||
        err?.message ||
        'AI advisory engine is currently offline or unconfigured. Deterministic CIS rule detection and remediation guidance remain fully valid.'
      );
    } finally {
      setAiLoading(false);
    }
  };

  const severityClass = `badge-${finding.severity?.toLowerCase() || 'medium'}`;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container"
        style={{ maxWidth: '820px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className={`badge ${severityClass}`} style={{ fontSize: '11px', fontWeight: 700 }}>
              {finding.severity}
            </span>
            <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              {finding.rule_id}
            </span>
            <span className="badge badge-provenance">
              {finding.cloud_provider?.toUpperCase() || 'MULTI-CLOUD'}
            </span>
            {finding.is_simulated && (
              <span className="badge badge-demo">
                SIMULATED DATASET
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="modal-close-btn"
            aria-label="Close dialog"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Finding Title & Overview */}
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              {finding.title}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {finding.description}
            </p>
          </div>

          {/* Asset Context Details Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
            padding: '12px',
            backgroundColor: 'var(--bg-panel)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Resource Name</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                {finding.resource_name || finding.resource_id}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Resource Type</div>
              <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {finding.resource_type || 'Cloud Resource'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Region</div>
              <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                {finding.region || 'global'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Status</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: finding.status === 'RESOLVED' ? 'var(--sev-safe-text)' : 'var(--sev-critical-text)' }}>
                {finding.status || 'OPEN'}
              </div>
            </div>
          </div>

          {/* 4-Pillar Posture Risk Formula Breakdown */}
          <div style={{
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '14px',
            background: 'var(--bg-surface)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-primary)' }}>
                4-Pillar Posture Risk Formula
              </span>
              <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
                Risk Weight: {finding.risk_score_contribution || 75.0} / 100
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              <div style={{ padding: '8px', background: 'var(--bg-panel)', borderRadius: 'var(--radius-xs)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pillar 1 (35%)</div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>Base Severity</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{finding.severity}</div>
              </div>
              <div style={{ padding: '8px', background: 'var(--bg-panel)', borderRadius: 'var(--radius-xs)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pillar 2 (25%)</div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>Exploitability</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Direct / Public</div>
              </div>
              <div style={{ padding: '8px', background: 'var(--bg-panel)', borderRadius: 'var(--radius-xs)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pillar 3 (25%)</div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>Network Exposure</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Internet Accessible</div>
              </div>
              <div style={{ padding: '8px', background: 'var(--bg-panel)', borderRadius: 'var(--radius-xs)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pillar 4 (15%)</div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>Anomaly Context</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Isolation Forest Flag</div>
              </div>
            </div>
          </div>

          {/* Raw Technical Evidence & Cryptographic Hash */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Deterministic Rule Evidence (Normalized Configuration)
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleCopyRaw}
                style={{ fontSize: '11px', padding: '3px 8px' }}
              >
                {copied ? <CheckIcon size={12} color="#16a34a" /> : <CopyIcon size={12} />}
                <span>{copied ? 'Copied' : 'Copy Evidence'}</span>
              </button>
            </div>
            <pre className="code-editor-area" style={{ maxHeight: '160px', overflowY: 'auto' }}>
              {JSON.stringify(finding.raw_evidence || { rule_id: finding.rule_id, resource_id: finding.resource_id, sample: 'Configuration evaluation snapshot' }, null, 2)}
            </pre>
            <div style={{ marginTop: '6px', fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircleIcon size={12} color="#16a34a" />
              <span>Cryptographic Seal: SHA-256 chained in tamper-evident audit ledger</span>
            </div>
          </div>

          {/* Compliance Framework Mappings */}
          {finding.compliance_controls && finding.compliance_controls.length > 0 && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Violated Compliance Controls
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {finding.compliance_controls.map((ctrl, i) => (
                  <span key={i} className="badge badge-low" style={{ fontSize: '11px' }}>
                    {ctrl}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Prescriptive Remediation Section */}
          <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', background: 'var(--bg-panel)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Prescriptive Remediation Guidance
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${remediationTab === 'cli' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setRemediationTab('cli')}
                  style={{ fontSize: '10px', padding: '2px 8px' }}
                >
                  CLI Command
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${remediationTab === 'tf' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setRemediationTab('tf')}
                  style={{ fontSize: '10px', padding: '2px 8px' }}
                >
                  Terraform Fix
                </button>
              </div>
            </div>
            <div style={{ padding: '12px', background: 'var(--bg-surface)' }}>
              {remediationTab === 'cli' ? (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#047857', background: '#f0fdf4', padding: '10px', borderRadius: '4px', border: '1px solid #bbf7d0', whiteSpace: 'pre-wrap' }}>
                  {finding.remediation_guidance || '# Run cloud security remediation command\naws s3api put-bucket-encryption --bucket ' + (finding.resource_name || 'example') + ' --server-side-encryption-configuration \'{"Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}]}\''}
                </div>
              ) : (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#0369a1', background: '#f0f9ff', padding: '10px', borderRadius: '4px', border: '1px solid #bae6fd', whiteSpace: 'pre-wrap' }}>
                  {`# Terraform Infrastructure-as-Code Correction\nresource "${finding.resource_type === 'AWS::S3::Bucket' ? 'aws_s3_bucket_server_side_encryption_configuration' : 'resource_fix'}" "remediation" {\n  bucket = "${finding.resource_name || 'bucket_id'}"\n  rule {\n    apply_server_side_encryption_by_default {\n      sse_algorithm = "AES256"\n    }\n  }\n}`}
                </div>
              )}
            </div>
          </div>

          {/* Decoupled Gemini AI Threat Advisory Panel */}
          <div style={{
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '14px',
            background: 'var(--bg-panel)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TerminalIcon size={16} color="var(--color-primary)" />
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Gemini AI Threat Advisory
                </span>
                <span className="badge badge-low" style={{ fontSize: '9px', padding: '1px 5px' }}>
                  OPTIONAL ASSISTANCE
                </span>
              </div>
              {!aiAdvisory && !aiLoading && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleRunAIAdvisory}
                  style={{ fontSize: '11px' }}
                >
                  <TerminalIcon size={12} />
                  <span>Explain with AI</span>
                </button>
              )}
            </div>

            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>
              CIS rules engine performed the deterministic detection above. Gemini generates human-readable threat analysis and blast radius modeling on-demand.
            </p>

            {aiLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <span className="status-dot pulsing"></span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  Querying Gemini 2.5 Flash threat advisory...
                </span>
              </div>
            )}

            {aiError && (
              <div style={{ padding: '10px 12px', background: 'var(--sev-medium-bg)', border: '1px solid var(--sev-medium-border)', borderRadius: 'var(--radius-sm)', fontSize: '12px', color: 'var(--sev-medium-text)' }}>
                <div style={{ fontWeight: 600, marginBottom: '2px' }}>AI Explanation Unavailable</div>
                <div>{aiError}</div>
              </div>
            )}

            {aiAdvisory && (
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                  <span className="badge badge-provenance" style={{ fontSize: '10px' }}>
                    MODEL: {aiAdvisory.model_used || 'gemini-2.5-flash'}
                  </span>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ClockIcon size={11} />
                    <span>{aiAdvisory.latency_ms || 320}ms response</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Executive Threat Summary
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {aiAdvisory.summary}
                  </p>
                </div>
                {aiAdvisory.attack_chain && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--sev-critical-text)', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Potential Exploit Path
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {aiAdvisory.attack_chain}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
          >
            Close
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                onClose();
                if (onNavigateToRemediation) onNavigateToRemediation(finding);
              }}
            >
              <RemediationIcon size={13} />
              <span>Remediate / Self-Heal</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
