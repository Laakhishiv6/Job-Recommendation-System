import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../utils/api";

function StatCard({ icon, label, value, color }) {
  return (
    <div className="card admin-stat-card">
      <div className="admin-stat-icon" style={{ color: color || "var(--accent)" }}>{icon}</div>
      <div className="admin-stat-value" style={{ color: color || "var(--text)" }}>{value ?? "—"}</div>
      <div className="admin-stat-label">{label}</div>
    </div>
  );
}

function UserRow({ user }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
                  overflow: "hidden" }}>
      {/* Summary row */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: "100%", background: "none", border: "none", cursor: "pointer",
                 padding: "12px 16px", display: "flex", alignItems: "center",
                 justifyContent: "space-between", gap: 12, textAlign: "left" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", flex: 1 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--border2)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 14,
                        color: "var(--accent)", flexShrink: 0 }}>
            {(user.name || user.email)[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{user.name || "—"}</div>
            <div className="text-muted text-sm">{user.email}</div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {user.has_profile
              ? <span className="badge green">Resume uploaded</span>
              : <span className="badge">No resume</span>}
            {user.skills_count > 0 &&
              <span className="badge accent">{user.skills_count} skills</span>}
          </div>
        </div>
        <span style={{ color: "var(--accent)", fontSize: 16 }}>{open ? "▾" : "▸"}</span>
      </button>

      {/* Expanded detail */}
      {open && (
        <div style={{ padding: "0 16px 16px", background: "var(--bg)",
                      borderTop: "1px solid var(--border)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))",
                        gap: 14, marginTop: 14, marginBottom: 14 }}>
            {[
              { label: "Email", value: user.email },
              { label: "Phone", value: user.phone || "—" },
            ].map(f => (
              <div key={f.label}>
                <div className="text-muted text-sm">{f.label}</div>
                <div style={{ fontWeight: 500, marginTop: 2, fontSize: 13, wordBreak: "break-all" }}>
                  {f.value}
                </div>
              </div>
            ))}
          </div>

          {user.skills?.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div className="text-muted text-sm" style={{ marginBottom: 6 }}>
                Skills ({user.skills.length})
              </div>
              <div className="skills-list">
                {user.skills.map(s => <span key={s} className="badge accent">{s}</span>)}
              </div>
            </div>
          )}

          {user.experience?.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div className="text-muted text-sm" style={{ marginBottom: 6 }}>Experience</div>
              <div style={{ display: "grid", gap: 8 }}>
                {user.experience.map((e, i) => (
                  <div key={i} className="profile-entry">
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{e.title}</div>
                    <div className="text-muted text-sm">
                      {e.company}{e.duration ? ` · ${e.duration}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {user.education?.length > 0 && (
            <div>
              <div className="text-muted text-sm" style={{ marginBottom: 6 }}>Education</div>
              <div style={{ display: "grid", gap: 8 }}>
                {user.education.map((e, i) => (
                  <div key={i} className="profile-entry">
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{e.degree}</div>
                    <div className="text-muted text-sm">
                      {e.institution}{e.year ? ` · ${e.year}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function JobRow({ job }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12,
                  padding: "12px 16px", borderBottom: "1px solid var(--border)",
                  flexWrap: "wrap" }}>
      {job.company_logo && (
        <img src={job.company_logo} alt="" style={{ width: 28, height: 28, borderRadius: 4,
          objectFit: "contain", background: "#1e2024", padding: 2, flexShrink: 0 }}
          onError={e => { e.target.style.display = "none"; }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{job.title}</div>
        <div className="text-muted text-sm">{job.company}</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
          {job.location && <span className="badge" style={{ fontSize: 11 }}>📍 {job.location}</span>}
          {job.job_type  && <span className="badge accent" style={{ fontSize: 11 }}>{job.job_type}</span>}
          {job.salary    && <span className="badge green" style={{ fontSize: 11 }}>💰 {job.salary}</span>}
          {job.required_skills?.slice(0, 4).map(s =>
            <span key={s} className="badge" style={{ fontSize: 11 }}>{s}</span>)}
        </div>
      </div>
      <div className="text-muted text-sm" style={{ whiteSpace: "nowrap", flexShrink: 0 }}>
        {job.posted_date || "—"}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [jobSearch,  setJobSearch]  = useState("");
  const [userSearch, setUserSearch] = useState("");

  useEffect(() => {
    api.get("/admin/overview")
      .then(r => setData(r.data))
      .catch(() => setError("Failed to load overview data."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" />;
  if (error)   return <div className="alert alert-error">{error}</div>;

  const { stats, users, recent_jobs } = data;

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.name || "").toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredJobs = recent_jobs.filter(j =>
    j.title?.toLowerCase().includes(jobSearch.toLowerCase()) ||
    j.company?.toLowerCase().includes(jobSearch.toLowerCase()) ||
    j.required_skills?.some(s => s.toLowerCase().includes(jobSearch.toLowerCase()))
  );

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center" style={{ gap: 12, flexWrap: "wrap" }}>
          <h1>Admin Dashboard</h1>
          <span className="badge" style={{ fontSize: 11, padding: "4px 12px" }}>Administrator</span>
        </div>
        <p>Full database overview — users, resumes, and job listings.</p>
      </div>

      {/* ── Stats ── */}
      <div className="admin-stats-grid">
        <StatCard icon="👥" label="Total Users"       value={stats.total_users}       color="var(--accent)" />
        <StatCard icon="📄" label="Resumes Uploaded"  value={stats.users_with_resume} color="var(--accent2)" />
        <StatCard icon="❌" label="No Resume Yet"     value={stats.users_no_resume}   color="var(--warn)" />
        <StatCard icon="💼" label="Jobs in Database"  value={stats.total_jobs}        color="var(--text)" />
      </div>

      {/* ── Quick links ── */}
      <div className="flex wrap" style={{ gap: 10, marginBottom: 32 }}>
        {[
          { to: "/admin/users", label: "Manage Users",   icon: "👥" },
          { to: "/admin/jobs",  label: "Fetch New Jobs", icon: "🔄" },
          { to: "/jobs",        label: "Browse Jobs",    icon: "💼" },
        ].map(a => (
          <Link key={a.to} to={a.to} className="apply-btn outline" style={{ fontSize: 13 }}>
            {a.icon} {a.label}
          </Link>
        ))}
      </div>

      {/* ── Users section ── */}
      <div style={{ marginBottom: 32 }}>
        <div className="flex justify-between items-center"
             style={{ marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <h2 style={{ margin: 0 }}>
            Users
            <span className="badge" style={{ marginLeft: 10, fontSize: 11 }}>{users.length}</span>
          </h2>
          <input
            className="form-input"
            placeholder="Search users…"
            value={userSearch}
            onChange={e => setUserSearch(e.target.value)}
            style={{ maxWidth: 240 }}
          />
        </div>

        {filteredUsers.length === 0 ? (
          <div className="empty-state" style={{ padding: "32px 0" }}>
            <h3>{userSearch ? "No users match your search" : "No users yet"}</h3>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {filteredUsers.map(u => <UserRow key={u.email} user={u} />)}
          </div>
        )}
      </div>

      {/* ── Jobs section ── */}
      <div>
        <div className="flex justify-between items-center"
             style={{ marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <h2 style={{ margin: 0 }}>
            Job Listings
            <span className="badge" style={{ marginLeft: 10, fontSize: 11 }}>
              {stats.total_jobs} total · showing latest {recent_jobs.length}
            </span>
          </h2>
          <input
            className="form-input"
            placeholder="Search jobs…"
            value={jobSearch}
            onChange={e => setJobSearch(e.target.value)}
            style={{ maxWidth: 240 }}
          />
        </div>

        {filteredJobs.length === 0 ? (
          <div className="empty-state" style={{ padding: "32px 0" }}>
            <h3>{jobSearch ? "No jobs match your search" : "No jobs yet"}</h3>
            <p>Use <Link to="/admin/jobs" style={{ color: "var(--accent)" }}>Job Fetcher</Link> to populate the database.</p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {filteredJobs.map((job, i) => <JobRow key={job.source_id || i} job={job} />)}
          </div>
        )}
      </div>
    </div>
  );
}
