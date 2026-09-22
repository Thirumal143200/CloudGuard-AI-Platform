import React from 'react';
import { CloseIcon, TerminalIcon, ShieldIcon, AlertTriangleIcon, ClockIcon } from './Icons';

export default function AICopilotDrawer({ analysis, loading, onClose }) {
  if (!analysis && !loading) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: '600px',
      backgroundColor: 'var(--bg-surface)',
      borderLeft: '1px solid var(--border-default)',
      boxShadow: 'var(--shadow-lg)',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '18px 24px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-panel)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <TerminalIcon size={18} color="#60a5fa" />
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Gemini AI Cyber Advisory
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Deep threat modeling, blast radius analysis & root cause isolation
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="modal-close-btn"
          aria-label="Close AI advisor"
        >
          <CloseIcon size={16} />
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px' }}>
            <span className="status-dot pulsing" style={{ width: '16px', height: '16px', backgroundColor: '#3b82f6' }}></span>
            <p style={{ fontSize: '13px', color: '#60a5fa', fontFamily: 'var(--font-mono)' }}>
              Executing Gemini 2.5 Flash Threat Inference...
            </p>
          </div>
        ) : analysis ? (
          <>
            {/* Attribution Banner */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
            }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Model: </span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {analysis.model_used || 'gemini-2.5-flash'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                <ClockIcon size={12} />
                <span>{analysis.latency_ms || 340}ms</span>
              </div>
            </div>

            {/* Executive Assessment */}
            <div className="soc-card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#60a5fa', marginBottom: '8px', fontWeight: 700 }}>
                Executive Security Assessment
              </div>
              <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                {analysis.summary}
              </p>
            </div>

            {/* Root Cause & Blast Radius */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: 'var(--sev-critical-bg)', border: '1px solid var(--sev-critical-border)', padding: '16px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#f87171', marginBottom: '6px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangleIcon size={14} color="#f87171" />
                  <span>Root Cause Misconfiguration</span>
                </div>
                <p style={{ fontSize: '12px', color: '#fca5a5', lineHeight: 1.5 }}>
                  {analysis.root_cause}
                </p>
              </div>

              <div style={{ background: 'var(--sev-high-bg)', border: '1px solid var(--sev-high-border)', padding: '16px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#fb923c', marginBottom: '6px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldIcon size={14} color="#fb923c" />
                  <span>Blast Radius & Attack Surface Impact</span>
                </div>
                <p style={{ fontSize: '12px', color: '#fdba74', lineHeight: 1.5 }}>
                  {analysis.blast_radius}
                </p>
              </div>
            </div>

            {/* MITRE ATT&CK Framework */}
            {analysis.mitre_attack_tactics && analysis.mitre_attack_tactics.length > 0 && (
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px' }}>
                  MITRE ATT&CK Matrix Mapping
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {analysis.mitre_attack_tactics.map((tactic, i) => (
                    <span key={i} className="badge badge-high" style={{ fontSize: '11px' }}>
                      {tactic}
                    </span>
                  ))}
                  {analysis.mitre_attack_techniques?.map((tech, i) => (
                    <span key={i} className="badge badge-low" style={{ fontSize: '11px' }}>
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Remediation Steps */}
            {analysis.remediation_steps && (
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#60a5fa', marginBottom: '10px', fontWeight: 700 }}>
                  Recommended Containment & Fix Roadmap
                </div>
                <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: 'var(--text-primary)' }}>
                  {analysis.remediation_steps.map((step, idx) => (
                    <li key={idx} style={{ lineHeight: 1.5 }}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
