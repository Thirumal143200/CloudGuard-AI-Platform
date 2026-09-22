import React, { useState, useEffect } from 'react';
import { getResources } from '../services/api';
import { SearchIcon, RefreshIcon, CloseIcon, CloudIcon, ShieldIcon } from '../components/Icons';
import { useToast } from '../components/Toast';

export default function AssetsPage() {
  const { showToast } = useToast();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [providerFilter, setProviderFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedResource, setSelectedResource] = useState(null);

  useEffect(() => {
    loadResources();
  }, [providerFilter]);

  async function loadResources() {
    setLoading(true);
    try {
      const params = providerFilter !== 'ALL' ? { provider: providerFilter } : {};
      const data = await getResources(params);
      setResources(data || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load asset inventory', 'error');
    } finally {
      setLoading(false);
    }
  }

  const filteredResources = resources.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.name?.toLowerCase().includes(q) ||
      r.native_id?.toLowerCase().includes(q) ||
      r.resource_type?.toLowerCase().includes(q) ||
      r.region?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h1 className="page-title">Multi-Cloud Asset Inventory</h1>
          <p className="page-desc">
            Continuous discovery and real-time posture tracking of storage buckets, security groups, IAM identities, and compute workloads.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={loadResources}
          disabled={loading}
        >
          <RefreshIcon size={14} className={loading ? 'spin' : ''} />
          <span>Refresh Assets</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="input-search-wrap">
          <SearchIcon size={14} className="input-search-icon" />
          <input
            type="text"
            className="soc-input"
            placeholder="Search assets by name, ARN/ID, type, or region..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Provider Tabs */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-panel)', padding: '4px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          {['ALL', 'AWS', 'Azure', 'GCP'].map((p) => (
            <button
              key={p}
              type="button"
              className={`btn btn-sm ${providerFilter === p ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '4px 12px', fontSize: '11px' }}
              onClick={() => setProviderFilter(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Assets Table */}
      <div className="table-container">
        <table className="soc-table">
          <thead>
            <tr>
              <th>Resource Name & ID</th>
              <th>Cloud Provider</th>
              <th>Resource Type</th>
              <th>Region</th>
              <th>Posture Risk Score</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Loading asset inventory...
                </td>
              </tr>
            ) : filteredResources.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No cloud assets found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredResources.map((res) => (
                <tr key={res.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{res.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                      {res.native_id || res.id}
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-provenance ${res.provider === 'aws' ? 'badge-provenance-aws' : res.provider === 'azure' ? 'badge-provenance-azure' : 'badge-provenance-gcp'}`}>
                      {res.provider?.toUpperCase() || 'AWS'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      {res.resource_type}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {res.region}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${res.risk_score >= 80 ? 'badge-critical' : res.risk_score >= 50 ? 'badge-high' : 'badge-safe'}`}>
                      {res.risk_score} / 100
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSelectedResource(res)}
                    >
                      Inspect Config
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Asset Config Modal */}
      {selectedResource && (
        <div className="modal-backdrop" onClick={() => setSelectedResource(null)}>
          <div className="modal-container" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <CloudIcon size={18} color="#60a5fa" />
                <h3 className="modal-title">Config State: {selectedResource.name}</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedResource(null)}
              >
                <CloseIcon size={16} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                <span className="badge badge-provenance">PROVIDER: {selectedResource.provider?.toUpperCase()}</span>
                <span className="badge badge-provenance">REGION: {selectedResource.region}</span>
              </div>
              <pre className="code-editor-area" style={{ height: '300px' }}>
                {JSON.stringify(selectedResource.configuration || {}, null, 2)}
              </pre>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedResource(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
