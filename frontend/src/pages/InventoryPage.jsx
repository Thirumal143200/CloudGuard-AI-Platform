import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function InventoryPage() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [providerFilter, setProviderFilter] = useState('ALL');
  const [selectedResource, setSelectedResource] = useState(null);

  useEffect(() => {
    loadResources();
  }, [providerFilter]);

  async function loadResources() {
    setLoading(true);
    try {
      const params = providerFilter !== 'ALL' ? { provider: providerFilter } : {};
      const data = await api.getResources(params);
      setResources(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>Multi-Cloud Asset Inventory</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Continuous discovery of storage buckets, security groups, IAM users, databases, and compute workloads.
          </p>
        </div>

        {/* Provider Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-surface-elevated)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
          {['ALL', 'AWS', 'Azure', 'GCP'].map((p) => (
            <button
              key={p}
              className={`btn btn-sm ${providerFilter === p ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setProviderFilter(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Assets Table */}
      <div className="cyber-card" style={{ padding: '0' }}>
        <div className="cyber-table-container">
          <table className="cyber-table">
            <thead>
              <tr>
                <th>Resource Name</th>
                <th>Cloud Provider</th>
                <th>Type</th>
                <th>Region</th>
                <th>Risk Score</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                    <span className="pulse-indicator"></span> Loading inventory...
                  </td>
                </tr>
              ) : resources.map((res) => (
                <tr key={res.id}>
                  <td style={{ fontWeight: 600, color: '#fff' }}>
                    {res.name}
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{res.native_id}</div>
                  </td>
                  <td>
                    <span className="badge badge-low" style={{ fontSize: '0.7rem' }}>{res.provider}</span>
                  </td>
                  <td style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{res.resource_type}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{res.region}</td>
                  <td>
                    <span className={`badge ${res.risk_score >= 80 ? 'badge-critical' : res.risk_score >= 50 ? 'badge-high' : 'badge-safe'}`}>
                      {res.risk_score} / 100
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSelectedResource(res)}
                    >
                      Inspect Config
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Config Inspector Modal */}
      {selectedResource && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 120
        }}>
          <div className="cyber-card" style={{ width: '600px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>Asset Config: {selectedResource.name}</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedResource(null)}>✕</button>
            </div>
            <div className="code-box">
              {JSON.stringify(selectedResource.configuration, null, 2)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
