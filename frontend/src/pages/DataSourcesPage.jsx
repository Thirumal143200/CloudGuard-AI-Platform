import React, { useState, useEffect, useRef } from 'react';
import {
  DataSourcesIcon,
  CloudIcon,
  UploadIcon,
  RefreshIcon,
  TrashIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  TerminalIcon,
  CopyIcon,
  CheckIcon,
  ShieldIcon,
} from '../components/Icons';
import { useToast } from '../components/Toast';
import ConfirmationModal from '../components/ConfirmationModal';
import {
  getDataSources,
  uploadSecurityFile,
  uploadEvidence,
  getIngestionJobs,
  triggerRescan,
  clearAllData,
  seedDemoData,
} from '../services/api';

// Pre-bundled realistic sample templates
const SAMPLES = {
  json: {
    filename: 'aws_security_export.json',
    format: 'JSON (AWS Config / CLI Export)',
    content: JSON.stringify({
      account_id: "123456789012",
      scan_source: "AWS_SECURITY_EXPORT_DEMO",
      resources: [
        {
          native_id: "arn:aws:s3:::prod-customer-financial-records-2026",
          name: "prod-customer-financial-records-2026",
          resource_type: "AWS::S3::Bucket",
          provider: "AWS",
          region: "us-east-1",
          configuration: {
            ServerSideEncryptionConfiguration: null,
            PublicAccessBlockConfiguration: {
              BlockPublicAcls: false,
              IgnorePublicAcls: false,
              BlockPublicPolicy: false,
              RestrictPublicBuckets: false
            },
            Versioning: { Status: "Suspended" },
            Logging: { TargetBucket: null }
          },
          tags: { Environment: "Production", Compliance: "PCI-DSS", Simulated: "True" }
        },
        {
          native_id: "arn:aws:ec2:us-east-1:123456789012:security-group/sg-098234fedcba",
          name: "sg-db-primary-production",
          resource_type: "AWS::EC2::SecurityGroup",
          provider: "AWS",
          region: "us-east-1",
          configuration: {
            IpPermissions: [
              {
                IpProtocol: "tcp",
                FromPort: 22,
                ToPort: 22,
                IpRanges: [{ CidrIp: "0.0.0.0/0", Description: "Public SSH access" }]
              },
              {
                IpProtocol: "tcp",
                FromPort: 5432,
                ToPort: 5432,
                IpRanges: [{ CidrIp: "0.0.0.0/0", Description: "Public Postgres access" }]
              }
            ]
          },
          tags: { Environment: "Production", Tier: "Database", Simulated: "True" }
        }
      ]
    }, null, 2)
  },
  csv: {
    filename: 'aws_security_export.csv',
    format: 'CSV (Asset Inventory Export)',
    content: `name,native_id,resource_type,provider,region,encryption_enabled,public_access,mfa_delete,risk_notes\nprod-patient-records-s3,arn:aws:s3:::prod-patient-records-s3,AWS::S3::Bucket,AWS,us-east-1,false,true,false,Unencrypted bucket containing simulated medical telemetry\nsg-kubernetes-master,sg-0a8b9c1d2e3f4g5,AWS::EC2::SecurityGroup,AWS,us-east-1,false,true,false,Kubernetes API server security group with 0.0.0.0/0 ingress\niam-deployer-admin-keys,AKIAIOSFODNN7EXAMPLE,AWS::IAM::User,AWS,global,false,true,false,Simulated root access keys older than 90 days with AdministratorAccess`
  },
  tf: {
    filename: 'terraform_security_example.tf',
    format: 'Terraform HCL (.tf)',
    content: `# CloudGuard AI Security Evaluation Fixture\n# SIMULATED INFRASTRUCTURE FOR CIS EVALUATION\n\nresource "aws_s3_bucket" "unencrypted_export" {\n  bucket = "prod-confidential-customer-exports-2026"\n  acl    = "public-read"\n\n  tags = {\n    Environment = "production"\n    Compliance  = "HIPAA"\n  }\n}\n\nresource "aws_security_group" "wide_open_ssh" {\n  name        = "sg-dev-bastion-open"\n  description = "Development bastion with open SSH port"\n\n  ingress {\n    from_port   = 22\n    to_port     = 22\n    protocol    = "tcp"\n    cidr_blocks = ["0.0.0.0/0"]\n  }\n}\n`
  }
};

