import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/InventoryPage';
import FindingsPage from './pages/FindingsPage';
import IncidentsPage from './pages/IncidentsPage';
import RemediationsPage from './pages/RemediationsPage';
import AuditCompliancePage from './pages/AuditCompliancePage';
import LoginPage from './pages/LoginPage';
import { api, getAuthToken, removeAuthToken } from './services/api';

export default function App() {
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
      const statusData = await api.getSystemStatus();
      setSystemStatus(statusData);
    } catch (e) {
      console.warn('Could not fetch system status:', e);
    }

    // 2. Check Auth
    const token = getAuthToken();
    if (token) {
      try {
        const profile = await api.getMe();
        setUser(profile);
      } catch (e) {
        removeAuthToken();
        setUser(null);
      }
    } else {
      // Auto-login for local development/demo experience if token not set
      try {
        const loginRes = await api.login('admin@cloudguard.ai', 'Admin@CloudGuard2026!');
        if (loginRes.access_token) {
          localStorage.setItem('cloudguard_token', loginRes.access_token);
          setUser(loginRes.user);
        }
      } catch (err) {
        console.warn('Auto-login notice:', err);
      }
    }
    setAuthChecked(true);
    loadDashboardMetrics();
  }

  async function loadDashboardMetrics() {
    try {
      const data = await api.getDashboardMetrics();
      setMetrics(data);
    } catch (e) {
      console.error('Failed to load metrics:', e);
    }
  }

  function handleLogout() {
    removeAuthToken();
    setUser(null);
  }

  async function handleSeedDemo() {
    try {
      await api.seedDemoData();
      alert('Demo multi-cloud environment successfully seeded and re-scanned!');
      await loadDashboardMetrics();
      setActiveTab('dashboard');
    } catch (err) {
      alert(`Error seeding demo: ${err.message}`);
    }
  }

  if (!authChecked) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-app)' }}>
        <span className="pulse-indicator"></span>
        <span style={{ marginLeft: '12px', color: 'var(--cyan-glow)', fontFamily: 'var(--font-mono)' }}>Initializing CloudGuard AI Platform...</span>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLoginSuccess={(u) => { setUser(u); loadDashboardMetrics(); }} />;
  }

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} metrics={metrics} />
      <div className="main-content">
        <Navbar 
          user={user} 
          onLogout={handleLogout} 
          onSeedDemo={handleSeedDemo}
          systemStatus={systemStatus}
        />
        <main className="page-body">
          {activeTab === 'dashboard' && (
            <DashboardPage 
              metrics={metrics} 
              onNavigate={setActiveTab} 
              onInvestigateFinding={() => setActiveTab('findings')}
              systemStatus={systemStatus}
            />
          )}
          {activeTab === 'inventory' && <InventoryPage />}
          {activeTab === 'findings' && (
            <FindingsPage onNavigateToRemediation={() => setActiveTab('remediations')} />
          )}
          {activeTab === 'incidents' && (
            <IncidentsPage onNavigateToRemediate={() => setActiveTab('remediations')} />
          )}
          {activeTab === 'remediations' && (
            <RemediationsPage onRefreshDashboard={loadDashboardMetrics} />
          )}
          {activeTab === 'audit' && <AuditCompliancePage />}
          {activeTab === 'compliance' && <AuditCompliancePage />}
        </main>
      </div>
    </div>
  );
}
