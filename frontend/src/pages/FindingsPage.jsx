import React, { useState, useEffect } from 'react';
import { getFindings, analyzeFindingAI } from '../services/api';
import EvidenceDrawer from '../components/EvidenceDrawer';
import AICopilotDrawer from '../components/AICopilotDrawer';
import { SearchIcon, RefreshIcon, FilterIcon, TerminalIcon, ShieldIcon } from '../components/Icons';
import { useToast } from '../components/Toast';

export default function FindingsPage({ onNavigateToRemediation }) {
  const { showToast } = useToast();
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [providerFilter, setProviderFilter] = useState('ALL');
  const [search, setSearch] = useState('');

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
      const data = await getFindings(params);
      setFindings(data || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load security findings', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleInvestigateAI(finding) {
    setSelectedFinding(null); // Close evidence drawer
    setAiLoading(true);
    setAiAnalysis(null);
    try {
      const analysis = await analyzeFindingAI(finding.id);
      setAiAnalysis(analysis);
      showToast(`AI Analysis generated for ${finding.rule_id}`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Gemini AI inference request failed', 'error');
    } finally {
      setAiLoading(false);
    }
  }

  const filteredFindings = findings.filter((f) => {
    const matchesSearch =
      f.title?.toLowerCase().includes(search.toLowerCase()) ||
      f.rule_id?.toLowerCase().includes(search.toLowerCase()) ||
      f.resource_id?.toLowerCase().includes(search.toLowerCase());

    const matchesProvider =
      providerFilter === 'ALL' ||
      f.cloud_provider?.toLowerCase() === providerFilter.toLowerCase();

    return matchesSearch && matchesProvider;
  });

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h1 className="page-title">Security Findings & Misconfigurations</h1>
          <p className="page-desc">
            Evaluated by 26+ deterministic CIS Benchmark & PCI-DSS compliance rules with automated Gemini AI root-cause isolation.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={loadFindings}
          disabled={loading}
        >
          <RefreshIcon size={14} className={loading ? 'spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="input-search-wrap">
          <SearchIcon size={14} className="input-search-icon" />
          <input
            type="text"
            className="soc-input"
            placeholder="Search findings by rule ID, title, or resource identifier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="soc-select"
          value={providerFilter}
          onChange={(e) => setProviderFilter(e.target.value)}
        >
          <option value="ALL">All Cloud Providers</option>
          <option value="aws">AWS</option>
          <option value="azure">Azure</option>
          <option value="gcp">GCP</option>
        </select>

        {/* Severity Filter Tabs */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-panel)', padding: '4px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((s) => (
            <button
              key={s}
              type="button"
              className={`btn btn-sm ${severityFilter === s ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '4px 10px', fontSize: '11px' }}
              onClick={() => setSeverityFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Findings Table */}
      <div className="table-container">
        <table className="soc-table">
          <thead>
            <tr>
              <th>Severity</th>
              <th>Finding Title</th>
              <th>Rule ID</th>
              <th>Target Resource & Provenance</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Loading security findings...
                </td>
              </tr>
            ) : filteredFindings.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No security findings matched the selected filters.
                </td>
              </tr>
            ) : (
              filteredFindings.map((f) => (
                <tr key={f.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedFinding(f)}>
                  <td>
                    <span className={`badge badge-${f.severity?.toLowerCase()}`}>
                      {f.severity}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{f.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {f.category || 'Cloud Configuration'}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {f.rule_id}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                      {f.resource_id}
                    </div>
                    <span className={`badge badge-provenance ${f.cloud_provider === 'aws' ? 'badge-provenance-aws' : f.cloud_provider === 'azure' ? 'badge-provenance-azure' : 'badge-provenance-gcp'}`} style={{ marginTop: '3px' }}>
                      {f.cloud_provider?.toUpperCase() || 'AWS'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${f.status === 'REMEDIATED' ? 'badge-safe' : 'badge-low'}`}>
                      {f.status}
                    </span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()} style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedFinding(f)}
                      >
                        Evidence
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => handleInvestigateAI(f)}
                      >
                        <TerminalIcon size={12} />
                        <span>Gemini AI</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
