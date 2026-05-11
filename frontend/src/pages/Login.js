import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

function JobSearchIllustration() {
  return (
    <svg viewBox="0 0 340 280" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", maxWidth: 340 }}>
      <circle cx="170" cy="145" r="118" stroke="rgba(200,241,53,0.05)" strokeWidth="1"/>
      <circle cx="170" cy="145" r="82"  stroke="rgba(200,241,53,0.07)" strokeWidth="1"/>
      <circle cx="170" cy="145" r="48"  stroke="rgba(200,241,53,0.10)" strokeWidth="1"/>
      <circle cx="170" cy="145" r="40" fill="rgba(200,241,53,0.06)" stroke="rgba(200,241,53,0.18)" strokeWidth="1.5"/>
      <circle cx="164" cy="140" r="16" stroke="#c8f135" strokeWidth="2.5" fill="none"/>
      <line x1="175.5" y1="151.5" x2="188" y2="164" stroke="#c8f135" strokeWidth="3" strokeLinecap="round"/>
      <line x1="159" y1="140" x2="169" y2="140" stroke="rgba(200,241,53,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="164" y1="135" x2="164" y2="145" stroke="rgba(200,241,53,0.5)" strokeWidth="1.5" strokeLinecap="round"/>

      {/* Job card top-left */}
      <rect x="14" y="48" width="108" height="66" rx="10" fill="#131517" stroke="#2e3138" strokeWidth="1"/>
      <circle cx="33" cy="68" r="10" fill="#1e2025"/>
      <text x="33" y="72" textAnchor="middle" fontSize="10" fill="#c8f135">🏢</text>
      <rect x="50" y="62" width="56" height="5" rx="2.5" fill="#2e3138"/>
      <rect x="50" y="71" width="38" height="3" rx="1.5" fill="#1e2025"/>
      <rect x="22" y="82" width="38" height="13" rx="6.5" fill="rgba(200,241,53,0.1)" stroke="rgba(200,241,53,0.22)" strokeWidth="0.5"/>
      <text x="41" y="93" textAnchor="middle" fontSize="7" fill="#c8f135" fontWeight="600">FULL-TIME</text>
      <rect x="65" y="82" width="42" height="13" rx="6.5" fill="rgba(123,241,168,0.08)" stroke="rgba(123,241,168,0.18)" strokeWidth="0.5"/>
      <text x="86" y="93" textAnchor="middle" fontSize="7" fill="#7bf1a8" fontWeight="600">REMOTE</text>

      {/* Job card top-right */}
      <rect x="218" y="34" width="112" height="66" rx="10" fill="#131517" stroke="#2e3138" strokeWidth="1"/>
      <circle cx="237" cy="54" r="10" fill="#1e2025"/>
      <text x="237" y="58" textAnchor="middle" fontSize="10" fill="#7bf1a8">💻</text>
      <rect x="254" y="48" width="58" height="5" rx="2.5" fill="#2e3138"/>
      <rect x="254" y="57" width="40" height="3" rx="1.5" fill="#1e2025"/>
      <rect x="227" y="68" width="93" height="22" rx="6" fill="rgba(200,241,53,0.07)"/>
      <circle cx="234" cy="79" r="5" fill="rgba(200,241,53,0.2)"/>
      <text x="234" y="82" textAnchor="middle" fontSize="7" fill="#c8f135">✦</text>
      <text x="268" y="82" textAnchor="middle" fontSize="8" fill="#c8f135" fontWeight="700">92% Match</text>

      {/* Skills card bottom-left */}
      <rect x="10" y="182" width="108" height="72" rx="10" fill="#131517" stroke="#2e3138" strokeWidth="1"/>
      <text x="20" y="199" fontSize="8" fill="#6b6e78" fontWeight="700" letterSpacing="0.5">SKILLS MATCH</text>
      <rect x="20" y="204" width="88" height="6" rx="3" fill="#1e2025"/>
      <rect x="20" y="204" width="70" height="6" rx="3" fill="#c8f135"/>
      <text x="20" y="222" fontSize="9" fill="#c8f135" fontWeight="700">80% Ready</text>
      <rect x="20" y="228" width="30" height="13" rx="6.5" fill="rgba(200,241,53,0.1)"/>
      <text x="35" y="238" textAnchor="middle" fontSize="7" fill="#c8f135">Python</text>
      <rect x="55" y="228" width="28" height="13" rx="6.5" fill="rgba(123,241,168,0.1)"/>
      <text x="69" y="238" textAnchor="middle" fontSize="7" fill="#7bf1a8">React</text>
      <rect x="88" y="228" width="24" height="13" rx="6.5" fill="rgba(255,179,71,0.1)"/>
      <text x="100" y="238" textAnchor="middle" fontSize="7" fill="#ffb347">AWS</text>
      <text x="20" y="247" fontSize="7.5" fill="#6b6e78">+4 more skills matched</text>

      {/* AI card bottom-right */}
      <rect x="218" y="190" width="112" height="68" rx="10" fill="#131517" stroke="#2e3138" strokeWidth="1"/>
      <circle cx="232" cy="210" r="9" fill="rgba(200,241,53,0.12)"/>
      <text x="232" y="214" textAnchor="middle" fontSize="10" fill="#c8f135">✦</text>
      <text x="246" y="208" fontSize="8.5" fill="#f0f0ee" fontWeight="600">AI Recommended</text>
      <rect x="222" y="218" width="98" height="3" rx="1.5" fill="#1e2025"/>
      <rect x="222" y="225" width="78" height="3" rx="1.5" fill="#1e2025"/>
      <rect x="222" y="232" width="58" height="3" rx="1.5" fill="#1e2025"/>
      <rect x="222" y="242" width="62" height="12" rx="6" fill="rgba(200,241,53,0.12)" stroke="rgba(200,241,53,0.28)" strokeWidth="0.5"/>
      <text x="253" y="252" textAnchor="middle" fontSize="7.5" fill="#c8f135" fontWeight="600">View Jobs →</text>

      {/* Dashed connectors */}
      <line x1="122" y1="98" x2="135" y2="112" stroke="rgba(200,241,53,0.12)" strokeWidth="1" strokeDasharray="3 3"/>
      <line x1="218" y1="106" x2="207" y2="117" stroke="rgba(200,241,53,0.12)" strokeWidth="1" strokeDasharray="3 3"/>
      <line x1="118" y1="192" x2="133" y2="182" stroke="rgba(200,241,53,0.12)" strokeWidth="1" strokeDasharray="3 3"/>
      <line x1="218" y1="198" x2="206" y2="186" stroke="rgba(200,241,53,0.12)" strokeWidth="1" strokeDasharray="3 3"/>
    </svg>
  );
}

