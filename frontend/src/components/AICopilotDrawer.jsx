import React from 'react';

export default function AICopilotDrawer({ analysis, loading, onClose }) {
  if (!analysis && !loading) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: '580px',
      backgroundColor: 'rgba(10, 14, 26, 0.98)',
      backdropFilter: 'blur(20px)',
      borderLeft: '1px solid var(--border-cyan)',
      boxShadow: '-10px 0 40px rgba(0, 245, 255, 0.2)',
      zIndex: 110,
      display: 'flex',
      flexDirection: 'column',
      animation: 'slideIn 0.25s ease-out'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'linear-gradient(90deg, rgba(0,245,255,0.08) 0%, transparent 100%)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="pulse-indicator"></span>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--cyan-glow)' }}>
              Gemini AI Cyber Advisor
            </h3>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Deep threat modeling, blast radius analysis & root cause isolation
            </p>
          </div>
        </div>
        <button 
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.25rem', cursor: 'pointer' }}
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px' }}>
            <span className="pulse-indicator" style={{ width: '20px', height: '20px' }}></span>
            <p style={{ fontSize: '0.9rem', color: 'var(--cyan-glow)', fontFamily: 'var(--font-mono)' }}>
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
              borderRadius: 'var(--radius-md)',
              background: 'rgba(0, 245, 255, 0.06)',
              border: '1px solid rgba(0, 245, 255, 0.2)'
            }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Inference Engine: </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--cyan-glow)', fontFamily: 'var(--font-mono)' }}>
                  {analysis.model_used}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                ⚡ {analysis.latency_ms}ms latency
              </div>
            </div>

            {/* Executive Summary */}
            <div className="cyber-card" style={{ padding: '16px' }}>
              <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--cyan-glow)', marginBottom: '8px', fontWeight: 700 }}>
                Executive Assessment
              </h4>
              <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: '#fff' }}>{analysis.summary}</p>
            </div>

            {/* Root Cause & Blast Radius */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--sev-critical)', marginBottom: '6px', fontWeight: 700 }}>
                  🚨 Root Cause Misconfiguration
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#fca5a5', lineHeight: 1.5 }}>{analysis.root_cause}</p>
              </div>

              <div style={{ background: 'rgba(249, 115, 22, 0.08)', border: '1px solid rgba(249, 115, 22, 0.2)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--sev-high)', marginBottom: '6px', fontWeight: 700 }}>
                  💥 Blast Radius & Potential Impact
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#fdba74', lineHeight: 1.5 }}>{analysis.blast_radius}</p>
              </div>
            </div>

            {/* MITRE ATT&CK */}
            {analysis.mitre_attack_tactics && analysis.mitre_attack_tactics.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  MITRE ATT&CK Framework Mappings
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {analysis.mitre_attack_tactics.map((tactic, i) => (
                    <span key={i} className="badge badge-high" style={{ fontSize: '0.75rem' }}>
                      {tactic}
                    </span>
                  ))}
                  {analysis.mitre_attack_techniques?.map((tech, i) => (
                    <span key={i} className="badge badge-low" style={{ fontSize: '0.75rem' }}>
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Remediation Steps */}
            {analysis.remediation_steps && (
              <div>
                <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--cyan-glow)', marginBottom: '10px', fontWeight: 700 }}>
                  🛡️ AI Containment & Fix Roadmap
                </h4>
                <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
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
