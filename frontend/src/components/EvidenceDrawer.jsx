import React, { useState } from 'react';

export default function EvidenceDrawer({ finding, onClose, onInvestigateAI, onRemediate }) {
  if (!finding) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: '560px',
      backgroundColor: 'rgba(11, 17, 33, 0.98)',
      backdropFilter: 'blur(20px)',
      borderLeft: '1px solid var(--border-subtle)',
      boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.7)',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      animation: 'slideIn 0.25s ease-out'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        background: 'rgba(17, 24, 39, 0.5)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className={`badge badge-${finding.severity.toLowerCase()}`}>{finding.severity}</span>
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{finding.rule_id}</span>
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>{finding.title}</h3>
        </div>
        <button 
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '1.25rem',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Description */}
        <div>
          <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px' }}>Summary</h4>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{finding.description}</p>
        </div>

        {/* 4-Pillar Breakdown */}
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--cyan-glow)', marginBottom: '8px', fontWeight: 700 }}>
            4-Pillar Risk Engine Contribution
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Pillar 1: Base Severity</span>
              <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>40% Weight</p>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Pillar 2: Reachability</span>
              <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>30% Weight</p>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Pillar 3: Asset Tier</span>
              <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>20% Weight</p>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Pillar 4: ML Anomaly</span>
              <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>10% Weight</p>
            </div>
          </div>
        </div>

        {/* Raw Technical Evidence */}
        <div>
          <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Raw Audit Evidence (JSON)
          </h4>
          <div className="code-box">
            {JSON.stringify(finding.raw_evidence || { rule: finding.rule_id, resource: finding.resource_id }, null, 2)}
          </div>
        </div>

        {/* Compliance Mappings */}
        {finding.compliance_controls && finding.compliance_controls.length > 0 && (
          <div>
            <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Violated Compliance Standards
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {finding.compliance_controls.map((ctrl, i) => (
                <span key={i} className="badge badge-low" style={{ fontSize: '0.7rem' }}>
                  {ctrl}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Guidance */}
        {finding.remediation_guidance && (
          <div>
            <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Remediation Guidance
            </h4>
            <div className="code-box" style={{ color: '#a7f3d0' }}>
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
        background: 'rgba(17, 24, 39, 0.7)'
      }}>
        <button 
          className="btn btn-secondary"
          onClick={() => onInvestigateAI(finding)}
        >
          <span className="pulse-indicator" style={{ marginRight: '4px' }}></span>
          Investigate with Gemini AI
        </button>

        <button 
          className="btn btn-primary"
          onClick={() => onRemediate(finding)}
        >
          ⚡ Self-Heal Finding
        </button>
      </div>
    </div>
  );
}
