import React, { useEffect, useState } from "react";
import api from "../../utils/api";

function ProfileModal({ email, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/admin/users/${encodeURIComponent(email)}/profile`)
      .then(r => setProfile(r.data.profile))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [email]);

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center" style={{ marginBottom: 20 }}>
          <h3>Profile — {email}</h3>
          <button onClick={onClose} className="admin-modal-close">✕</button>
        </div>

        {loading ? (
          <div className="spinner" />
        ) : !profile ? (
          <p className="text-muted">No resume uploaded yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 16, maxHeight: "60vh", overflowY: "auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 12 }}>
              {[
                { label: "Name",  value: profile.name },
                { label: "Email", value: profile.email },
                { label: "Phone", value: profile.phone },
              ].map(f => (
                <div key={f.label}>
                  <div className="text-muted text-sm">{f.label}</div>
                  <div style={{ fontWeight: 500, marginTop: 2 }}>{f.value || "—"}</div>
                </div>
              ))}
            </div>

            {profile.skills?.length > 0 && (
              <div>
                <div className="text-muted text-sm" style={{ marginBottom: 8 }}>
                  Skills ({profile.skills.length})
                </div>
                <div className="skills-list">
                  {profile.skills.map(s => <span key={s} className="badge accent">{s}</span>)}
                </div>
              </div>
            )}

            {profile.experience?.length > 0 && (
              <div>
                <div className="text-muted text-sm" style={{ marginBottom: 8 }}>Experience</div>
                <div style={{ display: "grid", gap: 10 }}>
                  {profile.experience.map((e, i) => (
                    <div key={i} style={{
                      padding: "12px 14px", borderRadius: "var(--radius-sm)",
                      background: "var(--bg)", border: "1px solid var(--border2)"
                    }}>
                      <div style={{ fontWeight: 600 }}>{e.title || "Role"}</div>
                      <div className="text-muted text-sm">{e.company}{e.duration ? ` · ${e.duration}` : ""}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {profile.education?.length > 0 && (
              <div>
                <div className="text-muted text-sm" style={{ marginBottom: 8 }}>Education</div>
                <div style={{ display: "grid", gap: 10 }}>
                  {profile.education.map((e, i) => (
                    <div key={i} style={{
                      padding: "12px 14px", borderRadius: "var(--radius-sm)",
                      background: "var(--bg)", border: "1px solid var(--border2)"
                    }}>
                      <div style={{ fontWeight: 600 }}>{e.degree || "Degree"}</div>
                      <div className="text-muted text-sm">{e.institution}{e.year ? ` · ${e.year}` : ""}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function UserRow({ user, onDelete, onPasswordReset }) {
  const [newPass, setNewPass]     = useState("");
  const [resetting, setResetting] = useState(false);
  const [showPass, setShowPass]   = useState(false);
  const [passMsg, setPassMsg]     = useState("");
  const [deleting, setDeleting]   = useState(false);

  const resetPassword = async () => {
    if (newPass.length < 6) { setPassMsg("Min 6 characters"); return; }
    setResetting(true); setPassMsg("");
    try {
      await api.post(`/admin/users/${encodeURIComponent(user.email)}/reset-password`, { new_password: newPass });
      setPassMsg("Password reset!");
      setNewPass("");
      setShowPass(false);
      setTimeout(() => setPassMsg(""), 3000);
    } catch (err) {
      setPassMsg(err.response?.data?.detail || "Failed");
    } finally { setResetting(false); }
  };

  const confirmDelete = async () => {
    if (!window.confirm(`Delete user "${user.email}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/users/${encodeURIComponent(user.email)}`);
      onDelete(user.email);
    } catch (err) {
      alert(err.response?.data?.detail || "Delete failed");
    } finally { setDeleting(false); }
  };

  return (
    <div className="admin-user-row">
      {/* User info */}
      <div className="admin-user-info">
        <div style={{ fontWeight: 600, marginBottom: 2 }}>{user.name || "—"}</div>
        <div className="text-muted text-sm">{user.email}</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
          {user.has_profile ? (
            <span className="badge green">Resume uploaded</span>
          ) : (
            <span className="badge">No resume</span>
          )}
          {user.skills_count > 0 && (
            <span className="badge accent">{user.skills_count} skills</span>
          )}
        </div>
        {user.skills_preview?.length > 0 && (
          <div className="skills-list" style={{ marginTop: 8, gap: 4 }}>
            {user.skills_preview.map(s => (
              <span key={s} className="badge" style={{ fontSize: 11 }}>{s}</span>
            ))}
            {user.skills_count > 5 && (
              <span className="badge" style={{ fontSize: 11 }}>+{user.skills_count - 5}</span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="admin-user-actions">
        {user.has_profile && (
          <button className="apply-btn outline" style={{ fontSize: 13 }}
            onClick={() => onPasswordReset(user.email)}>
            View Resume
          </button>
        )}

        {/* Reset password toggle */}
        <button
          className="apply-btn outline"
          style={{ fontSize: 13 }}
          onClick={() => { setShowPass(p => !p); setPassMsg(""); }}
        >
          Reset Password
        </button>

        <button
          className="apply-btn"
          style={{ fontSize: 13, background: "rgba(255,95,95,.15)", color: "var(--danger)",
                   border: "1px solid rgba(255,95,95,.3)" }}
          onClick={confirmDelete} disabled={deleting}
        >
          {deleting ? "Deleting…" : "Delete"}
        </button>
      </div>

      {/* Inline password reset */}
      {showPass && (
        <div className="admin-reset-row">
          <input
            className="form-input"
            type="password"
            placeholder="New password (min 6 chars)"
            value={newPass}
            onChange={e => setNewPass(e.target.value)}
            style={{ flex: 1, minWidth: 200 }}
          />
          <button className="apply-btn" onClick={resetPassword} disabled={resetting}>
            {resetting ? "Saving…" : "Set Password"}
          </button>
          {passMsg && (
            <span style={{
              fontSize: 13,
              color: passMsg === "Password reset!" ? "var(--accent2)" : "var(--danger)"
            }}>
              {passMsg}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminUsers() {
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [viewEmail, setViewEmail] = useState(null);
  const [error, setError]         = useState("");

  useEffect(() => {
    api.get("/admin/users")
      .then(r => setUsers(r.data.users || []))
      .catch(() => setError("Failed to load users"))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = email => setUsers(u => u.filter(x => x.email !== email));

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <h1>User Management</h1>
        <p>{users.length} registered user{users.length !== 1 ? "s" : ""}</p>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <input
          className="form-input"
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 400 }}
        />
      </div>

      {loading ? (
        <div className="spinner" />
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <h3>{search ? "No users match your search" : "No users yet"}</h3>
          <p>{search ? "Try a different search term" : "Users will appear here after they sign up"}</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {filtered.map(u => (
            <UserRow
              key={u.email}
              user={u}
              onDelete={handleDelete}
              onPasswordReset={email => setViewEmail(email)}
            />
          ))}
        </div>
      )}

      {viewEmail && (
        <ProfileModal email={viewEmail} onClose={() => setViewEmail(null)} />
      )}
    </div>
  );
}
