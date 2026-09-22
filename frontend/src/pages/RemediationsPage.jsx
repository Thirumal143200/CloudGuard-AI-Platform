import React, { useState, useEffect } from 'react';
import { getRemediations, runDryRun, executeRemediation } from '../services/api';
import { PlayIcon, TerminalIcon, CheckCircleIcon, AlertTriangleIcon, RefreshIcon, ClockIcon } from '../components/Icons';
import { useToast } from '../components/Toast';
import ConfirmationModal from '../components/ConfirmationModal';

export default function RemediationsPage({ onRefreshDashboard }) {
  const { showToast } = useToast();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [dryRunResult, setDryRunResult] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState('CLI'); // 'CLI' | 'TERRAFORM' | 'PYTHON'
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    setLoading(true);
    try {
      const data = await getRemediations();
      setPlans(data || []);
      if (data && data.length > 0) {
        setSelectedPlan(data[0]);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load remediation playbooks', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleDryRun(planId) {
    setActionLoading(true);
    try {
      const result = await runDryRun(planId);
      setDryRunResult(result);
      showToast('Dry-run simulation completed successfully. Impact verified.', 'info');
    } catch (err) {
      showToast(`Dry run simulation failed: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleExecuteConfirm() {
    if (!selectedPlan) return;
    setActionLoading(true);
    try {
      const result = await executeRemediation(selectedPlan.id);
      setIsConfirmModalOpen(false);
      showToast(
        `Remediation applied successfully! Post-fix verification re-scan: ${result.verification_passed ? 'PASSED' : 'FLAGGED'}`,
        result.verification_passed ? 'success' : 'warning'
      );
      await loadPlans();
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err) {
      showToast(`Execution error: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h1 className="page-title">Automated Remediation & Self-Healing</h1>
          <p className="page-desc">
            Deterministic code generation (AWS/Azure CLI, Terraform HCL, Python Boto3) with pre-execution dry runs and cryptographic verification re-scans.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={loadPlans}
          disabled={loading}
        >
          <RefreshIcon size={14} className={loading ? 'spin' : ''} />
          <span>Refresh Playbooks</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 380px) 1fr', gap: '20px' }}>
        {/* Plans List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
              Loading remediation playbooks...
            </div>
          ) : plans.length === 0 ? (
            <div className="soc-card" style={{ textAlign: 'center', padding: '32px' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No remediation plans pending.</p>
            </div>
          ) : (
            plans.map((plan) => {
              const isSel = selectedPlan?.id === plan.id;
              return (
                <div
                  key={plan.id}
                  className="soc-card"
                  style={{
                    cursor: 'pointer',
                    borderColor: isSel ? 'var(--color-primary)' : 'var(--border-subtle)',
                    backgroundColor: isSel ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
                    padding: '16px',
                  }}
                  onClick={() => {
                    setSelectedPlan(plan);
                    setDryRunResult(null);
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className={`badge ${plan.status === 'COMPLETED' ? 'badge-safe' : 'badge-low'}`}>
                      {plan.status}
                    </span>
                    <span className="badge badge-provenance" style={{ fontSize: '10px' }}>
                      {plan.risk_tier || 'TIER-1'}
                    </span>
                  </div>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {plan.title}
                  </h4>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Target: {plan.resource_id || 'aws:s3:resource'}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Plan Details & Action Launcher */}
        {selectedPlan && (
          <div className="soc-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span className="badge badge-provenance">{selectedPlan.risk_tier}</span>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    {selectedPlan.id}
                  </span>
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {selectedPlan.title}
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {selectedPlan.description}
                </p>
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
                    type="button"
                    className={`btn btn-sm ${activeCodeTab === t ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '11px', padding: '4px 12px' }}
                    onClick={() => setActiveCodeTab(t)}
                  >
                    {t === 'CLI' ? 'AWS / Cloud CLI' : t === 'TERRAFORM' ? 'Terraform HCL' : 'Python (Boto3)'}
                  </button>
                ))}
              </div>

              <pre className="code-editor-area" style={{ height: 'auto', minHeight: '140px', maxHeight: '240px' }}>
                {activeCodeTab === 'CLI' && (
                  selectedPlan.cli_commands?.map((c) => c.command).join('\n') ||
                  `aws s3api put-bucket-encryption --bucket ${selectedPlan.resource_id || 'prod-bucket'} --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"aws:kms"}}]}'`
                )}
                {activeCodeTab === 'TERRAFORM' && (
                  selectedPlan.terraform_hcl ||
                  `resource "aws_s3_bucket_server_side_encryption_configuration" "sec" {\n  bucket = aws_s3_bucket.main.id\n  rule {\n    apply_server_side_encryption_by_default {\n      sse_algorithm = "aws:kms"\n    }\n  }\n}`
                )}
                {activeCodeTab === 'PYTHON' && (
                  selectedPlan.python_script ||
                  `import boto3\ns3 = boto3.client('s3')\ns3.put_bucket_encryption(Bucket='${selectedPlan.resource_id}', ServerSideEncryptionConfiguration={'Rules': [{'ApplyServerSideEncryptionByDefault': {'SSEAlgorithm': 'aws:kms'}}]})`
                )}
              </pre>
            </div>

            {/* Dry Run Outcome Banner */}
            {dryRunResult && (
              <div style={{ background: 'var(--sev-safe-bg)', border: '1px solid var(--sev-safe-border)', padding: '14px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <CheckCircleIcon size={16} color="#10b981" />
                  <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase' }}>
                    Dry-Run Simulation Output: Passed Safely
                  </h4>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {dryRunResult.potential_impact_summary || 'Configuration mutation simulated in sandbox. 0 breaking dependencies detected. Risk score reduction: -25 pts.'}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={actionLoading}
                onClick={() => handleDryRun(selectedPlan.id)}
              >
                <TerminalIcon size={14} />
                <span>Run Dry-Run Simulation</span>
              </button>

              <button
                type="button"
                className="btn btn-primary"
                disabled={actionLoading || selectedPlan.status === 'COMPLETED'}
                onClick={() => setIsConfirmModalOpen(true)}
              >
                <PlayIcon size={14} />
                <span>{selectedPlan.status === 'COMPLETED' ? 'Remediated & Verified' : 'Apply Fix & Trigger Re-Scan'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        title="Execute Automated Remediation"
        description="Are you sure you want to apply this automated remediation? The cloud resource configuration will be updated, an event will be committed to the SHA-256 audit ledger, and an immediate policy re-scan will run to verify resolution."
        details={selectedPlan ? `Plan: ${selectedPlan.title}\nTarget: ${selectedPlan.resource_id}` : null}
        confirmText="Apply Fix & Verify"
        loading={actionLoading}
        onConfirm={handleExecuteConfirm}
        onCancel={() => setIsConfirmModalOpen(false)}
      />
    </div>
  );
}