export default function DataSourcesPage({ onDataModified, onNavigateToFindings }) {
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [sources, setSources] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  const [curlCopied, setCurlCopied] = useState(false);

  // Ingestion pipeline progress tracking
  const [uploadProgressStage, setUploadProgressStage] = useState(0); // 0=idle, 1=uploading, 2=parsing, 3=normalizing, 4=rules, 5=complete
  const [lastUploadResult, setLastUploadResult] = useState(null);

  const fetchSourcesAndJobs = async () => {
    try {
      setLoading(true);
      const [sourcesRes, jobsRes] = await Promise.all([
        getDataSources().catch(() => ({ sources: [] })),
        getIngestionJobs().catch(() => ({ jobs: [] })),
      ]);
      setSources(sourcesRes.sources || []);
      setJobs(jobsRes.jobs || []);
    } catch (err) {
      console.error('Failed to load data sources or jobs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSourcesAndJobs();
  }, []);

  const handleFileUpload = async (file) => {
    if (!file) return;

    // Strict client-side check for unsupported PDF
    if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
      showToast(
        'PDF security reports are not supported by this deployment. Please upload structured machine-readable cloud exports (JSON, CSV, Terraform HCL, or YAML).',
        'error'
      );
      return;
    }

    try {
      setUploading(true);
      setLastUploadResult(null);
      setUploadProgressStage(1); // Uploading

      const stageTimer1 = setTimeout(() => setUploadProgressStage(2), 300); // Parsing
      const stageTimer2 = setTimeout(() => setUploadProgressStage(3), 600); // Normalizing
      const stageTimer3 = setTimeout(() => setUploadProgressStage(4), 900); // Rules Engine

      const res = await uploadSecurityFile(file);

      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);
      setUploadProgressStage(5); // Complete

      setLastUploadResult(res);
      showToast(
        `✓ Ingested ${res.assets_discovered} assets and generated ${res.findings_generated} security findings from ${file.name}`,
        'success'
      );

      if (onDataModified) onDataModified();
      fetchSourcesAndJobs();
    } catch (err) {
      setUploadProgressStage(0);
      showToast(err.message || 'File ingestion failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleLoadSampleFile = (type) => {
    const sample = SAMPLES[type];
    if (!sample) return;

    const blob = new Blob([sample.content], { type: 'text/plain' });
    const file = new File([blob], sample.filename, { type: 'text/plain' });
    handleFileUpload(file);
  };

  const handleRescan = async () => {
    try {
      setScanning(true);
      const res = await triggerRescan();
      showToast(
        `Policy rescan complete: ${res.new_findings_detected} new findings detected across ${res.resources_evaluated} resources`,
        'success'
      );
      if (onDataModified) onDataModified();
    } catch (err) {
      showToast('Failed to trigger policy rescan', 'error');
    } finally {
      setScanning(false);
    }
  };

  const handleSeedDemo = async () => {
    try {
      setScanning(true);
      await seedDemoData();
      showToast('Multi-cloud demo environment seeded & CIS policy evaluated!', 'success');
      if (onDataModified) onDataModified();
      fetchSourcesAndJobs();
    } catch (err) {
      showToast('Failed to seed demo data', 'error');
    } finally {
      setScanning(false);
    }
  };

  const handleClearData = async () => {
    try {
      setClearLoading(true);
      await clearAllData();
      showToast('All resources, findings, and incidents cleared. System in clean state.', 'info');
      setIsClearModalOpen(false);
      setLastUploadResult(null);
      setUploadProgressStage(0);
      if (onDataModified) onDataModified();
      fetchSourcesAndJobs();
    } catch (err) {
      showToast('Failed to clear platform data', 'error');
    } finally {
      setClearLoading(false);
    }
  };

  const copyCurlSnippet = () => {
    const curl = `curl -X POST "https://cloudguard-backend.onrender.com/api/v1/cloud/upload-evidence" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \\
  -d '{
    "native_id": "arn:aws:s3:::prod-customer-data-2026",
    "name": "prod-customer-data-2026",
    "resource_type": "AWS::S3::Bucket",
    "provider": "AWS",
    "region": "us-east-1",
    "configuration": {
      "ServerSideEncryptionConfiguration": null,
      "PublicAccessBlockConfiguration": {
        "BlockPublicAcls": false,
        "BlockPublicPolicy": false
      }
    }
  }'`;
    navigator.clipboard.writeText(curl);
    setCurlCopied(true);
    setTimeout(() => setCurlCopied(false), 2000);
  };

  return (
    <div className="page-body">
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 className="page-title">Data Sources & Evidence Ingestion</h1>
            <span className="badge badge-provenance">INGESTION HUB</span>
          </div>
          <p className="page-desc">
            First-class ingestion pipeline: Connect live cloud providers, upload multi-format security exports (JSON, CSV, Terraform HCL, YAML), or stream evidence directly via REST API.
          </p>
        </div>
        <div className="page-actions" style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleRescan}
            disabled={scanning}
            title="Re-run 26+ CIS rules against all ingested assets"
          >
            <RefreshIcon size={14} className={scanning ? 'spin' : ''} />
            <span>{scanning ? 'Scanning...' : 'Policy Rescan'}</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleSeedDemo}
            disabled={scanning}
            title="Seed simulated multi-cloud test environment"
          >
            <CloudIcon size={14} />
            <span>Seed Demo Environment</span>
          </button>
          <button
            type="button"
            className="btn btn-danger-outline btn-sm"
            onClick={() => setIsClearModalOpen(true)}
            title="Purge all assets and findings to test empty NO_DATA state"
          >
            <TrashIcon size={14} />
            <span>Clear / Reset Data</span>
          </button>
        </div>
      </div>

      {/* METHOD A: Cloud Connectors Status */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CloudIcon size={18} color="var(--color-primary)" />
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Method A — Cloud Provider Connectors
            </h2>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Direct IAM Read-Only API Polling
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {/* AWS Card */}
          <div className="soc-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>Amazon Web Services</span>
                <span className="badge badge-low" style={{ fontSize: '10px' }}>AWS</span>
              </div>
              <span className="badge badge-low" style={{ fontSize: '10px', fontWeight: 600 }}>
                NOT CONFIGURED
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Scans Amazon S3, IAM Roles & Access Keys, Security Groups, RDS Instances, KMS, and CloudTrail via AWS SecurityAudit role.
            </p>
            <div style={{ background: 'var(--bg-panel)', padding: '10px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)', fontSize: '11px' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Required IAM Permissions:</div>
              <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>arn:aws:iam::aws:policy/SecurityAudit</div>
              <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>arn:aws:iam::aws:policy/ReadOnlyAccess</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', fontSize: '11px', color: 'var(--text-muted)' }}>
              <span>Connection Mode: AssumeRole</span>
              <span style={{ color: '#ea580c', fontWeight: 600 }}>File/Demo Mode Active</span>
            </div>
          </div>

          {/* Azure Card */}
          <div className="soc-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>Microsoft Azure</span>
                <span className="badge badge-low" style={{ fontSize: '10px' }}>AZURE</span>
              </div>
              <span className="badge badge-low" style={{ fontSize: '10px', fontWeight: 600 }}>
                NOT CONFIGURED
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Inspects Azure Storage Accounts, Network Security Groups, App Services, and Key Vaults via Azure Service Principal.
            </p>
            <div style={{ background: 'var(--bg-panel)', padding: '10px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)', fontSize: '11px' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Required Azure Roles:</div>
              <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Reader (Subscription Scope)</div>
              <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Security Reader</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', fontSize: '11px', color: 'var(--text-muted)' }}>
              <span>Connection Mode: Service Principal</span>
              <span style={{ color: '#ea580c', fontWeight: 600 }}>File/Demo Mode Active</span>
            </div>
          </div>

          {/* GCP Card */}
          <div className="soc-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>Google Cloud Platform</span>
                <span className="badge badge-low" style={{ fontSize: '10px' }}>GCP</span>
              </div>
              <span className="badge badge-low" style={{ fontSize: '10px', fontWeight: 600 }}>
                NOT CONFIGURED
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Discovers Cloud Storage buckets, VPC Firewalls, Cloud SQL, and IAM bindings via GCP Workload Identity Federation.
            </p>
            <div style={{ background: 'var(--bg-panel)', padding: '10px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)', fontSize: '11px' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Required IAM Roles:</div>
              <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>roles/viewer</div>
              <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>roles/securityReviewer</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', fontSize: '11px', color: 'var(--text-muted)' }}>
              <span>Connection Mode: Workload Identity</span>
              <span style={{ color: '#ea580c', fontWeight: 600 }}>File/Demo Mode Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* METHOD B: Security Data File Upload */}
      <div className="soc-card" style={{ padding: '24px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UploadIcon size={18} color="var(--color-primary)" />
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Method B — Security Data File Ingestion
            </h2>
          </div>
          <span className="badge badge-safe" style={{ fontSize: '10px', fontWeight: 700 }}>
            RECOMMENDED FOR EVALUATION
          </span>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
          Upload actual multi-format cloud security exports. The ingestion pipeline parses the document, normalizes configuration to CloudGuard schema, runs 26+ deterministic CIS policy rules, scores risk posture, and commits an immutable entry to the SHA-256 cryptographic audit ledger.
        </p>

        {/* Quick-load Sample Files Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          background: 'var(--bg-panel)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Load Evaluation Sample:
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleLoadSampleFile('json')}
            disabled={uploading}
            style={{ fontSize: '11px' }}
          >
            Load Sample AWS JSON
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleLoadSampleFile('csv')}
            disabled={uploading}
            style={{ fontSize: '11px' }}
          >
            Load Sample Inventory CSV
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleLoadSampleFile('tf')}
            disabled={uploading}
            style={{ fontSize: '11px' }}
          >
            Load Sample Terraform HCL
          </button>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
            Clearly marked as [DEMO DATASET — SIMULATED]
          </span>
        </div>

        {/* Drag-and-Drop Zone */}
        <div
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          style={{
            border: '2px dashed var(--border-default)',
            borderRadius: 'var(--radius-md)',
            padding: '36px 20px',
            textAlign: 'center',
            cursor: uploading ? 'not-allowed' : 'pointer',
            background: 'var(--bg-surface)',
            transition: 'border-color 0.2s',
            marginBottom: '16px'
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.csv,.tf,.yaml,.yml,.tfstate"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
                e.target.value = null; // reset
              }
            }}
          />
          <div style={{ display: 'inline-flex', padding: '12px', background: 'var(--color-primary-subtle)', borderRadius: '50%', marginBottom: '12px' }}>
            <UploadIcon size={24} color="var(--color-primary)" />
          </div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Click or drag cloud export files here to ingest
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Supported Formats: <strong>JSON</strong> (.json, .tfstate), <strong>CSV</strong> (.csv), <strong>Terraform HCL</strong> (.tf), <strong>YAML</strong> (.yaml, .yml)
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Note: PDF security reports are not supported by this deployment.
          </div>
        </div>

        {/* 5-Stage Pipeline Progress Visualizer */}
        {uploading && (
          <div style={{ padding: '16px', background: 'var(--bg-panel)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="status-dot pulsing"></span>
              <span>Processing Ingestion Pipeline...</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
              {[
                { step: 1, label: 'Upload' },
                { step: 2, label: 'Format Detect' },
                { step: 3, label: 'Normalize' },
                { step: 4, label: '26+ CIS Rules' },
                { step: 5, label: 'Audit Chain' },
              ].map((s) => {
                const isPassed = uploadProgressStage > s.step;
                const isCurrent = uploadProgressStage === s.step;
                return (
                  <div
                    key={s.step}
                    style={{
                      padding: '8px 6px',
                      textAlign: 'center',
                      borderRadius: 'var(--radius-xs)',
                      background: isPassed ? '#f0fdf4' : isCurrent ? '#eff6ff' : 'var(--bg-surface)',
                      border: `1px solid ${isPassed ? '#bbf7d0' : isCurrent ? '#bfdbfe' : 'var(--border-subtle)'}`,
                      fontSize: '11px',
                      fontWeight: isCurrent || isPassed ? 600 : 400,
                      color: isPassed ? '#15803d' : isCurrent ? '#1d4ed8' : 'var(--text-muted)',
                    }}
                  >
                    {isPassed ? '✓ ' : ''}{s.label}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Ingestion Result Summary Banner */}
        {lastUploadResult && (
          <div style={{
            padding: '16px',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircleIcon size={20} color="#16a34a" />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#15803d' }}>
                  Ingestion Complete: {lastUploadResult.filename}
                </div>
                <div style={{ fontSize: '12px', color: '#166534' }}>
                  Discovered <strong>{lastUploadResult.assets_discovered}</strong> assets • Generated <strong>{lastUploadResult.findings_generated}</strong> findings • Format: {lastUploadResult.format_detected}
                </div>
              </div>
            </div>
            {onNavigateToFindings && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={onNavigateToFindings}
                style={{ fontSize: '12px' }}
              >
                Inspect Generated Findings →
              </button>
            )}
          </div>
        )}
      </div>

      {/* METHOD C: Direct API Ingestion */}
      <div className="soc-card" style={{ padding: '24px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TerminalIcon size={18} color="var(--color-primary)" />
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Method C — Direct REST API Ingestion (CI/CD Pipeline)
            </h2>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={copyCurlSnippet}
            style={{ fontSize: '11px' }}
          >
            {curlCopied ? <CheckIcon size={12} color="#16a34a" /> : <CopyIcon size={12} />}
            <span>{curlCopied ? 'Copied' : 'Copy cURL'}</span>
          </button>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
          Automate security checks during GitHub Actions, GitLab CI, or Terraform deployments by submitting resource configurations directly to the live endpoint.
        </p>

        <div style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 14px',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--text-secondary)',
          overflowX: 'auto',
          whiteSpace: 'pre-wrap'
        }}>
{`POST /api/v1/cloud/upload-evidence
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
  "native_id": "arn:aws:s3:::prod-customer-data-2026",
  "name": "prod-customer-data-2026",
  "resource_type": "AWS::S3::Bucket",
  "provider": "AWS",
  "region": "us-east-1",
  "configuration": {
    "ServerSideEncryptionConfiguration": null,
    "PublicAccessBlockConfiguration": { "BlockPublicAcls": false }
  }
}`}
        </div>
      </div>

      {/* SECTION D: Recent Ingestion Activity Jobs Log */}
      <div className="soc-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldIcon size={16} color="var(--color-primary)" />
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Recent Ingestion Jobs Log
            </h3>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fetchSourcesAndJobs}
            style={{ fontSize: '11px' }}
          >
            <RefreshIcon size={12} />
            <span>Refresh Jobs</span>
          </button>
        </div>

        {jobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
            No ingestion jobs recorded yet. Upload a security export above or seed the demo environment.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="soc-table" style={{ width: '100%', fontSize: '12px' }}>
              <thead>
                <tr>
                  <th>Job ID</th>
                  <th>Source File</th>
                  <th>Format Detected</th>
                  <th>Records Processed</th>
                  <th>Timestamp (UTC)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{job.id}</td>
                    <td style={{ fontWeight: 600 }}>{job.filename}</td>
                    <td>
                      <span className="badge badge-low" style={{ fontSize: '10px' }}>
                        {job.format_detected || 'AUTO'}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{job.records_count}</td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {new Date(job.created_at).toLocaleString()}
                    </td>
                    <td>
                      <span className={`badge ${job.status === 'COMPLETED' ? 'badge-safe' : 'badge-critical'}`} style={{ fontSize: '10px', fontWeight: 600 }}>
                        {job.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Clear Data Confirmation Modal */}
      <ConfirmationModal
        isOpen={isClearModalOpen}
        title="Reset & Purge All Platform Data"
        message="This action will delete all cloud accounts, discovered resources, security findings, incidents, and remediation plans. This is intended for testing the clean, empty NO_DATA onboarding state."
        confirmText="Purge All Data"
        confirmType="danger"
        isLoading={clearLoading}
        onConfirm={handleClearData}
        onCancel={() => setIsClearModalOpen(false)}
      />
    </div>
  );
}
