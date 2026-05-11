import React, { useEffect, useState, useRef } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";


export default function Dashboard() {
  const { user } = useAuth();
  const [profile,   setProfile]   = useState(null);
  const [stats,     setStats]     = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState({ text: "", type: "" });
  const [drag,      setDrag]      = useState(false);
  const fileRef = useRef();

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

  const uploadResume = async (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setUploadMsg({ text: "Only PDF files are supported.", type: "error" });
      return;
    }
    setUploading(true);
    setUploadMsg({ text: "", type: "" });
    const fd = new FormData();
    fd.append("file", file);
    try {
      await api.post("/upload-resume", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const p = await api.get("/my-profile");
      setProfile(p.data.profiles);
      setUploadMsg({ text: "Resume updated successfully!", type: "success" });
      setTimeout(() => setUploadMsg({ text: "", type: "" }), 4000);
    } catch (err) {
      setUploadMsg({ text: err.response?.data?.detail || "Upload failed.", type: "error" });
    } finally { setUploading(false); }
  };

  const onFileChange = e => uploadResume(e.target.files[0]);
  const onDrop       = e => { e.preventDefault(); setDrag(false); uploadResume(e.dataTransfer.files[0]); };
  const onDragOver   = e => { e.preventDefault(); setDrag(true); };
  const onDragLeave  = () => setDrag(false);

  if (loading) return <div className="spinner" />;

  const firstName = profile?.name?.split(" ")[0];

  return (
    <div>

      {/* ── Hero Banner ──────────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(140deg, #0e1410 0%, #111417 55%, #13171b 100%)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "32px 36px",
        marginBottom: 28,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 24,
        overflow: "hidden",
        position: "relative",
      }}>
        {/* background glow */}
        <div style={{
          position: "absolute", top: "-60%", left: "-8%",
          width: "45%", height: "220%",
          background: "radial-gradient(circle, rgba(200,241,53,0.07) 0%, transparent 65%)",
          pointerEvents: "none",
        }}/>

        {/* left: text + stats */}
        <div style={{ position: "relative", zIndex: 1, flex: 1 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(200,241,53,0.08)", border: "1px solid rgba(200,241,53,0.18)",
            borderRadius: 20, padding: "4px 12px",
            fontSize: 12, fontWeight: 600, color: "var(--accent)",
            marginBottom: 14, letterSpacing: 0.3,
          }}>
            ✦ AI-powered career dashboard
          </div>

          <h1 style={{ marginBottom: 8, fontSize: "clamp(22px, 3vw, 30px)", lineHeight: 1.15 }}>
            {firstName ? `Welcome back, ${firstName}` : "Welcome back"}
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 28, maxWidth: 340, lineHeight: 1.65 }}>
            Track your skills, explore AI-matched jobs, and close your skill gaps — all in one place.
          </p>

          {/* Stat row */}
          <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
            {[
              { label: "Skills detected",  value: profile?.skills?.length    ?? "—", color: "var(--accent)" },
              { label: "Experience roles", value: profile?.experience?.length ?? "—", color: "var(--text)"   },
              { label: "Jobs in database", value: stats?.mongo_total_jobs     ?? "—", color: "var(--accent2)" },
            ].map(s => (
              <div key={s.label}>
                <div style={{
                  fontFamily: "var(--font-head)", fontWeight: 800,
                  fontSize: "clamp(22px, 3vw, 28px)", color: s.color, lineHeight: 1,
                }}>{s.value}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 5 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Profile Snapshot ─────────────────────────────────────────── */}
      {profile ? (
        <div style={{ display: "grid", gap: 16 }}>

          {/* Basic Info */}
          <div className="card">
            <div className="flex justify-between items-center"
                 style={{ marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
              <h3 style={{ margin: 0 }}>Your profile</h3>
              <button
                className="apply-btn outline"
                style={{ fontSize: 13 }}
                onClick={() => fileRef.current.click()}
                disabled={uploading}
              >
                {uploading ? "⏳ Uploading…" : "📄 Update Resume"}
              </button>
            </div>

            <input ref={fileRef} type="file" accept=".pdf"
                   style={{ display: "none" }} onChange={onFileChange} />

            <div className={`dash-drop-zone${drag ? " drag" : ""}`}
                 onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}>
              <span style={{ fontSize: 18, marginRight: 8 }}>📄</span>
              Drop your PDF here to update
            </div>

            {uploadMsg.text && (
              <div className={`alert alert-${uploadMsg.type === "success" ? "success" : "error"}`}
                   style={{ marginBottom: 16 }}>
                {uploadMsg.text}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 16 }}>
              {[
                { label: "Name",  value: profile.name },
                { label: "Email", value: profile.email || user },
                { label: "Phone", value: profile.phone },
              ].map(f => (
                <div key={f.label}>
                  <div className="text-muted text-sm">{f.label}</div>
                  <div style={{ fontWeight: 500, marginTop: 2 }}>{f.value || "—"}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Skills */}
          {profile.skills?.length > 0 && (
            <div className="card">
              <div className="flex justify-between items-center" style={{ marginBottom: 12 }}>
                <h3 style={{ margin: 0 }}>Skills</h3>
                <span className="badge accent">{profile.skills.length} detected</span>
              </div>
              <div className="skills-list">
                {profile.skills.map(s => <span key={s} className="badge accent">{s}</span>)}
              </div>
            </div>
          )}

          {/* Experience */}
          {profile.experience?.length > 0 && (
            <div className="card">
              <h3 style={{ marginBottom: 14 }}>Experience</h3>
              <div style={{ display: "grid", gap: 12 }}>
                {profile.experience.map((exp, i) => (
                  <div key={i} className="profile-entry">
                    <div style={{ fontFamily: "var(--font-head)", fontWeight: 700 }}>
                      {exp.title || "Role"}
                    </div>
                    <div className="text-muted text-sm" style={{ marginTop: 3 }}>
                      {exp.company}{exp.duration ? ` · ${exp.duration}` : ""}
                    </div>
                    {exp.summary && (
                      <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 8, lineHeight: 1.6 }}>
                        {exp.summary}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {profile.education?.length > 0 && (
            <div className="card">
              <h3 style={{ marginBottom: 14 }}>Education</h3>
              <div style={{ display: "grid", gap: 12 }}>
                {profile.education.map((edu, i) => (
                  <div key={i} className="profile-entry">
                    <div style={{ fontFamily: "var(--font-head)", fontWeight: 700 }}>
                      {edu.degree || "Degree"}
                    </div>
                    <div className="text-muted text-sm" style={{ marginTop: 3 }}>
                      {edu.institution}{edu.year ? ` · ${edu.year}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      ) : (
        /* No resume yet */
        <div className="card" style={{ textAlign: "center", padding: "48px 32px" }}>
          <div style={{ fontSize: 44, marginBottom: 16 }}>📄</div>
          <h3 style={{ marginBottom: 8 }}>No resume uploaded yet</h3>
          <p className="text-muted" style={{ marginBottom: 20, maxWidth: 360, margin: "0 auto 20px" }}>
            Upload your PDF resume to unlock personalised AI recommendations and skill gap analysis.
          </p>
          <div className={`upload-zone${drag ? " drag" : ""}`}
               style={{ marginBottom: 16 }}
               onClick={() => fileRef.current.click()}
               onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}>
            <input ref={fileRef} type="file" accept=".pdf" onChange={onFileChange} />
            <div className="upload-icon">{uploading ? "⏳" : "📄"}</div>
            <h3>{uploading ? "Parsing resume…" : "Drop your PDF here"}</h3>
            <p>{uploading ? "This may take a few seconds" : "or click to browse · PDF only"}</p>
          </div>
          {uploadMsg.text && (
            <div className={`alert alert-${uploadMsg.type === "success" ? "success" : "error"}`}>
              {uploadMsg.text}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
