import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function IncidentsPage({ onNavigateToRemediate }) {
  const [incidents, setIncidents] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIncidents();
  }, []);

  async function loadIncidents() {
    setLoading(true);
    try {
      const data = await api.getIncidents();
      setIncidents(data);
      if (data.length > 0) {
        setSelectedIncident(data[0]);
        loadTimeline(data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadTimeline(incidentId) {
    try {
      const tl = await api.getIncidentTimeline(incidentId);
      setTimeline(tl);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>Correlated Incident Investigations</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Multi-asset attack graph correlations combining rule violations, Isolation Forest anomaly events, and blast radius.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <span className="pulse-indicator"></span> Loading incident forensic graph...
        </div>
      ) : incidents.length === 0 ? (
        <div className="cyber-card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: 'var(--text-muted)' }}>No active incidents detected.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '20px' }}>
          {/* Incident List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {incidents.map((inc) => {
              const isSel = selectedIncident?.id === inc.id;
              return (
                <div
                  key={inc.id}
                  className="cyber-card"
                  style={{
                    cursor: 'pointer',
                    borderColor: isSel ? 'var(--cyan-glow)' : 'var(--border-subtle)',
                    padding: '16px'
                  }}
                  onClick={() => {
                    setSelectedIncident(inc);
                    loadTimeline(inc.id);
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span className="badge badge-critical">{inc.severity}</span>
                    <span className="badge badge-low" style={{ fontSize: '0.65rem' }}>{inc.status}</span>
                  </div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>{inc.title}</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Detected: {new Date(inc.detected_at).toLocaleTimeString()}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Incident Forensic Detail */}
          {selectedIncident && (
            <div className="cyber-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span className="badge badge-critical">{selectedIncident.severity}</span>
                  <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{selectedIncident.id}</span>
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>{selectedIncident.title}</h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '6px' }}>{selectedIncident.description}</p>
              </div>

              {/* MITRE ATT&CK Mapping */}
              {selectedIncident.mitre_attack_tactics && (
                <div>
                  <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--cyan-glow)', marginBottom: '8px', fontWeight: 700 }}>
                    MITRE ATT&CK Tactics & Techniques
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {selectedIncident.mitre_attack_tactics.map((t, i) => (
                      <span key={i} className="badge badge-high">{t}</span>
                    ))}
                    {selectedIncident.mitre_attack_techniques?.map((tech, i) => (
                      <span key={i} className="badge badge-low">{tech}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Blast Radius & AI Containment Plan */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--sev-critical)', marginBottom: '6px', fontWeight: 700 }}>
                    💥 Blast Radius
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: '#fca5a5' }}>{selectedIncident.blast_radius_summary}</p>
                </div>

                <div style={{ background: 'rgba(0, 245, 255, 0.08)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0,245,255,0.2)' }}>
                  <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--cyan-glow)', marginBottom: '6px', fontWeight: 700 }}>
                    🛡️ AI Containment Roadmap
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: '#a5f3fc' }}>{selectedIncident.ai_containment_plan}</p>
                </div>
              </div>

              {/* Timeline Log */}
              <div>
                <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '10px', fontWeight: 700 }}>
                  Forensic Timeline Ledger
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {timeline.map((t) => (
                    <div key={t.id} style={{ display: 'flex', gap: '12px', background: 'rgba(0,0,0,0.2)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--cyan-glow)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', minWidth: '70px' }}>
                        {new Date(t.created_at).toLocaleTimeString()}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>{t.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
