import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="card" style={{ flex: 1, minWidth: 160 }}>
      <div style={{ fontSize: 28, fontFamily: "var(--font-head)", fontWeight: 800,
                    color: accent ? "var(--accent)" : "var(--text)" }}>
        {value ?? "—"}
      </div>
      <div style={{ fontWeight: 600, marginTop: 4 }}>{label}</div>
      {sub && <div className="text-muted text-sm" style={{ marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/my-profile").catch(() => null),
      api.get("/cache-stats").catch(() => null),
    ]).then(([p, s]) => {
      if (p) setProfile(p.data.profiles);
      if (s) setStats(s.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back{profile?.name ? `, ${profile.name}` : ""}. Here's your career overview.</p>
      </div>

      {/* Stats row */}
      <div className="flex wrap" style={{ gap: 16, marginBottom: 28 }}>
        <StatCard label="Skills detected"  value={profile?.skills?.length}    accent />
        <StatCard label="Experience roles" value={profile?.experience?.length} />
        <StatCard label="Jobs in database" value={stats?.mongo_total_jobs}     />
        <StatCard label="Redis keys"       value={stats?.redis_total_keys}     sub={stats?.redis_available ? "Cache active" : "Cache offline"} />
      </div>

      {/* Quick actions */}
      <h2 style={{ marginBottom: 16 }}>Quick actions</h2>
      <div className="flex wrap" style={{ gap: 12, marginBottom: 32 }}>
        {[
          { to: "/profile",   label: "Upload Resume",       icon: "📄", desc: "Parse & store your resume" },
          { to: "/jobs",      label: "Browse Jobs",         icon: "🔍", desc: "Search the job database" },
          { to: "/recommend", label: "Get Recommendations", icon: "✨", desc: "AI-matched jobs for you" },
          { to: "/skill-gap", label: "Skill Gap Analysis",  icon: "📊", desc: "See what skills to learn" },
        ].map(a => (
          <Link key={a.to} to={a.to} style={{ textDecoration: "none", flex: "1 1 200px" }}>
            <div className="card" style={{ cursor: "pointer", transition: "border-color .2s" }}
                 onMouseEnter={e => e.currentTarget.style.borderColor = "var(--border2)"}
                 onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{a.icon}</div>
              <div style={{ fontFamily: "var(--font-head)", fontWeight: 700 }}>{a.label}</div>
              <div className="text-muted text-sm" style={{ marginTop: 4 }}>{a.desc}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Profile snapshot */}
      {profile ? (
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Your profile</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 16 }}>
            <div>
              <div className="text-muted text-sm">Name</div>
              <div style={{ fontWeight: 500, marginTop: 2 }}>{profile.name || "—"}</div>
            </div>
            <div>
              <div className="text-muted text-sm">Email</div>
              <div style={{ fontWeight: 500, marginTop: 2 }}>{profile.email || user}</div>
            </div>
            <div>
              <div className="text-muted text-sm">Phone</div>
              <div style={{ fontWeight: 500, marginTop: 2 }}>{profile.phone || "—"}</div>
            </div>
          </div>
          {profile.skills?.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div className="text-muted text-sm" style={{ marginBottom: 8 }}>Skills</div>
              <div className="skills-list">
                {profile.skills.map(s => <span key={s} className="badge accent">{s}</span>)}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="alert alert-info">
          No resume uploaded yet.{" "}
          <Link to="/profile" style={{ color: "var(--accent)", fontWeight: 600 }}>
            Upload your resume
          </Link>{" "}
          to get personalised recommendations.
        </div>
      )}
    </div>
  );
}
