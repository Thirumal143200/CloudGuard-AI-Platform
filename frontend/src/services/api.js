// CloudGuard AI — Frontend API Client
// Dynamically derives API base URL from VITE_API_URL environment variable

const RAW_API_URL = (import.meta.env.VITE_API_URL || '').trim();
const API_BASE_URL = RAW_API_URL 
  ? `${RAW_API_URL.replace(/\/$/, '')}/api/v1` 
  : '/api/v1';

export const getAuthToken = () => localStorage.getItem('cloudguard_token');
export const setAuthToken = (token) => localStorage.setItem('cloudguard_token', token);
export const removeAuthToken = () => localStorage.removeItem('cloudguard_token');

async function apiRequest(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const url = endpoint.startsWith('http') 
      ? endpoint 
      : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: `Error ${response.status}: ${response.statusText}` }));
      throw new Error(err.detail || `Error ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error on [${endpoint}]:`, error);
    throw error;
  }
}

export const api = {
  // Base configuration info
  getBaseUrl: () => API_BASE_URL,

  // Auth
  login: (email, password) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),
  register: (data) => apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  forgotPassword: (email) => apiRequest('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),
  verifyOTP: (email, otp) => apiRequest('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  }),
  resetPassword: (reset_token, new_password) => apiRequest('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ reset_token, new_password }),
  }),
  logout: () => apiRequest('/auth/logout', {
    method: 'POST',
  }),
  getMe: () => apiRequest('/auth/me'),

  // Health & Operational Status (Non-sensitive)
  getSystemStatus: () => apiRequest('/system/status'),
  getHealth: () => apiRequest('/system/health'),

  // Analytics & Dashboard
  getDashboardMetrics: () => apiRequest('/analytics/dashboard'),
  getAuditLogs: () => apiRequest('/analytics/audit/logs'),
  verifyAuditChain: () => apiRequest('/analytics/audit/verify'),
  getComplianceFrameworks: () => apiRequest('/analytics/compliance/frameworks'),

  // Cloud & Inventory
  getAccounts: () => apiRequest('/cloud/accounts'),
  getResources: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/cloud/resources${query ? `?${query}` : ''}`);
  },
  getResourceDetail: (id) => apiRequest(`/cloud/resources/${id}`),

  // Security Findings & Rules
  getFindings: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/findings${query ? `?${query}` : ''}`);
  },
  getFindingDetail: (id) => apiRequest(`/findings/${id}`),
  getRules: () => apiRequest('/findings/rules'),

  // Incidents
  getIncidents: () => apiRequest('/incidents'),
  getIncidentDetail: (id) => apiRequest(`/incidents/${id}`),
  getIncidentTimeline: (id) => apiRequest(`/incidents/${id}/timeline`),

  // Remediations
  getRemediations: () => apiRequest('/remediations'),
  runDryRun: (planId) => apiRequest(`/remediations/${planId}/dry-run`, { method: 'POST' }),
  executeRemediation: (planId) => apiRequest(`/remediations/${planId}/execute`, { method: 'POST' }),

  // Gemini AI Assistant
  analyzeFindingAI: (findingId) => apiRequest('/ai/analyze-finding', {
    method: 'POST',
    body: JSON.stringify({ target_type: 'FINDING', target_id: findingId }),
  }),

  // Seed & Admin
  seedDemoData: () => apiRequest('/system/seed-demo-data', { method: 'POST' }),

  // Data Sources & Ingestion
  getDataSources: () => apiRequest('/cloud/data-sources'),
  uploadSecurityFile: async (file) => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('file', file);

    const url = `${API_BASE_URL}/cloud/upload-file`;
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: `Error ${res.status}: ${res.statusText}` }));
      throw new Error(err.detail || `Upload failed with HTTP ${res.status}`);
    }

    return await res.json();
  },
  getIngestionJobs: () => apiRequest('/cloud/ingestion-jobs'),
  uploadEvidence: (data) => apiRequest('/cloud/upload-evidence', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  triggerRescan: () => apiRequest('/cloud/rescan', { method: 'POST' }),
  clearAllData: () => apiRequest('/cloud/clear-data', { method: 'DELETE' }),
};

// Export individual named methods for modern modular imports
export const {
  login,
  register,
  forgotPassword,
  verifyOTP,
  resetPassword,
  logout,
  getMe,
  getSystemStatus,
  getHealth,
  getDashboardMetrics,
  getAuditLogs,
  verifyAuditChain,
  getComplianceFrameworks,
  getAccounts,
  getResources,
  getResourceDetail,
  getFindings,
  getFindingDetail,
  getRules,
  getIncidents,
  getIncidentDetail,
  getIncidentTimeline,
  getRemediations,
  runDryRun,
  executeRemediation,
  analyzeFindingAI,
  seedDemoData,
  getDataSources,
  uploadSecurityFile,
  getIngestionJobs,
  uploadEvidence,
  triggerRescan,
  clearAllData,
} = api;

export default api;
