import React, { useState, useEffect } from 'react';
import { getIncidents, getIncidentTimeline } from '../services/api';
import { IncidentsIcon, ShieldIcon, AlertTriangleIcon, ClockIcon, RemediationIcon, RefreshIcon } from '../components/Icons';
import { useToast } from '../components/Toast';

export default function IncidentsPage({ onNavigateToRemediate }) {
  const { showToast } = useToast();
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
      const data = await getIncidents();
      setIncidents(data || []);
      if (data && data.length > 0) {
        setSelectedIncident(data[0]);
        loadTimeline(data[0].id);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load correlated incidents', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function loadTimeline(incidentId) {
    try {
      const tl = await getIncidentTimeline(incidentId);
      setTimeline(tl || []);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h1 className="page-title">Correlated Incident Investigations</h1>
          <p className="page-desc">
            Multi-asset attack graph correlations combining deterministic rule violations, Isolation Forest anomaly events, and automated blast radius containment.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={loadIncidents}
          disabled={loading}
        >
          <RefreshIcon size={14} className={loading ? 'spin' : ''} />
          <span>Refresh Incidents</span>
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
          Loading incident forensic graph...
        </div>
      ) : incidents.length === 0 ? (
        <div className="soc-card" style={{ textAlign: 'center', padding: '48px' }}>
          <div className="empty-state-icon" style={{ margin: '0 auto 12px' }}>
            <IncidentsIcon size={24} color="#10b981" />
          </div>
          <h3 className="empty-state-title">No Active Incidents Detected</h3>
          <p className="empty-state-desc" style={{ margin: '0 auto' }}>
            Telemetry streams and anomaly detectors indicate nominal operational posture.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 380px) 1fr', gap: '20px' }}>
          {/* Incident List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {incidents.map((inc) => {
              const isSel = selectedIncident?.id === inc.id;
              return (
                <div
                  key={inc.id}
                  className="soc-card"
                  style={{
                    cursor: 'pointer',
                    borderColor: isSel ? 'var(--color-primary)' : 'var(--border-subtle)',
                    backgroundColor: isSel ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
                    padding: '16px',
                  }}
                  onClick={() => {
                    setSelectedIncident(inc);
                    loadTimeline(inc.id);
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className={`badge badge-${inc.severity?.toLowerCase()}`}>
                      {inc.severity}
                    </span>
                    <span className="badge badge-provenance" style={{ fontSize: '10px' }}>
                      {inc.status}
                    </span>
                  </div>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px', lineHeight: 1.3 }}>
                    {inc.title}
                  </h4>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ClockIcon size={12} />
                    <span>Detected: {new Date(inc.detected_at).toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Incident Forensic Detail */}
          {selectedIncident && (
            <div className="soc-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span className={`badge badge-${selectedIncident.severity?.toLowerCase()}`}>
                      {selectedIncident.severity}
                    </span>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      INCIDENT-{selectedIncident.id}
                    </span>
                  </div>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {selectedIncident.title}
                  </h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.5 }}>
                    {selectedIncident.description}
                  </p>
                </div>

                {onNavigateToRemediate && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => onNavigateToRemediate(selectedIncident)}
                  >
                    <RemediationIcon size={14} />
                    <span>Launch Containment Playbook</span>
                  </button>
                )}
              </div>

              {/* MITRE ATT&CK Mapping */}
              {selectedIncident.mitre_attack_tactics && selectedIncident.mitre_attack_tactics.length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px' }}>
                    Correlated MITRE ATT&CK Matrix
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {selectedIncident.mitre_attack_tactics.map((t, i) => (
                      <span key={i} className="badge badge-high" style={{ fontSize: '11px' }}>
                        {t}
                      </span>
                    ))}
                    {selectedIncident.mitre_attack_techniques?.map((tech, i) => (
                      <span key={i} className="badge badge-low" style={{ fontSize: '11px' }}>
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Blast Radius & AI Containment Plan */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                <div style={{ background: 'var(--sev-critical-bg)', border: '1px solid var(--sev-critical-border)', padding: '14px', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#f87171', marginBottom: '6px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangleIcon size={14} color="#f87171" />
                    <span>Isolated Blast Radius</span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#fca5a5', lineHeight: 1.5 }}>
                    {selectedIncident.blast_radius_summary || 'Multi-asset propagation path mapped across storage and IAM.'}
                  </p>
                </div>

                <div style={{ background: 'rgba(37, 99, 235, 0.08)', border: '1px solid rgba(37, 99, 235, 0.25)', padding: '14px', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#60a5fa', marginBottom: '6px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldIcon size={14} color="#60a5fa" />
                    <span>Gemini AI Containment Roadmap</span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#93c5fd', lineHeight: 1.5 }}>
                    {selectedIncident.ai_containment_plan || '1) Revoke unattached access keys; 2) Enforce S3 block public access; 3) Re-evaluate CIS 2.1.'}
                  </p>
                </div>
              </div>

              {/* Forensic Timeline Ledger */}
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '10px' }}>
                  Forensic Timeline Ledger ({timeline.length} Events)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {timeline.length === 0 ? (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      No timeline events recorded for this incident.
                    </div>
                  ) : (
                    timeline.map((evt, idx) => (
                      <div
                        key={evt.id || idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          background: 'var(--bg-input)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className={`status-dot ${evt.is_anomaly ? 'danger' : 'warning'}`}></span>
                          <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500 }}>
                            {evt.event_name || evt.summary}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {new Date(evt.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