const BADGES = ["Python", "React.js", "AWS", "Docker", "Machine Learning", "Node.js", "TypeScript", "Kubernetes"];

export default function Login() {
  const [form, setForm]       = useState({ email: "", password: "" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const { login }  = useAuth();
  const navigate   = useNavigate();

  const submit = async e => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await api.post("/login", form);
      login(res.data.access_token, form.email);
      navigate(res.data.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-split-page">

      {/* ── LEFT HERO ── */}
      <div className="auth-hero-panel">
        <div className="auth-hero-inner">
          <div className="auth-hero-logo">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="13" stroke="#c8f135" strokeWidth="1.5"/>
              <circle cx="14" cy="14" r="7"  fill="rgba(200,241,53,0.15)" stroke="#c8f135" strokeWidth="1"/>
              <circle cx="14" cy="14" r="2"  fill="#c8f135"/>
            </svg>
            CareerLens
          </div>

          <h1 className="auth-hero-title">
            Find your<br/>
            <span className="auth-hero-accent">dream job</span><br/>
            here easily<br/>and quickly
          </h1>

          <p className="auth-hero-sub">
            AI-powered matching and skill gap analysis to help you land your next role faster.
          </p>

          <div className="auth-float-badges">
            {BADGES.map((b, i) => (
              <span key={b} className={`auth-float-badge float-anim-${i % 4}`}>{b}</span>
            ))}
          </div>

          <div className="auth-hero-illustration">
            <JobSearchIllustration />
          </div>
        </div>
      </div>

      {/* ── RIGHT FORM ── */}
      <div className="auth-form-panel">
        <div className="auth-form-inner">
          <h2 style={{ marginBottom: 6 }}>Welcome back</h2>
          <p className="text-muted text-sm" style={{ marginBottom: 28 }}>
            Sign in to your CareerLens account
          </p>

          {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

          <form onSubmit={submit}>
            <div className="form-group">
              <label>Email address</label>
              <input className="form-input" type="email" placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input className="form-input" type="password" placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>
            <button className="btn-primary" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? "Signing in…" : "Sign in →"}
            </button>
          </form>

          <p className="text-sm text-muted" style={{ marginTop: 24, textAlign: "center" }}>
            Don't have an account?{" "}
            <Link to="/signup" style={{ color: "var(--accent)", fontWeight: 600 }}>Create account</Link>
          </p>

          <div style={{ marginTop: 36, paddingTop: 24, borderTop: "1px solid var(--border)" }}>
            {[
              { icon: "🤖", label: "AI-powered job matching" },
              { icon: "📊", label: "Skill gap analysis & roadmaps" },
              { icon: "🛠",  label: "Personalised project ideas" },
            ].map(f => (
              <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 11 }}>
                <span style={{ fontSize: 15 }}>{f.icon}</span>
                <span style={{ fontSize: 13, color: "var(--muted)" }}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
