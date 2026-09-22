import React, { useState, useEffect } from 'react';
import {
  DataSourcesIcon,
  CloudIcon,
  UploadIcon,
  RefreshIcon,
  TrashIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  TerminalIcon,
} from '../components/Icons';
import { useToast } from '../components/Toast';
import ConfirmationModal from '../components/ConfirmationModal';
import { getDataSources, uploadEvidence, triggerRescan, clearAllData } from '../services/api';

const SAMPLE_S3_UNENCRYPTED = {
  resource_name: "prod-customer-financial-records-2026",
  resource_type: "s3_bucket",
  cloud_provider: "aws",
  region: "us-east-1",
  configuration: {
    BucketName: "prod-customer-financial-records-2026",
    ServerSideEncryptionConfiguration: null,
    PublicAccessBlockConfiguration: {
      BlockPublicAcls: false,
      IgnorePublicAcls: false,
      BlockPublicPolicy: false,
      RestrictPublicBuckets: false
    },
    Versioning: { Status: "Suspended" },
    Logging: { TargetBucket: null }
  }
};

const SAMPLE_SECURITY_GROUP_OPEN = {
  resource_name: "sg-db-primary-production",
  resource_type: "security_group",
  cloud_provider: "aws",
  region: "us-east-1",
  configuration: {
    GroupId: "sg-098234fedcba",
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
  }
};

