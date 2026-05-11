import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../utils/api";

function SignupIllustration() {
  return (
    <svg viewBox="0 0 340 260" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", maxWidth: 340 }}>
      {/* Background rings */}
      <circle cx="170" cy="128" r="108" stroke="rgba(200,241,53,0.04)" strokeWidth="1"/>
      <circle cx="170" cy="128" r="72"  stroke="rgba(200,241,53,0.06)" strokeWidth="1"/>

      {/* Profile card */}
      <rect x="38" y="18" width="264" height="84" rx="12" fill="#131517" stroke="#2e3138" strokeWidth="1"/>
      {/* Avatar */}
      <circle cx="78" cy="60" r="20" fill="rgba(200,241,53,0.1)" stroke="rgba(200,241,53,0.22)" strokeWidth="1.5"/>
      <circle cx="78" cy="53" r="8"  fill="rgba(200,241,53,0.55)"/>
      <path d="M60 79 Q60 68 78 68 Q96 68 96 79" stroke="rgba(200,241,53,0.55)" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* Name lines */}
      <rect x="110" y="42" width="118" height="7" rx="3.5" fill="#2e3138"/>
      <rect x="110" y="55" width="78"  height="4.5" rx="2.25" fill="#1e2025"/>
      {/* Skill tags */}
      <rect x="110" y="69" width="44" height="14" rx="7" fill="rgba(200,241,53,0.1)" stroke="rgba(200,241,53,0.22)" strokeWidth="0.5"/>
      <text x="132" y="80" textAnchor="middle" fontSize="7.5" fill="#c8f135" fontWeight="600">Python</text>
      <rect x="160" y="69" width="36" height="14" rx="7" fill="rgba(123,241,168,0.1)" stroke="rgba(123,241,168,0.22)" strokeWidth="0.5"/>
      <text x="178" y="80" textAnchor="middle" fontSize="7.5" fill="#7bf1a8" fontWeight="600">React</text>
      <rect x="202" y="69" width="30" height="14" rx="7" fill="rgba(255,179,71,0.1)" stroke="rgba(255,179,71,0.22)" strokeWidth="0.5"/>
      <text x="217" y="80" textAnchor="middle" fontSize="7.5" fill="#ffb347" fontWeight="600">AWS</text>

      {/* Progress steps */}
      {/* Step 1 — active */}
      <circle cx="68"  cy="136" r="14" fill="rgba(200,241,53,0.14)" stroke="#c8f135" strokeWidth="1.5"/>
      <text   x="68"  y="141" textAnchor="middle" fontSize="11" fill="#c8f135" fontWeight="800">1</text>
      <text   x="68"  y="162" textAnchor="middle" fontSize="8.5" fill="#c8f135" fontWeight="600">Account</text>
      {/* Connector */}
      <line x1="83" y1="136" x2="152" y2="136" stroke="rgba(200,241,53,0.25)" strokeWidth="1.5" strokeDasharray="4 3"/>
      {/* Step 2 */}
      <circle cx="167" cy="136" r="14" fill="#1e2025" stroke="#2e3138" strokeWidth="1.5"/>
      <text   x="167" y="141" textAnchor="middle" fontSize="11" fill="#6b6e78" fontWeight="800">2</text>
      <text   x="167" y="162" textAnchor="middle" fontSize="8.5" fill="#6b6e78">Verify</text>
      {/* Connector */}
      <line x1="182" y1="136" x2="251" y2="136" stroke="#2e3138" strokeWidth="1.5" strokeDasharray="4 3"/>
      {/* Step 3 */}
      <circle cx="266" cy="136" r="14" fill="#1e2025" stroke="#2e3138" strokeWidth="1.5"/>
      <text   x="266" y="141" textAnchor="middle" fontSize="11" fill="#6b6e78" fontWeight="800">3</text>
      <text   x="266" y="162" textAnchor="middle" fontSize="8.5" fill="#6b6e78">Start</text>

      {/* AI badge */}
      <rect x="58" y="190" width="224" height="42" rx="12" fill="#131517" stroke="#2e3138" strokeWidth="1"/>
      <circle cx="86" cy="211" r="12" fill="rgba(200,241,53,0.12)"/>
      <text   x="86" y="215" textAnchor="middle" fontSize="12" fill="#c8f135">✦</text>
      <text   x="178" y="206" textAnchor="middle" fontSize="8.5" fill="#f0f0ee" fontWeight="600">AI-powered job matching</text>
      <text   x="174" y="222" textAnchor="middle" fontSize="8"   fill="#6b6e78">Personalised to your skills</text>

      {/* Decorative dots */}
      <circle cx="24"  cy="150" r="3"   fill="rgba(200,241,53,0.18)"/>
      <circle cx="316" cy="96"  r="4"   fill="rgba(123,241,168,0.18)"/>
      <circle cx="312" cy="174" r="2.5" fill="rgba(200,241,53,0.13)"/>
      <circle cx="18"  cy="206" r="2"   fill="rgba(123,241,168,0.13)"/>
    </svg>
  );
}

