import React, { useState, useEffect } from 'react';
import { ComplianceIcon, ShieldIcon, CheckCircleIcon, AlertTriangleIcon, RefreshIcon } from '../components/Icons';
import { useToast } from '../components/Toast';
import { getComplianceFrameworks } from '../services/api';

export default function CompliancePage() {
  const { showToast } = useToast();
  const [frameworks, setFrameworks] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getComplianceFrameworks();
      setFrameworks(data || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load compliance frameworks', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h1 className="page-title">Regulatory & Framework Compliance</h1>
          <p className="page-desc">
            Continuous automated benchmark auditing mapped to CIS Cloud Benchmarks, PCI-DSS 4.0, SOC 2 Type II, and ISO 27001.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={loadData}
          disabled={loading}
        >
          <RefreshIcon size={14} className={loading ? 'spin' : ''} />
          <span>Refresh Compliance</span>
        </button>
      </div>

      {/* Compliance Frameworks Scorecards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {frameworks.map((fw) => {
          const passPercent = fw.total_controls > 0 
            ? Math.round((fw.passing_controls / fw.total_controls) * 100) 
            : 0;

          return (
            <div key={fw.framework_id || fw.name} className="soc-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {fw.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '2px' }}>
                    {fw.category || 'Security Benchmark'}
                  </div>
                </div>
                <span className={`badge ${passPercent >= 80 ? 'badge-safe' : passPercent >= 50 ? 'badge-medium' : 'badge-critical'}`}>
                  {passPercent}% COMPLIANT
                </span>
              </div>

              {/* Progress bar */}
              <div style={{ width: '100%', height: '8px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    height: '100%', 
                    width: `${passPercent}%`, 
                    background: passPercent >= 80 ? '#10b981' : passPercent >= 50 ? '#f59e0b' : '#ef4444',
                    transition: 'width 0.4s ease'
                  }} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    {fw.total_controls}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Total
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                    {fw.passing_controls}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Passing
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#f87171', fontFamily: 'var(--font-mono)' }}>
                    {fw.failing_controls}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Failing
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Control Details Checklist */}
      <div className="soc-card">
        <div className="soc-card-header">
          <div className="soc-card-title">
            <ShieldIcon size={18} color="#60a5fa" />
            <span>Key Evaluated Security Controls</span>
          </div>
        </div>

        <table className="soc-table">
          <thead>
            <tr>
              <th>Control ID</th>
              <th>Framework</th>
              <th>Description</th>
              <th>Evaluated Policy</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>CIS 2.1.1</td>
              <td>CIS AWS Foundations</td>
              <td>Ensure S3 Bucket default encryption is enabled</td>
              <td>aws:s3:ServerSideEncryption</td>
              <td><span className="badge badge-critical">NON-COMPLIANT</span></td>
            </tr>
            <tr>
              <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>CIS 2.1.4</td>
              <td>CIS AWS Foundations</td>
              <td>Ensure S3 Bucket Public Access Block is enabled</td>
              <td>aws:s3:PublicAccessBlock</td>
              <td><span className="badge badge-critical">NON-COMPLIANT</span></td>
            </tr>
            <tr>
              <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>CIS 5.2</td>
              <td>CIS AWS Foundations</td>
              <td>Ensure no security groups allow ingress from 0.0.0.0/0 to port 22</td>
              <td>aws:ec2:sg:IngressSSH</td>
              <td><span className="badge badge-critical">NON-COMPLIANT</span></td>
            </tr>
            <tr>
              <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>PCI 3.4</td>
              <td>PCI-DSS 4.0</td>
              <td>Render primary account numbers (PAN) unreadable anywhere it is stored</td>
              <td>pci:data:storage:encryption</td>
              <td><span className="badge badge-medium">INSPECTION REQUIRED</span></td>
            </tr>
            <tr>
              <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>SOC CC6.1</td>
              <td>SOC 2 Type II</td>
              <td>The entity implements logical access security software, infrastructure, and architectures</td>
              <td>soc2:iam:rbac:mfa</td>
              <td><span className="badge badge-safe">COMPLIANT</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
