import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../utils/api";

// ── Step 1: account details ────────────────────────────────────────────────
function SignupForm({ onCodeSent }) {
  const [form, setForm]         = useState({ name: "", email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const submit = async e => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await api.post("/signup", form);
      onCodeSent(form.email, form.name);
    } catch (err) {
      setError(err.response?.data?.detail || "Signup failed. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <>
      <h2 style={{ marginBottom: 6 }}>Create account</h2>
      <p className="text-muted text-sm" style={{ marginBottom: 24 }}>
        Start your career journey with CareerLens
      </p>

      {error && <div className="alert alert-error mb-4">{error}</div>}

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
              style={{ paddingRight: 44 }}
            />
            <button
              type="button"
              onClick={() => setShowPass(p => !p)}
              style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer",
                color: "var(--muted)", fontSize: 13, padding: 0,
              }}
            >
              {showPass ? "Hide" : "Show"}
            </button>
          </div>
          {form.password.length > 0 && form.password.length < 6 && (
            <span style={{ fontSize: 12, color: "var(--danger)" }}>At least 6 characters</span>
          )}
        </div>

        <button className="btn-primary" disabled={loading}>
          {loading ? "Sending code…" : "Continue"}
        </button>
      </form>

      <p className="text-sm text-muted" style={{ marginTop: 20, textAlign: "center" }}>
        Already have an account?{" "}
        <Link to="/login" style={{ color: "var(--accent)" }}>Sign in</Link>
      </p>
    </>
  );
}

// ── Step 2: verify email code ─────────────────────────────────────────────
function VerifyForm({ email, name, onResend }) {
  const [digits, setDigits]     = useState(["", "", "", "", "", ""]);
  const [error, setError]       = useState("");
  const [ok, setOk]             = useState("");
  const [loading, setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef([]);
  const navigate  = useNavigate();

  // Countdown timer for resend button
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
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
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
      {/* Back arrow */}
      <div style={{ marginBottom: 20 }}>
        <Link
          to="/signup"
          onClick={e => { e.preventDefault(); window.location.reload(); }}
          style={{ color: "var(--muted)", fontSize: 13, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}
        >
          ← Back
        </Link>
      </div>

      <h2 style={{ marginBottom: 6 }}>Check your email</h2>
      <p className="text-muted text-sm" style={{ marginBottom: 6 }}>
        We sent a 6-digit code to
      </p>
      <p style={{ fontWeight: 600, color: "var(--accent)", marginBottom: 24, fontSize: 14 }}>
        {email}
      </p>

      {error && <div className="alert alert-error mb-4">{error}</div>}
      {ok    && <div className="alert alert-success mb-4">{ok}</div>}

      <form onSubmit={submit}>
        {/* 6-digit code inputs */}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 24 }}>
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
              style={{
                width: 48, height: 56, textAlign: "center", fontSize: 24, fontWeight: 700,
                background: "var(--bg)", border: `1.5px solid ${d ? "var(--accent)" : "var(--border2)"}`,
                borderRadius: 8, color: "var(--text)", outline: "none",
                transition: "border-color .15s",
                fontFamily: "monospace",
              }}
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
          <button
            onClick={resend}
            disabled={resending}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--accent)", fontSize: 13, fontWeight: 600,
            }}
          >
            {resending ? "Sending…" : "Resend code"}
          </button>
        )}
      </div>

      <p className="text-sm text-muted" style={{ marginTop: 12, textAlign: "center" }}>
        Wrong email?{" "}
        <Link to="/signup"
          onClick={e => { e.preventDefault(); window.location.reload(); }}
          style={{ color: "var(--accent)" }}>
          Start over
        </Link>
      </p>
    </>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function Signup() {
  const [step, setStep]   = useState(1);
  const [email, setEmail] = useState("");
  const [name, setName]   = useState("");
  const [signupForm, setSignupForm] = useState(null);

  const handleCodeSent = (sentEmail, sentName, savedForm) => {
    setEmail(sentEmail);
    setName(sentName);
    setSignupForm(savedForm);
    setStep(2);
  };

  const handleResend = async () => {
    await api.post("/signup", signupForm);
  };

  return (
    <div style={{ maxWidth: 440, margin: "60px auto" }}>
      <div className="card">
        {/* Step indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
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
                  flex: 1, height: 2,
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
          <VerifyForm email={email} name={name} onResend={handleResend} />
        )}
      </div>
    </div>
  );
}

// Wrapper to capture form data for resend
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
      <p className="text-muted text-sm" style={{ marginBottom: 24 }}>
        Start your career journey with CareerLens
      </p>

      {error && <div className="alert alert-error mb-4">{error}</div>}

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

        <button className="btn-primary" disabled={loading}>
          {loading ? "Sending code…" : "Continue →"}
        </button>
      </form>

      <p className="text-sm text-muted" style={{ marginTop: 20, textAlign: "center" }}>
        Already have an account?{" "}
        <Link to="/login" style={{ color: "var(--accent)" }}>Sign in</Link>
      </p>
    </>
  );
}
