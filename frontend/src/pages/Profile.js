import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

// ── Change Password card ───────────────────────────────────────────────────
function ChangePasswordCard() {
  const [form, setForm]     = useState({ current: "", next: "", confirm: "" });
  const [show, setShow]     = useState({ current: false, next: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState({ text: "", type: "" });

  const toggle = key => setShow(s => ({ ...s, [key]: !s[key] }));

  const submit = async e => {
    e.preventDefault();
    setMsg({ text: "", type: "" });
    if (form.next !== form.confirm) {
      setMsg({ text: "New passwords do not match.", type: "error" }); return;
    }
    if (form.next.length < 6) {
      setMsg({ text: "New password must be at least 6 characters.", type: "error" }); return;
    }
    setSaving(true);
    try {
      await api.post("/change-password", { current_password: form.current, new_password: form.next });
      setMsg({ text: "Password changed successfully!", type: "success" });
      setForm({ current: "", next: "", confirm: "" });
    } catch (err) {
      setMsg({ text: err.response?.data?.detail || "Failed to change password.", type: "error" });
    } finally { setSaving(false); }
  };

  const pwField = (key, label, placeholder) => (
    <div className="form-group">
      <label>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          className="form-input"
          type={show[key] ? "text" : "password"}
          placeholder={placeholder}
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          required
          style={{ paddingRight: 52, width: "100%" }}
        />
        <button type="button" onClick={() => toggle(key)} style={{
          position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
          background: "none", border: "none", cursor: "pointer",
          color: "var(--muted)", fontSize: 13, padding: 0,
        }}>
          {show[key] ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="card">
      <h3 style={{ marginBottom: 18 }}>Change Password</h3>
      {msg.text && (
        <div className={`alert alert-${msg.type === "success" ? "success" : "error"}`}
             style={{ marginBottom: 16 }}>
          {msg.text}
        </div>
      )}
      <form onSubmit={submit} style={{ maxWidth: 420 }}>
        {pwField("current", "Current password",    "Enter current password")}
        {pwField("next",    "New password",         "Min 6 characters")}
        {pwField("confirm", "Confirm new password", "Repeat new password")}
        {form.next.length > 0 && form.next.length < 6 && (
          <p style={{ fontSize: 12, color: "var(--danger)", marginTop: -10, marginBottom: 12 }}>
            At least 6 characters required
          </p>
        )}
        <button className="apply-btn" style={{ padding: "10px 24px", fontSize: 14 }} disabled={saving}>
          {saving ? "Saving…" : "Update Password"}
        </button>
      </form>
    </div>
  );
}

// ── Danger Zone card ───────────────────────────────────────────────────────
function DangerZone() {
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [open,    setOpen]    = useState(false);
  const { user, logout }      = useAuth();
  const navigate              = useNavigate();

  const deleteAccount = async () => {
    if (confirm !== user) return;
    setLoading(true);
    try {
      await api.delete("/delete-account");
      logout();
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete account.");
    } finally { setLoading(false); }
  };

  return (
    <div className="card" style={{ borderColor: "rgba(255,95,95,.25)" }}>
      <h3 style={{ color: "var(--danger)", marginBottom: 6 }}>Danger Zone</h3>
      <p className="text-muted text-sm" style={{ marginBottom: 14 }}>
        Permanently delete your account and all associated data. This cannot be undone.
      </p>
      {!open ? (
        <button
          className="apply-btn"
          onClick={() => setOpen(true)}
          style={{ background: "rgba(255,95,95,.12)", color: "var(--danger)",
                   border: "1px solid rgba(255,95,95,.3)", fontSize: 13 }}
        >
          Delete My Account
        </button>
      ) : (
        <div style={{ maxWidth: 420 }}>
          <p style={{ fontSize: 13, color: "var(--text)", marginBottom: 10 }}>
            Type your email address <strong style={{ color: "var(--danger)" }}>{user}</strong> to confirm:
          </p>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <input
              className="form-input"
              placeholder={user}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              style={{ borderColor: confirm === user ? "var(--danger)" : undefined }}
            />
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              className="apply-btn"
              onClick={deleteAccount}
              disabled={confirm !== user || loading}
              style={{ background: "var(--danger)", color: "#fff", opacity: confirm === user ? 1 : 0.4 }}
            >
              {loading ? "Deleting…" : "Permanently Delete"}
            </button>
            <button
              className="apply-btn outline"
              onClick={() => { setOpen(false); setConfirm(""); }}
              style={{ fontSize: 13 }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function Profile() {
  const { user } = useAuth();

  return (
    <div>
      <div className="page-header">
        <h1>Account Settings</h1>
        <p>Manage your login credentials and account preferences.</p>
      </div>

      <div style={{ display: "grid", gap: 16 }}>

        {/* Account info */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Account Information</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 16 }}>
            <div>
              <div className="text-muted text-sm">Registered Email</div>
              <div style={{ fontWeight: 500, marginTop: 4, wordBreak: "break-all" }}>{user}</div>
              <div className="text-muted text-sm" style={{ marginTop: 4, fontSize: 12 }}>
                Email cannot be changed after registration
              </div>
            </div>
            <div>
              <div className="text-muted text-sm">Account Type</div>
              <div style={{ fontWeight: 500, marginTop: 4 }}>
                <span className="badge green">Standard User</span>
              </div>
            </div>
          </div>
        </div>

        <ChangePasswordCard />

        <DangerZone />
      </div>
    </div>
  );
}
