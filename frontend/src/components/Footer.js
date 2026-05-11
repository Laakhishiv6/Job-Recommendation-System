import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">

        {/* ── Top grid ── */}
        <div className="footer-top">

          {/* Brand */}
          <div className="footer-brand">
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
              <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="13" stroke="#c8f135" strokeWidth="1.5"/>
                <circle cx="14" cy="14" r="7"  fill="rgba(200,241,53,0.15)" stroke="#c8f135" strokeWidth="1"/>
                <circle cx="14" cy="14" r="2"  fill="#c8f135"/>
              </svg>
              <span className="footer-brand-name">CareerLens</span>
            </div>
            <p>
              AI-powered job matching and skill gap analysis.
              Find your next role faster with personalised recommendations.
            </p>
            <div style={{
              marginTop: 16,
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "5px 11px", borderRadius: 6,
              background: "rgba(200,241,53,0.06)",
              border: "1px solid rgba(200,241,53,0.15)",
            }}>
              <span style={{ color: "var(--accent)", fontSize: 11 }}>✦</span>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>Powered by Groq AI</span>
            </div>
          </div>

          {/* Product */}
          <div className="footer-col">
            <h4>Product</h4>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/jobs">Browse Jobs</Link>
            <Link to="/recommend">AI Recommendations</Link>
            <Link to="/skill-gap">Skill Gap Analysis</Link>
            <Link to="/profile">My Profile</Link>
          </div>

          {/* Account */}
          <div className="footer-col">
            <h4>Account</h4>
            <Link to="/signup">Create Account</Link>
            <Link to="/login">Sign In</Link>
          </div>

          {/* Job sources */}
          <div className="footer-col">
            <h4>Job Sources</h4>
            <a href="https://remotive.com" target="_blank" rel="noreferrer">
              Remotive <span style={{ fontSize: 10 }}>↗</span>
            </a>
            <a href="https://www.arbeitnow.com" target="_blank" rel="noreferrer">
              Arbeitnow <span style={{ fontSize: 10 }}>↗</span>
            </a>
            <a href="https://www.themuse.com" target="_blank" rel="noreferrer">
              The Muse <span style={{ fontSize: 10 }}>↗</span>
            </a>
            <span style={{ fontSize: 12, color: "var(--muted)", marginTop: 6, display: "block" }}>
              Free · No API key required
            </span>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} CareerLens. All rights reserved.</p>
          <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "var(--border2)" }}>Privacy Policy</span>
            <span style={{ fontSize: 12, color: "var(--border2)" }}>Terms of Service</span>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>
              Making job search smarter with AI
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}
