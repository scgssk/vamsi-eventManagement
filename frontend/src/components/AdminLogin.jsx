// src/components/AdminLogin.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin() {
  const [adminId, setAdminId] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function login(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/admin/login`, {
        id: adminId,
        pass: adminPass
      });
      if (res.data.token) {
        localStorage.setItem('admin_token', res.data.token);
        navigate('/admin/scanner');
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Invalid credentials. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Lock Icon */}
        <div style={styles.lockIcon}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <h2 style={styles.title}>Admin Access</h2>
        <p style={styles.subtitle}>Enter your secure credentials</p>

        <form onSubmit={login} style={styles.form}>
          <div style={styles.inputGroup}>
            <div style={styles.inputWrapper}>
              <input
                placeholder="Admin ID"
                value={adminId}
                onChange={e => setAdminId(e.target.value)}
                required
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <div style={styles.inputWrapper}>
              <input
                type="password"
                placeholder="Password"
                value={adminPass}
                onChange={e => setAdminPass(e.target.value)}
                required
                style={styles.input}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.loginButton,
              ...(loading ? styles.buttonDisabled : {}),
            }}
          >
            {loading ? (
              <span style={styles.loadingText}>
                <span style={styles.spinner}></span>
                Authenticating...
              </span>
            ) : (
              'Secure Login'
            )}
          </button>
        </form>

        {error && (
          <div style={styles.errorBox}>
            <p style={styles.errorText}>{error}</p>
          </div>
        )}

        <p style={styles.footerText}>
          Only authorized personnel can access the admin scanner.
        </p>
      </div>
    </div>
  );
}

// === STYLES ===
const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
    padding: '40px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    background: 'white',
    borderRadius: '20px',
    padding: '40px 32px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 25px 50px rgba(0,0,0,0.2)',
    textAlign: 'center',
  },
  lockIcon: {
    marginBottom: '16px',
    padding: '16px',
    background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
    borderRadius: '50%',
    width: '80px',
    height: '80px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px auto',
    boxShadow: '0 8px 20px rgba(102, 126, 234, 0.2)',
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '26px',
    fontWeight: '700',
    color: '#1e293b',
  },
  subtitle: {
    margin: '0 0 28px 0',
    fontSize: '15px',
    color: '#64748b',
    fontWeight: '500',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  inputGroup: {
    position: 'relative',
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    width: '100%',
    padding: '15px 18px',
    fontSize: '16px',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    outline: 'none',
    transition: 'all 0.3s ease',
    backgroundColor: '#f8fafc',
    boxSizing: 'border-box',
  },
  loginButton: {
    marginTop: '8px',
    padding: '15px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 6px 16px rgba(99, 102, 241, 0.3)',
  },
  buttonDisabled: {
    opacity: 0.75,
    cursor: 'not-allowed',
    transform: 'none',
  },
  loadingText: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid transparent',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  errorBox: {
    background: '#fee2e2',
    border: '1px solid #fca5a5',
    borderRadius: '12px',
    padding: '14px',
    marginTop: '20px',
  },
  errorText: {
    margin: 0,
    color: '#dc2626',
    fontSize: '15px',
    fontWeight: '500',
  },
  footerText: {
    margin: '28px 0 0 0',
    fontSize: '13px',
    color: '#94a3b8',
    lineHeight: '1.5',
  },
};

// Inject spinner animation and hover effects
const dynamicStyles = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  .admin-input:focus {
    border-color: #6366f1 !important;
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15) !important;
    transform: translateY(-1px);
  }
  .admin-login-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(99, 102, 241, 0.4) !important;
  }
`;

// Inject once
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = dynamicStyles;
  document.head.appendChild(styleSheet);
}