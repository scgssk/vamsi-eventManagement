// src/components/AdminScanner.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function AdminScanner() {
  const scannerRef = useRef(null);
  const [lastResult, setLastResult] = useState(null);
  const [participant, setParticipant] = useState(null);
  const [scanner, setScanner] = useState(null);
  const navigate = useNavigate();

  const token = localStorage.getItem('admin_token');
  const startedRef = useRef(false);

  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
      return;
    }

    let html5QrCode = null;
    let isMounted = true;

    const startScanner = async () => {
      try {
        html5QrCode = new Html5Qrcode("reader");
        const config = { fps: 10, qrbox: 300 };

        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          async (qrText) => {
            if (!isMounted) return;
            try {
              const signed = JSON.parse(qrText);
              const res = await axios.post(`${import.meta.env.VITE_API_URL}/verify-qr`, { signed });
              setParticipant(res.data.participant);
              setLastResult(res.data.participant ? 'Valid' : 'Not found');
            } catch (e) {
              setLastResult('Invalid QR');
              console.error('QR parse/verify error:', e);
            }
          },
          (error) => {
            // Optional: log decode errors
          }
        );

        if (isMounted) {
          startedRef.current = true;
          setScanner(html5QrCode);
        }
      } catch (err) {
        console.error("Failed to start QR scanner:", err);
        if (isMounted) {
          setLastResult('Camera access denied or unavailable');
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (html5QrCode) {
        try {
          const p = startedRef.current ? html5QrCode.stop() : null;
          if (p && typeof p.then === 'function') p.catch(() => {});
        } catch (e) {
          // Ignore
        }
      }
    };
  }, [token, navigate]);

  async function approve() {
    if (!participant || participant.approved) return;
    try {
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/participants/${participant._id}/approve`,
        {},
        { headers: { 'x-admin-token': token } }
      );
      setParticipant(prev => ({ ...prev, approved: true }));
      alert('Approved!');
    } catch (e) {
      console.error(e);
      alert('Approval failed: ' + (e.response?.data?.error || 'Server error'));
    }
  }

  function logout() {
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  }

  if (!token) return null;

  return (
    <>
      <style>{`
        .admin-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          padding: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .admin-header {
          width: 100%;
          max-width: 600px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding: 0 8px;
        }

        .admin-title {
          font-size: 28px;
          font-weight: 600;
          color: #1a3e72;
          margin: 0;
        }

        .logout-btn {
          background: #ef4444;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .logout-btn:hover {
          background: #dc2626;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }

        .scanner-container {
          width: 100%;
          max-width: 500px;
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          margin-bottom: 24px;
        }

        #reader {
          width: 100% !important;
          height: auto;
        }

        .scan-status {
          padding: 16px;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
          font-size: 16px;
          color: #475569;
          font-weight: 500;
        }

        .status-valid { color: #16a34a; }
        .status-invalid { color: #dc2626; }
        .status-pending { color: #6366f1; }

        .participant-card {
          width: 100%;
          max-width: 500px;
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          border: 1px solid #dbeafe;
          animation: fadeIn 0.4s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .participant-name {
          font-size: 24px;
          font-weight: 700;
          color: #1e40af;
          margin: 0 0 16px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .participant-details {
          display: grid;
          grid-template-columns: max-content 1fr;
          gap: 12px 16px;
          margin-bottom: 20px;
          font-size: 15px;
          color: #374151;
        }

        .detail-label {
          font-weight: 600;
          color: #1f2937;
        }

        .detail-value {
          color: #4b5563;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
        }

        .status-approved {
          background: #dcfce7;
          color: #166534;
        }

        .status-pending {
          background: #fef3c7;
          color: #92400e;
        }

        .approve-btn {
          width: 100%;
          background: #10b981;
          color: white;
          border: none;
          padding: 14px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2);
        }

        .approve-btn:hover:not(:disabled) {
          background: #059669;
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(16, 185, 129, 0.3);
        }

        .approve-btn:disabled {
          background: #94a3b8;
          cursor: not-allowed;
          transform: none;
        }

        .icon {
          font-size: 18px;
        }

        @media (max-width: 640px) {
          .admin-header {
            flex-direction: column;
            gap: 12px;
            text-align: center;
          }
          .admin-title {
            font-size: 24px;
          }
          .participant-details {
            grid-template-columns: 1fr;
            gap: 8px;
          }
          .detail-label::after {
            content: ':';
          }
        }
      `}</style>

      <div className="admin-container">
        <div className="admin-header">
          <h1 className="admin-title">QR Scanner</h1>
          <button onClick={logout} className="logout-btn">
            Logout
          </button>
        </div>

        <div className="scanner-container">
          <div id="reader"></div>
          <div className="scan-status">
            Scan Result:{' '}
            <span className={
              lastResult === 'Valid' ? 'status-valid' :
              lastResult === 'Invalid QR' || lastResult === 'Not found' ? 'status-invalid' :
              'status-pending'
            }>
              {lastResult || 'Waiting for scan...'}
            </span>
          </div>
        </div>

        {participant && (
          <div className="participant-card">
            <h2 className="participant-name">
              {participant.name}
            </h2>
            <div className="participant-details">
              <span className="detail-label">College</span>
              <span className="detail-value">{participant.college}</span>

              <span className="detail-label">Email</span>
              <span className="detail-value">{participant.email || 'N/A'}</span>

              <span className="detail-label">Status</span>
              <span className="detail-value">
                <span className={`status-badge ${participant.approved ? 'status-approved' : 'status-pending'}`}>
                  {participant.approved ? 'Approved' : 'Pending'}
                </span>
              </span>
            </div>

            {!participant.approved && (
              <button
                onClick={approve}
                disabled={!participant}
                className="approve-btn"
              >
                Approve Participant
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}