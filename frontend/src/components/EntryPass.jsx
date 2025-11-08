// src/components/EntryPass.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function EntryPass() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [qr, setQr] = useState(null);
  const [participant, setParticipant] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Clear error and results when inputs change
  useEffect(() => {
    setError('');
    setParticipant(null);
    setQr(null);
    setLoading(false);
  }, [email, name]);

  async function findParticipant() {
    if (!email && !name) {
      setError('Please enter at least email or name.');
      return;
    }

    setLoading(true);
    try {
      setError('');
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/participants/search?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`
      );

      if (res.data.participant) {
        setParticipant(res.data.participant);
        if (res.data.participant.approved) {
          await generateEntryPass(res.data.participant._id);
        }
      } else {
        setError('No registration found. Please check your details.');
      }
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.error || 'Failed to search. Try again.');
    } finally {
      setLoading(false);
    }
  }

  async function generateEntryPass(participantId) {
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/generate-entry-pass`, { participantId });
      setQr(res.data.pngDataUri);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.error || 'Failed to generate pass');
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Get Your Entry Pass</h2>

        <div style={styles.searchForm}>
          <div style={styles.inputGroup}>
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <input
              placeholder="Full Name"
              value={name}
              onChange={e => setName(e.target.value)}
              style={styles.input}
            />
          </div>

          <button
            onClick={findParticipant}
            disabled={loading}
            style={{
              ...styles.searchButton,
              ...(loading ? styles.buttonDisabled : {}),
            }}
          >
            {loading ? 'Searching...' : 'Find My Pass'}
          </button>
        </div>

        {error && (
          <div style={styles.errorBox}>
            <p style={styles.errorText}>{error}</p>
          </div>
        )}

        {participant && (
          <div style={{
            ...styles.resultCard,
            backgroundColor: participant.approved ? '#f0fdf4' : '#fefce8',
            border: participant.approved ? '1px solid #86efac' : '1px solid #fde047'
          }}>
            <h3 style={styles.resultTitle}>
              {participant.approved ? 'Registration Approved' : 'Pending Approval'}
            </h3>

            <div style={styles.infoGrid}>
              <p><strong>Name:</strong> {participant.name}</p>
              <p><strong>College:</strong> {participant.college}</p>
              {participant.email && <p><strong>Email:</strong> {participant.email}</p>}
              {participant.phone && <p><strong>Phone:</strong> {participant.phone}</p>}
            </div>

            <div style={styles.statusBadge}>
              {participant.approved ? 'Approved' : 'Pending'}
            </div>

            {participant.approved ? (
              qr ? (
                <div style={styles.qrSection}>
                  <div style={styles.successBanner}>
                    <p style={styles.successText}>Your Entry Pass is Ready!</p>
                    <p style={styles.subText}>Show this QR at the entrance</p>
                  </div>

                  <div style={styles.qrFrame}>
                    <img
                      src={qr}
                      alt="Entry Pass QR Code"
                      style={styles.qrImage}
                    />
                  </div>

                  <a
                    href={qr}
                    download="entry-pass.png"
                    style={styles.downloadBtn}
                  >
                    Download Pass
                  </a>
                </div>
              ) : (
                <div style={styles.loadingPass}>
                  <p>Generating secure entry pass...</p>
                </div>
              )
            ) : (
              <div style={styles.pendingBox}>
                <p style={styles.pendingText}>
                  Your registration is under review. Please check back in a few hours.
                </p>
                <p style={styles.contactText}>
                  Need help? Contact event organizers.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// === STYLES ===
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
    maxWidth: '520px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
  },
  title: {
    margin: '0 0 28px 0',
    fontSize: '28px',
    fontWeight: '700',
    textAlign: 'center',
    color: '#2d3748',
  },
  searchForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '24px',
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
  searchButton: {
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
  },
  errorBox: {
    background: '#fee2e2',
    border: '1px solid #fca5a5',
    borderRadius: '12px',
    padding: '14px',
    marginBottom: '20px',
  },
  errorText: {
    margin: 0,
    color: '#dc2626',
    fontSize: '15px',
    fontWeight: '500',
  },
  resultCard: {
    borderRadius: '12px',
    padding: '24px',
    marginTop: '16px',
  },
  resultTitle: {
    margin: '0 0 16px 0',
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  infoGrid: {
    display: 'grid',
    gap: '8px',
    marginBottom: '16px',
    fontSize: '15px',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '6px 14px',
    borderRadius: '999px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#dcfce7',
    color: '#166534',
    alignSelf: 'center',
    marginBottom: '16px',
  },
  qrSection: {
    textAlign: 'center',
  },
  successBanner: {
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
  qrFrame: {
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
    display: 'inline-block',
    margin: '16px 0',
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
    backgroundColor: '#16a34a',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '15px',
    transition: 'all 0.2s',
    boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
  },
  pendingBox: {
    backgroundColor: '#fffbeb',
    border: '1px solid #fde047',
    borderRadius: '12px',
    padding: '18px',
    textAlign: 'center',
  },
  pendingText: {
    margin: '0 0 8px 0',
    color: '#92400e',
    fontWeight: '500',
  },
  contactText: {
    margin: 0,
    fontSize: '14px',
    color: '#854d0e',
  },
  loadingPass: {
    textAlign: 'center',
    padding: '20px',
    color: '#64748b',
    fontStyle: 'italic',
  },
};

// Hover effects
const hoverStyles = `
  .entry-input:focus {
    border-color: #667eea !important;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
  }
  .entry-search-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4) !important;
  }
  .entry-download:hover {
    transform: translateY(-1px);
    boxShadow: 0 6px 16px rgba(22, 163, 74, 0.4) !important;
  }
`;

// Inject hover styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = hoverStyles;
  document.head.appendChild(styleSheet);
}