export default function DataSourcesPage({ onDataModified }) {
  const { showToast } = useToast();
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);

  // Form State
  const [provider, setProvider] = useState('aws');
  const [resourceType, setResourceType] = useState('s3_bucket');
  const [resourceName, setResourceName] = useState('prod-customer-financial-records-2026');
  const [region, setRegion] = useState('us-east-1');
  const [configJson, setConfigJson] = useState(JSON.stringify(SAMPLE_S3_UNENCRYPTED.configuration, null, 2));

  const fetchSources = async () => {
    try {
      setLoading(true);
      const res = await getDataSources();
      setSources(res.sources || []);
    } catch (err) {
      console.error('Failed to load data sources', err);
      showToast('Could not fetch cloud data sources status', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const handleLoadSample = (sample) => {
    setProvider(sample.cloud_provider);
    setResourceType(sample.resource_type);
    setResourceName(sample.resource_name);
    setRegion(sample.region);
    setConfigJson(JSON.stringify(sample.configuration, null, 2));
    showToast(`Loaded sample template: ${sample.resource_name}`, 'info');
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    let parsedConfig = {};
    try {
      parsedConfig = JSON.parse(configJson);
    } catch (err) {
      showToast('Invalid JSON syntax in configuration editor', 'error');
      return;
    }

    try {
      setUploading(true);
      const payload = {
        resource_name: resourceName.trim(),
        resource_type: resourceType,
        cloud_provider: provider,
        region: region.trim(),
        configuration: parsedConfig,
      };

      const result = await uploadEvidence(payload);
      showToast(`Evidence uploaded! Generated ${result.findings_count} findings on ${resourceName}`, 'success');
      if (onDataModified) onDataModified();
      fetchSources();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.detail || 'Evidence ingestion failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleRescan = async () => {
    try {
      setScanning(true);
      const res = await triggerRescan();
      showToast(`Policy rescan complete: ${res.new_findings_detected} findings evaluated across ${res.resources_scanned} resources`, 'success');
      if (onDataModified) onDataModified();
    } catch (err) {
      showToast('Failed to trigger policy rescan', 'error');
    } finally {
      setScanning(false);
    }
  };

  const handleClearData = async () => {
    try {
      setClearLoading(true);
      await clearAllData();
      showToast('All resources and findings cleared. Platform reset to empty clean state.', 'success');
      setIsClearModalOpen(false);
      if (onDataModified) onDataModified();
      fetchSources();
    } catch (err) {
      showToast('Failed to clear platform data', 'error');
    } finally {
      setClearLoading(false);
    }
  };

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h1 className="page-title">Data Sources & Evidence Ingestion</h1>
          <p className="page-desc">
            Connect live cloud provider APIs, stream telemetry logs, or ingest JSON / Terraform state configurations into the policy evaluation engine.
          </p>
        </div>
        <div className="page-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleRescan}
            disabled={scanning}
          >
            <RefreshIcon size={14} className={scanning ? 'spin' : ''} />
            <span>{scanning ? 'Scanning...' : 'Trigger Full Policy Rescan'}</span>
          </button>
          <button
            type="button"
            className="btn btn-danger-outline btn-sm"
            onClick={() => setIsClearModalOpen(true)}
          >
            <TrashIcon size={14} />
            <span>Clear Platform Data</span>
          </button>
        </div>
      </div>

      {/* Cloud Connectors Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {sources.map((src) => (
          <div key={src.id} className="soc-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CloudIcon size={18} color="#60a5fa" />
                <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{src.name}</span>
              </div>
              <span className={`badge ${src.status === 'CONNECTED' ? 'badge-safe' : 'badge-low'}`}>
                {src.status}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Type: <strong style={{ color: 'var(--text-primary)' }}>{src.type}</strong>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Last Sync: <span style={{ fontFamily: 'var(--font-mono)' }}>{new Date(src.last_sync).toLocaleTimeString()}</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
              Regions: {src.regions?.join(', ') || 'All supported'}
            </div>
          </div>
        ))}
      </div>

      {/* Evidence Upload Form */}
      <div className="soc-card" style={{ marginBottom: '24px' }}>
        <div className="soc-card-header">
          <div className="soc-card-title">
            <UploadIcon size={18} color="#60a5fa" />
            <span>Upload Cloud Resource Evidence (Live Ingestion)</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleLoadSample(SAMPLE_S3_UNENCRYPTED)}
            >
              Load Insecure S3 Sample
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleLoadSample(SAMPLE_SECURITY_GROUP_OPEN)}
            >
              Load Open SG Sample
            </button>
          </div>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Upload actual cloud resource definitions or Terraform state snapshots. The 26+ CIS rules engine and Gemini AI will immediately evaluate this configuration, flag misconfigurations, calculate risk posture, and commit the event to the cryptographic SHA-256 audit ledger.
        </p>

        <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Cloud Provider
              </label>
              <select
                className="soc-select"
                style={{ width: '100%' }}
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
              >
                <option value="aws">AWS (Amazon Web Services)</option>
                <option value="azure">Microsoft Azure</option>
                <option value="gcp">Google Cloud Platform</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Resource Type
              </label>
              <select
                className="soc-select"
                style={{ width: '100%' }}
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value)}
              >
                <option value="s3_bucket">S3 Storage Bucket (aws:s3)</option>
                <option value="security_group">Security Group (aws:ec2:sg)</option>
                <option value="iam_user">IAM Identity / Policy</option>
                <option value="azure_storage_account">Azure Storage Account</option>
                <option value="gcp_storage_bucket">GCP Cloud Storage Bucket</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Resource Identifier / Name
              </label>
              <input
                type="text"
                className="soc-input"
                style={{ paddingLeft: '12px' }}
                value={resourceName}
                onChange={(e) => setResourceName(e.target.value)}
                placeholder="e.g. prod-customer-records"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Region
              </label>
              <input
                type="text"
                className="soc-input"
                style={{ paddingLeft: '12px' }}
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="e.g. us-east-1"
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Resource Configuration State (JSON)
            </label>
            <textarea
              className="code-editor-area"
              value={configJson}
              onChange={(e) => setConfigJson(e.target.value)}
              rows={8}
              placeholder="Paste JSON configuration payload here..."
              required
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={uploading}
            >
              <UploadIcon size={14} />
              <span>{uploading ? 'Analyzing Evidence...' : 'Ingest & Evaluate Resource'}</span>
            </button>
          </div>
        </form>
      </div>

      <ConfirmationModal
        isOpen={isClearModalOpen}
        title="Clear All Platform Data"
        description="This will purge all cloud resources, findings, and incidents from the database to give you a pristine clean slate. You can re-seed demo data or upload new evidence at any time."
        confirmText="Clear All Data"
        danger={true}
        loading={clearLoading}
        onConfirm={handleClearData}
        onCancel={() => setIsClearModalOpen(false)}
      />
    </div>
  );
}
