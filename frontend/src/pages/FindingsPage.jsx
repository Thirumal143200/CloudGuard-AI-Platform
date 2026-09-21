import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import EvidenceDrawer from '../components/EvidenceDrawer';
import AICopilotDrawer from '../components/AICopilotDrawer';

export default function FindingsPage({ onNavigateToRemediation }) {
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  
  // Drawer states
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    loadFindings();
  }, [severityFilter]);

  async function loadFindings() {
    setLoading(true);
    try {
      const params = severityFilter !== 'ALL' ? { severity: severityFilter } : {};
      const data = await api.getFindings(params);
      setFindings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleInvestigateAI(finding) {
    setSelectedFinding(null); // Close evidence drawer
    setAiLoading(true);
    setAiAnalysis(null);
    try {
      const analysis = await api.analyzeFindingAI(finding.id);
      setAiAnalysis(analysis);
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>Security Findings & Exposures</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            26+ CIS Benchmark & PCI-DSS rule violations with deterministic evidence extraction.
          </p>
        </div>

        {/* Severity Filters */}
        <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-surface-elevated)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((s) => (
            <button
              key={s}
              className={`btn btn-sm ${severityFilter === s ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSeverityFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Findings Table */}
      <div className="cyber-card" style={{ padding: '0' }}>
        <div className="cyber-table-container">
          <table className="cyber-table">
            <thead>
              <tr>
                <th>Severity</th>
                <th>Finding Title</th>
                <th>Rule ID</th>
                <th>Resource ID</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                    <span className="pulse-indicator"></span> Loading findings...
                  </td>
                </tr>
              ) : findings.map((f) => (
                <tr key={f.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedFinding(f)}>
                  <td>
                    <span className={`badge badge-${f.severity.toLowerCase()}`}>{f.severity}</span>
                  </td>
                  <td style={{ fontWeight: 600, color: '#fff' }}>{f.title}</td>
                  <td style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{f.rule_id}</td>
                  <td style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{f.resource_id}</td>
                  <td>
                    <span className={`badge ${f.status === 'REMEDIATED' ? 'badge-safe' : 'badge-low'}`}>
                      {f.status}
                    </span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedFinding(f)}
                      >
                        Evidence
                      </button>
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => handleInvestigateAI(f)}
                      >
                        Gemini AI
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Evidence Drawer */}
      <EvidenceDrawer
        finding={selectedFinding}
        onClose={() => setSelectedFinding(null)}
        onInvestigateAI={handleInvestigateAI}
        onRemediate={(f) => {
          setSelectedFinding(null);
          onNavigateToRemediation(f);
        }}
      />

      {/* Gemini AI Copilot Drawer */}
      <AICopilotDrawer
        analysis={aiAnalysis}
        loading={aiLoading}
        onClose={() => setAiAnalysis(null)}
      />
    </div>
  );
}
