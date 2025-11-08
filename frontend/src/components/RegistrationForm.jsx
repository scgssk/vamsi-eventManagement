// src/components/RegistrationForm.jsx
import React, { useState } from 'react';
import axios from 'axios';

export default function RegistrationForm() {
  const [form, setForm] = useState({ name: '', college: '', email: '', phone: '' });
  const [qr, setQr] = useState(null);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/register`, form);
      setQr(res.data.pngDataUri);
      // Removed alert for better UX
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Register for Event</h2>
        
        <form onSubmit={submit} style={styles.form}>
          <div style={styles.inputGroup}>
            <input
              required
              placeholder="Full Name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <input
              required
              placeholder="College / University"
              value={form.college}
              onChange={e => setForm({ ...form, college: e.target.value })}
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <input
              type="email"
              placeholder="Email Address (optional)"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <input
              type="tel"
              placeholder="Phone Number (optional)"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              style={styles.input}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {}),
            }}
          >
            {loading ? (
              <span style={styles.loadingText}>Registering...</span>
            ) : (
              'Register Now'
            )}
          </button>
        </form>

        {qr && (
          <div style={styles.qrSection}>
            <div style={styles.successBox}>
              <p style={styles.successText}>Registration Successful!</p>
              <p style={styles.subText}>Show this QR code at the venue</p>
            </div>

            <div style={styles.qrContainer}>
              <img
                src={qr}
                alt="Registration QR Code"
                style={styles.qrImage}
              />
            </div>

            <a
              href={qr}
              download="registration-qr.png"
              style={styles.downloadBtn}
            >
              Download QR Code
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// Modern, clean styles
const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '40px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    padding: '32px',
    width: '100%',
    maxWidth: '480px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
  },
  title: {
    margin: '0 0 24px 0',
    fontSize: '28px',
    fontWeight: '700',
    textAlign: 'center',
    color: '#2d3748',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  inputGroup: {
    position: 'relative',
  },
  input: {
    width: '90%',
    padding: '14px 16px',
    fontSize: '16px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    outline: 'none',
    transition: 'all 0.2s',
    backgroundColor: '#f8fafc',
  },
  inputFocus: {
    borderColor: '#667eea',
    boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
  },
  button: {
    marginTop: '8px',
    padding: '14px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
  },
  buttonDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
  loadingText: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  qrSection: {
    marginTop: '32px',
    textAlign: 'center',
  },
  successBox: {
    background: 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)',
    padding: '16px',
    borderRadius: '12px',
    marginBottom: '20px',
    border: '1px solid #a3e1b0',
  },
  successText: {
    margin: '0 0 4px 0',
    fontSize: '18px',
    fontWeight: '600',
    color: '#155724',
  },
  subText: {
    margin: 0,
    fontSize: '14px',
    color: '#155724',
    opacity: 0.9,
  },
  qrContainer: {
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
    display: 'inline-block',
    marginBottom: '16px',
    boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.05)',
  },
  qrImage: {
    width: 220,
    height: 220,
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  downloadBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    backgroundColor: '#28a745',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '15px',
    transition: 'all 0.2s',
    boxShadow: '0 4px 12px rgba(40, 167, 69, 0.3)',
  },
};

// Add hover effects via inline style (React doesn't support :hover)
const enhancedStyles = `
  .registration-input:focus {
    border-color: #667eea !important;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
  }
  .registration-button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
  }
  .registration-download:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(40, 167, 69, 0.4);
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = enhancedStyles;
  document.head.appendChild(styleSheet);
}