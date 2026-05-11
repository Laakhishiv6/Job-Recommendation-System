import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const HELP_STEPS = [
  {
    icon: "👤",
    title: "Complete Your Profile",
    desc: "Go to Profile and add your skills, work experience, and education. Upload your resume PDF for the best AI results.",
  },
  {
    icon: "💼",
    title: "Browse Jobs",
    desc: "Visit Browse Jobs to explore listings from Remotive, Arbeitnow, The Muse, and more. Use the search bar and filters to narrow results.",
  },
  {
    icon: "✦",
    title: "Get AI Recommendations",
    desc: "Head to Recommendations. The AI analyses your profile and generates personalised job matches with match scores and explanations.",
  },
  {
    icon: "🎯",
    title: "Analyse Skill Gaps",
    desc: "On any job card, click Analyse Skill Gap. The AI compares your skills against the job requirements and shows what you need to learn.",
  },
  {
    icon: "🚀",
    title: "Build Missing Skills",
    desc: "Each recommended job includes an AI-generated project idea so you can practise the missing skills with a real portfolio piece.",
  },
];

export default function Navbar() {
  const { isAuth, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const close = () => setMenuOpen(false);

  const handleLogout = () => {
    logout();
    close();
    navigate("/login");
  };

  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 768) close(); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = helpOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [helpOpen]);

  const navLinkClass = ({ isActive }) => "nav-link" + (isActive ? " active" : "");

  return (
    <>
      <nav className="navbar">
        <NavLink to={isAdmin ? "/admin" : "/dashboard"} className="nav-logo" onClick={close}>
          CareerLens
        </NavLink>

        {isAuth ? (
          <>
            <div className={`nav-links${menuOpen ? " open" : ""}`}>
              {isAdmin ? (
                <>
                  <NavLink to="/admin"        className={navLinkClass} onClick={close}>Overview</NavLink>
                  <NavLink to="/admin/users"  className={navLinkClass} onClick={close}>Users</NavLink>
                  <NavLink to="/admin/jobs"   className={navLinkClass} onClick={close}>Job Fetcher</NavLink>
                  <NavLink to="/jobs"         className={navLinkClass} onClick={close}>Browse Jobs</NavLink>
                  <span className="badge" style={{ fontSize: 11, marginLeft: 4, marginRight: 4 }}>Admin</span>
                </>
              ) : (
                <>
                  <NavLink to="/dashboard" className={navLinkClass} onClick={close}>Dashboard</NavLink>
                  <NavLink to="/jobs"      className={navLinkClass} onClick={close}>Browse Jobs</NavLink>
                  <NavLink to="/recommend" className={navLinkClass} onClick={close}>Recommendations</NavLink>
                  <NavLink to="/profile"   className={navLinkClass} onClick={close}>Profile</NavLink>
                </>
              )}
              <button
                className="help-btn"
                onClick={() => { setHelpOpen(true); close(); }}
                title="Help & Guide"
                style={{ marginLeft: 4 }}
              >
                ?
              </button>
              <button className="nav-btn ghost" onClick={handleLogout} style={{ marginLeft: 4 }}>
                Sign out
              </button>
            </div>
            <button
              className={`nav-hamburger${menuOpen ? " open" : ""}`}
              onClick={() => setMenuOpen(m => !m)}
              aria-label="Toggle navigation menu"
              aria-expanded={menuOpen}
            >
              <span /><span /><span />
            </button>
          </>
        ) : (
          <>
            <div className={`nav-links${menuOpen ? " open" : ""}`}>
              <button
                className="help-btn"
                onClick={() => setHelpOpen(true)}
                title="Help & Guide"
              >
                ?
              </button>
              <NavLink to="/login"  className="nav-link" onClick={close}>Log in</NavLink>
              <NavLink to="/signup" className="nav-btn"  onClick={close}>Get started</NavLink>
            </div>
            <button
              className={`nav-hamburger${menuOpen ? " open" : ""}`}
              onClick={() => setMenuOpen(m => !m)}
              aria-label="Toggle navigation menu"
              aria-expanded={menuOpen}
            >
              <span /><span /><span />
            </button>
          </>
        )}
      </nav>

      <div
        className={`nav-overlay${menuOpen ? " open" : ""}`}
        onClick={close}
        aria-hidden="true"
      />

      {/* ── Help Panel ── */}
      <div
        className={`help-overlay${helpOpen ? " open" : ""}`}
        onClick={() => setHelpOpen(false)}
        aria-hidden="true"
      />

      <aside className={`help-panel${helpOpen ? " open" : ""}`} aria-label="Help guide">
        <div className="help-panel-header">
          <h3 style={{ margin: 0, fontSize: 16 }}>How to use CareerLens</h3>
          <button
            className="help-panel-close"
            onClick={() => setHelpOpen(false)}
            aria-label="Close help panel"
          >
            ×
          </button>
        </div>

        <div className="help-panel-body">
          <p className="text-muted text-sm" style={{ marginBottom: 24, lineHeight: 1.65 }}>
            Follow these steps to get the most out of CareerLens. All AI features are powered by Groq and are personalised to your profile.
          </p>

          <div className="help-section-title">Step-by-step guide</div>

          {HELP_STEPS.map((step, i) => (
            <div className="help-step" key={step.title}>
              <div className="help-step-num">{i + 1}</div>
              <div className="help-step-content">
                <h4>{step.icon} {step.title}</h4>
                <p>{step.desc}</p>
              </div>
            </div>
          ))}

          <div style={{
            marginTop: 8, padding: "16px",
            background: "rgba(200,241,53,0.06)",
            borderRadius: "var(--radius-sm)",
            border: "1px solid rgba(200,241,53,0.18)",
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)", marginBottom: 6 }}>
              ✦ Real-time AI analysis
            </div>
            <p className="text-muted text-sm" style={{ lineHeight: 1.6 }}>
              Recommendations, skill gap reports, and project ideas are generated fresh each time using Groq AI — each result is unique to your profile.
            </p>
          </div>

          <div style={{
            marginTop: 12, padding: "16px",
            background: "var(--bg)",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border2)",
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
              🔄 Job listings
            </div>
            <p className="text-muted text-sm" style={{ lineHeight: 1.6 }}>
              Jobs are cached in MongoDB. Admins refresh them from the Job Fetcher page using free sources (Remotive, Arbeitnow, The Muse) — no API key required.
            </p>
          </div>

          <div style={{
            marginTop: 12, padding: "16px",
            background: "var(--bg)",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border2)",
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
              🔒 Session security
            </div>
            <p className="text-muted text-sm" style={{ lineHeight: 1.6 }}>
              Sessions expire automatically after 8 hours. If you are signed out unexpectedly, simply sign in again. Your profile data is always saved.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
