import React, { useState, useMemo } from 'react';
import {
  login,
  register,
  forgotPassword,
  verifyOTP,
  resetPassword,
  setAuthToken,
} from '../services/api';
import { CheckCircleIcon, AlertTriangleIcon, CheckIcon } from '../components/Icons';
import { useToast } from '../components/Toast';

export default function LoginPage({ onLoginSuccess }) {
  const { showToast } = useToast();

  // Auth Modes: 'LOGIN' | 'SIGNUP' | 'FORGOT_PASSWORD' | 'VERIFY_OTP' | 'RESET_PASSWORD' | 'RESET_SUCCESS'
  const [mode, setMode] = useState('LOGIN');

  // Form Fields
  const [email, setEmail] = useState('admin@cloudguard.ai');
  const [password, setPassword] = useState('Admin@CloudGuard2026!');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);

  // Password Requirement Validation Rules
  const passwordCriteria = useMemo(() => {
    const target = mode === 'RESET_PASSWORD' ? confirmPassword : password;
    return {
      length: target.length >= 8,
      uppercase: /[A-Z]/.test(target),
      lowercase: /[a-z]/.test(target),
      number: /\d/.test(target),
      special: /[!@#$%^&*(),.?":{}|<>\-_]/.test(target),
    };
  }, [password, confirmPassword, mode]);

  const isPasswordComplex = useMemo(() => {
    return Object.values(passwordCriteria).every(Boolean);
  }, [passwordCriteria]);

  // Clean error messages
  const formatError = (err) => {
    const raw = err?.response?.data?.detail || err?.message || '';
    if (raw.includes('already exists')) return 'An account with this email already exists.';
    if (raw.includes('Invalid email or password') || raw.includes('incorrect')) return 'Email or password is incorrect.';
    if (raw.includes('Invalid verification code')) return raw;
    if (raw.includes('expired')) return 'Verification code has expired. Please request a new code.';
    if (raw.includes('Maximum verification attempts')) return 'Maximum attempts exceeded. Please request a new code.';
    if (raw.includes('422') || raw.includes('validation')) return 'Please check the form and enter a valid email and password.';
    return raw || 'An unexpected error occurred. Please try again.';
  };

  // --- Handlers ---

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await login(email.trim(), password);
      setAuthToken(res.access_token);
      onLoginSuccess(res.user);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!isPasswordComplex) {
      setError('Please satisfy all password security requirements before continuing.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await register({
        email: email.trim(),
        full_name: fullName.trim(),
        password,
        role: 'SECURITY_ANALYST',
      });
      showToast('Account created successfully! Signing you in...', 'success');
      // Automatic login after registration
      const loginRes = await login(email.trim(), password);
      setAuthToken(loginRes.access_token);
      onLoginSuccess(loginRes.user);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await forgotPassword(email.trim());
      setInfoMessage(res.message || 'If an account exists, a verification code has been sent.');
      setMode('VERIFY_OTP');
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    if (otpCode.trim().length !== 6) {
      setError('Please enter a 6-digit numeric verification code.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await verifyOTP(email.trim(), otpCode.trim());
      setResetToken(res.reset_token);
      setPassword('');
      setConfirmPassword('');
      setMode('RESET_PASSWORD');
      showToast('Verification code accepted. Please create your new password.', 'success');
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordCriteria.length || !passwordCriteria.uppercase || !passwordCriteria.lowercase || !passwordCriteria.number || !passwordCriteria.special) {
      setError('New password must satisfy all security requirements.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await resetPassword(resetToken, password);
      setMode('RESET_SUCCESS');
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail('admin@cloudguard.ai');
    setPassword('Admin@CloudGuard2026!');
    setError(null);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-app)',
      padding: '24px'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(320px, 440px) minmax(360px, 460px)',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-default)',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
        maxWidth: '920px',
        width: '100%',
        minHeight: '560px'
      }}>
        {/* LEFT PANEL: Branding & Product Pillars */}
        <div style={{
          backgroundColor: 'var(--bg-panel)',
          borderRight: '1px solid var(--border-subtle)',
          padding: '40px 36px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <img src="/cloudguard-mark.svg" alt="CloudGuard Mark" style={{ width: '36px', height: '36px' }} />
              <div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  CloudGuard <span style={{ color: 'var(--color-primary)' }}>AI</span>
                </div>
                <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
                  ENTERPRISE SOC PLATFORM
                </div>
              </div>
            </div>

            <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: '10px' }}>
              Cloud security, backed by evidence.
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '28px' }}>
              Continuous multi-cloud security operations, 26+ deterministic CIS policy benchmarks, and verified self-healing for AWS, Azure, and GCP.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'var(--color-primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)' }}>1</span>
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Discover Assets</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    Multi-cloud inventory, JSON/CSV/Terraform exports, and live API ingestion.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'var(--color-primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)' }}>2</span>
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Deterministic Detection</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    26+ native CIS rules and Isolation Forest telemetry anomaly detection.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'var(--color-primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)' }}>3</span>
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Verified Self-Healing</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    Pre-execution dry run simulation with post-fix rescan validation.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span>SRIJAN Hackathon 2026</span>
            <span className="badge badge-safe" style={{ fontSize: '9px' }}>SOC READY</span>
          </div>
        </div>

        {/* RIGHT PANEL: Auth Interactive Forms */}
        <div style={{ padding: '40px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {/* Error Banner */}
          {error && (
            <div style={{
              background: 'var(--sev-critical-bg)',
              border: '1px solid var(--sev-critical-border)',
              color: 'var(--sev-critical-text)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertTriangleIcon size={14} color="var(--sev-critical)" />
              <span>{error}</span>
            </div>
          )}

          {/* Info Banner */}
          {infoMessage && (
            <div style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              color: '#1d4ed8',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CheckCircleIcon size={14} color="#2563eb" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* 1. LOGIN MODE */}
          {mode === 'LOGIN' && (
            <div>
              <div style={{ marginBottom: '22px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Welcome back</h2>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sign in to your CloudGuard SOC workspace</p>
              </div>

              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="soc-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="analyst@organization.com"
                    required
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => { setMode('FORGOT_PASSWORD'); setError(null); setInfoMessage(null); }}
                      style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '11px', cursor: 'pointer', padding: 0 }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="soc-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: '11px', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ width: '100%', padding: '10px', marginTop: '6px', fontSize: '13px' }}
                >
                  {loading ? 'Authenticating...' : 'Sign in to CloudGuard'}
                </button>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={fillDemoCredentials}
                  style={{ width: '100%', fontSize: '11px', padding: '6px' }}
                >
                  Pre-fill Demo Admin Credentials
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: 'var(--text-muted)' }}>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('SIGNUP'); setError(null); setInfoMessage(null); setPassword(''); setConfirmPassword(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                >
                  Create account
                </button>
              </div>
            </div>
          )}

          {/* 2. SIGNUP MODE */}
          {mode === 'SIGNUP' && (
            <div>
              <div style={{ marginBottom: '18px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Create an account</h2>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Provision your CloudGuard security analyst seat</p>
              </div>

              <form onSubmit={handleSignupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    className="soc-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Morgan"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Corporate Email
                  </label>
                  <input
                    type="email"
                    className="soc-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@organization.com"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="soc-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>

                {/* Password Criteria Checklist */}
                <div style={{
                  background: 'var(--bg-panel)',
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '11px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '6px'
                }}>
                  <div style={{ color: passwordCriteria.length ? '#15803d' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {passwordCriteria.length ? <CheckIcon size={12} color="#16a34a" /> : '○'} 8+ characters
                  </div>
                  <div style={{ color: passwordCriteria.uppercase ? '#15803d' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {passwordCriteria.uppercase ? <CheckIcon size={12} color="#16a34a" /> : '○'} Uppercase letter
                  </div>
                  <div style={{ color: passwordCriteria.lowercase ? '#15803d' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {passwordCriteria.lowercase ? <CheckIcon size={12} color="#16a34a" /> : '○'} Lowercase letter
                  </div>
                  <div style={{ color: passwordCriteria.number ? '#15803d' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {passwordCriteria.number ? <CheckIcon size={12} color="#16a34a" /> : '○'} Number (0-9)
                  </div>
                  <div style={{ color: passwordCriteria.special ? '#15803d' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', gridColumn: 'span 2' }}>
                    {passwordCriteria.special ? <CheckIcon size={12} color="#16a34a" /> : '○'} Special character (!@#$%...)
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="soc-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !isPasswordComplex}
                  style={{ width: '100%', padding: '10px', marginTop: '6px', fontSize: '13px' }}
                >
                  {loading ? 'Provisioning Account...' : 'Create CloudGuard Account'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('LOGIN'); setError(null); setInfoMessage(null); }}
                  style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                >
                  Sign in
                </button>
              </div>
            </div>
          )}

          {/* 3. FORGOT PASSWORD MODE */}
          {mode === 'FORGOT_PASSWORD' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Forgot password</h2>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  Enter your email address and we'll dispatch a 6-digit cryptographic verification code.
                </p>
              </div>

              <form onSubmit={handleForgotPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                    Account Email
                  </label>
                  <input
                    type="email"
                    className="soc-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="analyst@organization.com"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ width: '100%', padding: '10px', fontSize: '13px' }}
                >
                  {loading ? 'Sending Code...' : 'Send Verification Code'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px' }}>
                <button
                  type="button"
                  onClick={() => { setMode('LOGIN'); setError(null); setInfoMessage(null); }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                >
                  ← Back to Sign in
                </button>
              </div>
            </div>
          )}

          {/* 4. VERIFY OTP MODE */}
          {mode === 'VERIFY_OTP' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Enter verification code</h2>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  Enter the 6-digit code dispatched to <strong>{email}</strong>. Valid for 10 minutes.
                </p>
              </div>

              <form onSubmit={handleVerifyOtpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    className="soc-input"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    style={{ letterSpacing: '8px', fontSize: '20px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                    autoFocus
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || otpCode.length !== 6}
                  style={{ width: '100%', padding: '10px', fontSize: '13px' }}
                >
                  {loading ? 'Validating Code...' : 'Verify Code'}
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                  <button
                    type="button"
                    onClick={handleForgotPasswordSubmit}
                    disabled={loading}
                    style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', padding: 0 }}
                  >
                    Resend verification code
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode('LOGIN'); setError(null); setInfoMessage(null); }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                  >
                    Back to Sign in
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 5. RESET PASSWORD MODE */}
          {mode === 'RESET_PASSWORD' && (
            <div>
              <div style={{ marginBottom: '18px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Set new password</h2>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Choose a secure password for your account</p>
              </div>

              <form onSubmit={handleResetPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    className="soc-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    className="soc-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ width: '100%', padding: '10px', marginTop: '6px', fontSize: '13px' }}
                >
                  {loading ? 'Updating Password...' : 'Reset Password'}
                </button>
              </form>
            </div>
          )}

          {/* 6. RESET SUCCESS MODE */}
          {mode === 'RESET_SUCCESS' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircleIcon size={28} color="#16a34a" />
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Password Reset Successfully
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.5 }}>
                Your account password has been updated. You can now sign in with your new credentials.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => { setMode('LOGIN'); setPassword(''); setConfirmPassword(''); setError(null); setInfoMessage(null); }}
                style={{ width: '100%', padding: '10px', fontSize: '13px' }}
              >
                Return to Sign in
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
