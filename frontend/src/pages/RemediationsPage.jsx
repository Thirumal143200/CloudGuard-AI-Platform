import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function RemediationsPage({ onRefreshDashboard }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [dryRunResult, setDryRunResult] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState('CLI'); // 'CLI' | 'TERRAFORM' | 'PYTHON'

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    setLoading(true);
    try {
      const data = await api.getRemediations();
      setPlans(data);
      if (data.length > 0) {
        setSelectedPlan(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDryRun(planId) {
    setActionLoading(true);
    try {
      const result = await api.runDryRun(planId);
      setDryRunResult(result);
    } catch (err) {
      alert(`Dry run failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleExecute(planId) {
    if (!confirm('Are you sure you want to apply this automated remediation and execute post-verification re-scan?')) {
      return;
    }
    setActionLoading(true);
    try {
      const result = await api.executeRemediation(planId);
      alert(`Remediation executed successfully! Verification Re-Scan: ${result.verification_passed ? 'PASSED' : 'FAILED'}`);
      await loadPlans();
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err) {
      alert(`Execution error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>Automated Self-Healing Remediation</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Multi-format code generation (AWS/Azure CLI, Terraform HCL, Python Boto3) with pre-execution dry runs and verification re-scans.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '20px' }}>
        {/* Plans List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}><span className="pulse-indicator"></span> Loading plans...</div>
          ) : plans.map((plan) => {
            const isSel = selectedPlan?.id === plan.id;
            return (
              <div
                key={plan.id}
                className="cyber-card"
                style={{
                  cursor: 'pointer',
                  borderColor: isSel ? 'var(--cyan-glow)' : 'var(--border-subtle)',
                  padding: '16px'
                }}
                onClick={() => {
                  setSelectedPlan(plan);
                  setDryRunResult(null);
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span className={`badge ${plan.status === 'COMPLETED' ? 'badge-safe' : 'badge-low'}`}>{plan.status}</span>
                  <span className="badge badge-ai" style={{ fontSize: '0.65rem' }}>{plan.risk_tier}</span>
                </div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>{plan.title}</h4>
              </div>
            );
          })}
        </div>

        {/* Selected Plan Details & Action Launcher */}
        {selectedPlan && (
          <div className="cyber-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span className="badge badge-ai">{selectedPlan.risk_tier}</span>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{selectedPlan.id}</span>
                </div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>{selectedPlan.title}</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{selectedPlan.description}</p>
              </div>

              <span className={`badge ${selectedPlan.status === 'COMPLETED' ? 'badge-safe' : 'badge-low'}`}>
                {selectedPlan.status}
              </span>
            </div>

            {/* Code Format Tabs */}
            <div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                {['CLI', 'TERRAFORM', 'PYTHON'].map((t) => (
                  <button
                    key={t}
                    className={`btn btn-sm ${activeCodeTab === t ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveCodeTab(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="code-box">
                {activeCodeTab === 'CLI' && (
                  selectedPlan.cli_commands?.map((c, i) => c.command).join('\n') || '# No CLI command available'
                )}
                {activeCodeTab === 'TERRAFORM' && (
                  selectedPlan.terraform_hcl || '# No Terraform HCL available'
                )}
                {activeCodeTab === 'PYTHON' && (
                  selectedPlan.python_script || '# No Python SDK script available'
                )}
              </div>
            </div>

            {/* Dry Run Outcome Banner */}
            {dryRunResult && (
              <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className="pulse-indicator green"></span>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--sev-safe)', textTransform: 'uppercase' }}>
                    Dry-Run Simulation Output: Passed
                  </h4>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{dryRunResult.potential_impact_summary}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
              <button 
                className="btn btn-secondary"
                disabled={actionLoading}
                onClick={() => handleDryRun(selectedPlan.id)}
              >
                🔬 Run Dry-Run Simulation
              </button>

              <button 
                className="btn btn-primary"
                disabled={actionLoading || selectedPlan.status === 'COMPLETED'}
                onClick={() => handleExecute(selectedPlan.id)}
              >
                {selectedPlan.status === 'COMPLETED' ? '✓ Remediated & Verified' : '⚡ Apply Fix & Re-Scan'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
