// src/App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
  useLocation,
} from "react-router-dom";
import RegistrationForm from "./components/RegistrationForm.jsx";
import EntryPass from "./components/EntryPass.jsx";
import AdminLogin from "./components/AdminLogin.jsx";
import AdminScanner from "./components/AdminScanner.jsx";

// Private Route
function PrivateRoute({ children }) {
  const token = localStorage.getItem("admin_token");
  return token ? children : <Navigate to="/admin/login" />;
}

// Animated Navbar with active state
function Navbar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header style={styles.navbar}>
      <div style={styles.logoContainer}>
        <div style={styles.logoIcon}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <h1 style={styles.brand}>Smart QR Pass</h1>
      </div>

      <nav style={styles.navLinks}>
        <Link
          to="/"
          style={{
            ...styles.navLink,
            ...(isActive("/") ? styles.navLinkActive : {}),
          }}
        >
          Register
        </Link>
        <Link
          to="/entry"
          style={{
            ...styles.navLink,
            ...(isActive("/entry") ? styles.navLinkActive : {}),
          }}
        >
          Entry Pass
        </Link>
      </nav>
    </header>
  );
}

export default function App() {
  return (
    <Router>
      <div style={styles.app}>
        <Navbar />

        <main style={styles.main}>
          <Routes>
            <Route path="/" element={<RegistrationForm />} />
            <Route path="/entry" element={<EntryPass />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin/scanner"
              element={
                <PrivateRoute>
                  <AdminScanner />
                </PrivateRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        {/* Subtle Footer */}
        <footer style={styles.footer}>
          <p style={styles.footerText}>
            © 2025 Smart QR Pass. All rights reserved.
          </p>
        </footer>
      </div>
    </Router>
  );
}

// === STYLES ===
const styles = {
  app: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
    display: "flex",
    flexDirection: "column",
  },
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 32px",
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid rgba(226, 232, 240, 0.8)",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
    position: "sticky",
    top: 0,
    zIndex: 1000,
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  logoIcon: {
    width: "40px",
    height: "40px",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    padding: "6px",
    boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
  },
  brand: {
    margin: 0,
    fontSize: "22px",
    fontWeight: "700",
    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    letterSpacing: "-0.5px",
  },
  navLinks: {
    display: "flex",
    gap: "24px",
  },
  navLink: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#64748b",
    textDecoration: "none",
    padding: "8px 16px",
    borderRadius: "8px",
    transition: "all 0.2s ease",
    position: "relative",
  },
  navLinkActive: {
    color: "#4f46e5",
    background: "rgba(99, 102, 241, 0.1)",
    fontWeight: "700",
    boxShadow: "0 2px 8px rgba(99, 102, 241, 0.15)",
  },
  main: {
    flex: 1,
    // padding: "40px 20px",
    // maxWidth: "1200px",
    margin: "0 auto",
    width: "100%",
  },
  footer: {
    padding: "20px",
    background: "rgba(15, 23, 42, 0.03)",
    borderTop: "1px solid rgba(226, 232, 240, 0.5)",
    textAlign: "center",
  },
  footerText: {
    margin: 0,
    fontSize: "13px",
    color: "#64748b",
    fontWeight: "500",
  },
};

// === HOVER ANIMATIONS ===
const hoverStyles = `
  .nav-link-hover:hover {
    color: #4f46e5 !important;
    background: rgba(99, 102, 241, 0.08) !important;
    transform: translateY(-1px);
  }
  .logo-icon-hover:hover {
    transform: scale(1.05);
    box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4) !important;
  }
`;

// Inject once
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = hoverStyles;
  document.head.appendChild(styleSheet);
}

// Add hover classes via inline (for dynamic links)
if (typeof window !== "undefined") {
  setTimeout(() => {
    document.querySelectorAll("a").forEach((link) => {
      if (link.closest("nav")) {
        link.classList.add("nav-link-hover");
      }
    });
  }, 100);
}