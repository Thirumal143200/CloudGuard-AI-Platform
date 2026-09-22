import React from 'react';
import { CloseIcon, ShieldIcon, TerminalIcon, CheckCircleIcon, RemediationIcon } from './Icons';

export default function EvidenceDrawer({ finding, onClose, onInvestigateAI, onRemediate }) {
  if (!finding) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: '580px',
      backgroundColor: 'var(--bg-surface)',
      borderLeft: '1px solid var(--border-default)',
      boxShadow: 'var(--shadow-lg)',
      zIndex: 90,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Drawer Header */}
      <div style={{
        padding: '18px 24px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        background: 'var(--bg-panel)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className={`badge badge-${finding.severity?.toLowerCase()}`}>
              {finding.severity}
            </span>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              {finding.rule_id}
            </span>
            <span className="badge badge-provenance">
              {finding.cloud_provider?.toUpperCase() || 'AWS'}
            </span>
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
            {finding.title}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="modal-close-btn"
          aria-label="Close drawer"
        >
          <CloseIcon size={16} />
        </button>
      </div>

      {/* Drawer Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Description */}
        <div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>
            Finding Description & Context
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
            {finding.description}
          </p>
        </div>

        {/* 4-Pillar Risk Engine Breakdown */}
        <div style={{ background: 'var(--bg-input)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#60a5fa', marginBottom: '10px', fontWeight: 700 }}>
            4-Pillar Posture Risk Contribution
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Pillar 1: Base Severity</span>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>40% Weight</p>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Pillar 2: Reachability</span>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>30% Weight</p>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Pillar 3: Asset Criticality</span>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>20% Weight</p>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Pillar 4: Telemetry Anomaly</span>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>10% Weight</p>
            </div>
          </div>
        </div>

        {/* Raw Technical Audit Evidence */}
        <div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>
            Raw Technical Evidence (JSON)
          </div>
          <pre className="code-editor-area" style={{ height: 'auto', maxHeight: '200px', overflowY: 'auto' }}>
            {JSON.stringify(finding.raw_evidence || { rule: finding.rule_id, resource: finding.resource_id }, null, 2)}
          </pre>
        </div>

        {/* Compliance Mappings */}
        {finding.compliance_controls && finding.compliance_controls.length > 0 && (
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px' }}>
              Violated Compliance Benchmarks
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

        {/* Guidance */}
        {finding.remediation_guidance && (
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>
              Standard Remediation Guidance
            </div>
            <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', color: '#34d399', fontSize: '12px', fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap' }}>
              {finding.remediation_guidance}
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div style={{
        padding: '16px 24px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-panel)',
      }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onInvestigateAI(finding)}
        >
          <TerminalIcon size={14} />
          <span>Analyze with Gemini AI</span>
        </button>

        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => onRemediate(finding)}
        >
          <RemediationIcon size={14} />
          <span>Self-Heal Finding</span>
        </button>
      </div>
    </div>
  );
}