// ── Step 1: account details ─────────────────────────────────────────────────
function SignupFormWrapper({ onCodeSent }) {
  const [form, setForm]         = useState({ name: "", email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const submit = async e => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await api.post("/signup", form);
      onCodeSent(form.email, form.name, form);
    } catch (err) {
      setError(err.response?.data?.detail || "Signup failed. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <>
      <h2 style={{ marginBottom: 6 }}>Create account</h2>
      <p className="text-muted text-sm" style={{ marginBottom: 28 }}>
        Start your career journey with CareerLens
      </p>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      <form onSubmit={submit}>
        <div className="form-group">
          <label>Full name</label>
          <input className="form-input" placeholder="Your name"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            required minLength={2} />
        </div>
        <div className="form-group">
          <label>Email address</label>
          <input className="form-input" type="email" placeholder="you@example.com"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            required />
        </div>
        <div className="form-group">
          <label>Password</label>
          <div style={{ position: "relative" }}>
            <input
              className="form-input"
              type={showPass ? "text" : "password"}
              placeholder="Min 6 characters"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required minLength={6}
              style={{ paddingRight: 44, width: "100%" }}
            />
            <button type="button" onClick={() => setShowPass(p => !p)}
              style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer",
                color: "var(--muted)", fontSize: 13, padding: 0,
              }}>
              {showPass ? "Hide" : "Show"}
            </button>
          </div>
          {form.password.length > 0 && form.password.length < 6 && (
            <span style={{ fontSize: 12, color: "var(--danger)" }}>At least 6 characters</span>
          )}
        </div>
        <button className="btn-primary" disabled={loading} style={{ marginTop: 4 }}>
          {loading ? "Sending code…" : "Continue →"}
        </button>
      </form>

      <p className="text-sm text-muted" style={{ marginTop: 24, textAlign: "center" }}>
        Already have an account?{" "}
        <Link to="/login" style={{ color: "var(--accent)", fontWeight: 600 }}>Sign in</Link>
      </p>
    </>
  );
}

