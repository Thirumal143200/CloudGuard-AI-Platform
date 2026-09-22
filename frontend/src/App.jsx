import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import AssetsPage from './pages/AssetsPage';
import FindingsPage from './pages/FindingsPage';
import IncidentsPage from './pages/IncidentsPage';
import RemediationsPage from './pages/RemediationsPage';
import CompliancePage from './pages/CompliancePage';
import AuditLogPage from './pages/AuditLogPage';
import DataSourcesPage from './pages/DataSourcesPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import { ToastProvider, useToast } from './components/Toast';
import {
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  getSystemStatus,
  getMe,
  login,
  getDashboardMetrics,
  seedDemoData,
} from './services/api';

function AppContent() {
  const { showToast } = useToast();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [metrics, setMetrics] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  async function checkAuthAndLoad() {
    // 1. Fetch system status (non-sensitive)
    try {
      const statusData = await getSystemStatus();
      setSystemStatus(statusData);
    } catch (e) {
      console.warn('Could not fetch system status:', e);
    }

    // 2. Check Auth — zero auto-login or prefilled accounts
    const token = getAuthToken();
    if (token) {
      try {
        const profile = await getMe();
        setUser(profile);
        loadDashboardMetrics();
      } catch (e) {
        removeAuthToken();
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setAuthChecked(true);
  }

  async function loadDashboardMetrics() {
    try {
      const data = await getDashboardMetrics();
      setMetrics(data);
    } catch (e) {
      console.error('Failed to load metrics:', e);
    }
  }

  function handleLogout() {
    removeAuthToken();
    setUser(null);
    setMetrics(null);
    showToast('Signed out of CloudGuard AI session', 'info');
  }

  async function handleSeedDemo() {
    try {
      await seedDemoData();
      showToast('Multi-cloud demo environment seeded & policy evaluation completed!', 'success');
      await loadDashboardMetrics();
      setActiveTab('dashboard');
    } catch (err) {
      showToast(`Error seeding demo: ${err.message}`, 'error');
    }
  }

  if (!authChecked) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-app)' }}>
        <div style={{ textAlign: 'center' }}>
          <span className="status-dot pulsing" style={{ width: '14px', height: '14px', backgroundColor: '#3b82f6', margin: '0 auto 12px' }}></span>
          <div style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
            Initializing CloudGuard SOC Platform...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLoginSuccess={(u) => { setUser(u); loadDashboardMetrics(); showToast('Welcome to CloudGuard AI', 'success'); }} />;
  }

  return (
    <div className="app-container">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        metrics={metrics}
        user={user}
        onLogout={handleLogout}
      />
      <div className="main-content">
        <Navbar
          user={user}
          onLogout={handleLogout}
          onSeedDemo={handleSeedDemo}
          systemStatus={systemStatus}
          activeTab={activeTab}
          onRefreshMetrics={loadDashboardMetrics}
        />
        <main style={{ flex: 1, minHeight: 0 }}>
          {activeTab === 'dashboard' && (
            <DashboardPage
              metrics={metrics}
              onNavigate={setActiveTab}
              onInvestigateFinding={() => setActiveTab('findings')}
              systemStatus={systemStatus}
            />
          )}
          {(activeTab === 'assets' || activeTab === 'inventory') && <AssetsPage />}
          {activeTab === 'findings' && (
            <FindingsPage onNavigateToRemediation={() => setActiveTab('remediations')} />
          )}
          {activeTab === 'incidents' && (
            <IncidentsPage onNavigateToRemediate={() => setActiveTab('remediations')} />
          )}
          {activeTab === 'remediations' && (
            <RemediationsPage onRefreshDashboard={loadDashboardMetrics} />
          )}
          {activeTab === 'compliance' && <CompliancePage />}
          {activeTab === 'audit' && <AuditLogPage />}
          {activeTab === 'datasources' && (
            <DataSourcesPage
              onDataModified={loadDashboardMetrics}
              onNavigateToFindings={() => setActiveTab('findings')}
            />
          )}
          {activeTab === 'settings' && <SettingsPage />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