// ── Step 2: verify email code ───────────────────────────────────────────────
function VerifyForm({ email, onResend }) {
  const [digits, setDigits]       = useState(["", "", "", "", "", ""]);
  const [error, setError]         = useState("");
  const [ok, setOk]               = useState("");
  const [loading, setLoading]     = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef([]);
  const navigate  = useNavigate();

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleDigit = (index, value) => {
    const cleaned = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = cleaned;
    setDigits(next);
    if (cleaned && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0)
      inputRefs.current[index - 1]?.focus();
  };

  const handlePaste = e => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
    e.preventDefault();
  };

  const submit = async e => {
    e.preventDefault();
    const code = digits.join("");
    if (code.length < 6) { setError("Enter all 6 digits"); return; }
    setError(""); setLoading(true);
    try {
      await api.post("/verify-email", { email, code });
      setOk("Account created! Redirecting to sign in…");
      setTimeout(() => navigate("/login"), 1800);
    } catch (err) {
      setError(err.response?.data?.detail || "Verification failed. Try again.");
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally { setLoading(false); }
  };

  const resend = async () => {
    setResending(true); setError(""); setOk("");
    try {
      await onResend();
      setCountdown(60);
      setOk("A new code has been sent!");
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to resend. Try again.");
    } finally { setResending(false); }
  };

  return (
    <>
      <button
        onClick={() => window.location.reload()}
        style={{
          color: "var(--muted)", fontSize: 13, background: "none", border: "none",
          cursor: "pointer", padding: 0, marginBottom: 20,
          display: "inline-flex", alignItems: "center", gap: 4,
        }}
      >
        ← Back
      </button>

      <h2 style={{ marginBottom: 6 }}>Check your email</h2>
      <p className="text-muted text-sm" style={{ marginBottom: 6 }}>
        We sent a 6-digit code to
      </p>
      <p style={{ fontWeight: 600, color: "var(--accent)", marginBottom: 28, fontSize: 14 }}>
        {email}
      </p>

      {error && <div className="alert alert-error"  style={{ marginBottom: 16 }}>{error}</div>}
      {ok    && <div className="alert alert-success" style={{ marginBottom: 16 }}>{ok}</div>}

      <form onSubmit={submit}>
        <div className="otp-row" style={{ justifyContent: "flex-start", marginBottom: 24 }}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => (inputRefs.current[i] = el)}
              value={d}
              onChange={e => handleDigit(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              onPaste={i === 0 ? handlePaste : undefined}
              maxLength={1}
              inputMode="numeric"
              autoComplete="one-time-code"
              className="otp-input"
              style={{ border: `1.5px solid ${d ? "var(--accent)" : "var(--border2)"}` }}
            />
          ))}
        </div>
        <button className="btn-primary" disabled={loading || digits.join("").length < 6}>
          {loading ? "Verifying…" : "Verify & create account"}
        </button>
      </form>

      <div style={{ marginTop: 20, textAlign: "center" }}>
        {countdown > 0 ? (
          <p className="text-sm text-muted">
            Resend code in <span style={{ color: "var(--text)" }}>{countdown}s</span>
          </p>
        ) : (
          <button onClick={resend} disabled={resending}
            style={{ background: "none", border: "none", cursor: "pointer",
              color: "var(--accent)", fontSize: 13, fontWeight: 600 }}>
            {resending ? "Sending…" : "Resend code"}
          </button>
        )}
      </div>

      <p className="text-sm text-muted" style={{ marginTop: 12, textAlign: "center" }}>
        Wrong email?{" "}
        <button onClick={() => window.location.reload()}
          style={{ background: "none", border: "none", cursor: "pointer",
            color: "var(--accent)", fontSize: 13, fontWeight: 600, padding: 0 }}>
          Start over
        </button>
      </p>
    </>
  );
}

const BADGES = ["Python", "React.js", "AWS", "Docker", "Machine Learning", "Node.js", "TypeScript", "Kubernetes"];

export default function Signup() {
  const [step, setStep]   = useState(1);
  const [email, setEmail] = useState("");
  const [signupForm, setSignupForm] = useState(null);

  const handleCodeSent = (sentEmail, _name, savedForm) => {
    setEmail(sentEmail);
    setSignupForm(savedForm);
    setStep(2);
  };

  const handleResend = async () => {
    await api.post("/signup", signupForm);
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
            Begin your<br/>
            <span className="auth-hero-accent">career</span><br/>
            journey<br/>today
          </h1>

          <p className="auth-hero-sub">
            Join thousands of job seekers using AI to land their next role faster with personalised matching.
          </p>

          <div className="auth-float-badges">
            {BADGES.map((b, i) => (
              <span key={b} className={`auth-float-badge float-anim-${i % 4}`}>{b}</span>
            ))}
          </div>

          <div className="auth-hero-illustration">
            <SignupIllustration />
          </div>
        </div>
      </div>

      {/* ── RIGHT FORM ── */}
      <div className="auth-form-panel">
        <div className="auth-form-inner">
          {/* Step indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 32 }}>
            {[1, 2].map(s => (
              <React.Fragment key={s}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700,
                  background: step >= s ? "var(--accent)" : "var(--border)",
                  color: step >= s ? "#0b0c0e" : "var(--muted)",
                  transition: "background .2s",
                }}>{s}</div>
                {s < 2 && (
                  <div style={{
                    flex: 1, height: 2, maxWidth: 40,
                    background: step > s ? "var(--accent)" : "var(--border)",
                    borderRadius: 2, transition: "background .2s",
                  }} />
                )}
              </React.Fragment>
            ))}
            <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: 4 }}>
              {step === 1 ? "Account details" : "Verify email"}
            </span>
          </div>

          {step === 1 ? (
            <SignupFormWrapper onCodeSent={handleCodeSent} />
          ) : (
            <VerifyForm email={email} onResend={handleResend} />
          )}
        </div>
      </div>
    </div>
  );
}
