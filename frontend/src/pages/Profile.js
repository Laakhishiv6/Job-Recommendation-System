import React, { useState, useEffect, useRef } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user }                = useAuth();
  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");
  const [drag, setDrag]         = useState(false);
  const fileRef                 = useRef();

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get("/my-profile");
      setProfile(res.data.profiles);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are supported."); return;
    }
    setUploading(true);
    setError(""); setSuccess("");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await api.post("/upload-resume", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess("Resume parsed and stored successfully!");
      await loadProfile();
    } catch (err) {
      setError(err.response?.data?.detail || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const onFileChange  = e => uploadFile(e.target.files[0]);
  const onDrop        = e => { e.preventDefault(); setDrag(false); uploadFile(e.dataTransfer.files[0]); };
  const onDragOver    = e => { e.preventDefault(); setDrag(true); };
  const onDragLeave   = () => setDrag(false);

  return (
    <div>
      <div className="page-header">
        <h1>My Profile</h1>
        <p>Upload your resume to power personalised recommendations and skill gap analysis.</p>
      </div>

      {/* Upload zone */}
      <div
        className={`upload-zone ${drag ? "drag" : ""}`}
        style={{ marginBottom: 24 }}
        onClick={() => fileRef.current.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <input ref={fileRef} type="file" accept=".pdf" onChange={onFileChange} />
        <div className="upload-icon">{uploading ? "⏳" : "📄"}</div>
        <h3>{uploading ? "Parsing resume…" : "Drop your PDF resume here"}</h3>
        <p>{uploading ? "This may take a few seconds" : "or click to browse · PDF only"}</p>
      </div>

      {error   && <div className="alert alert-error"   style={{ marginBottom: 16 }}>{error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>{success}</div>}

      {loading ? (
        <div className="spinner" />
      ) : profile ? (
        <div style={{ display: "grid", gap: 16 }}>

          {/* Basic info */}
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Basic information</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 20 }}>
              {[
                { label: "Name",  value: profile.name },
                { label: "Email", value: profile.email || user },
                { label: "Phone", value: profile.phone },
              ].map(f => (
                <div key={f.label}>
                  <div className="text-muted text-sm">{f.label}</div>
                  <div style={{ fontWeight: 500, marginTop: 4 }}>{f.value || "—"}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div className="card">
            <div className="flex justify-between items-center" style={{ marginBottom: 14 }}>
              <h3>Skills</h3>
              <span className="badge accent">{profile.skills?.length || 0} detected</span>
            </div>
            {profile.skills?.length > 0 ? (
              <div className="skills-list">
                {profile.skills.map(s => <span key={s} className="badge accent">{s}</span>)}
              </div>
            ) : (
              <p className="text-muted text-sm">No skills detected — try re-uploading your resume.</p>
            )}
          </div>

          {/* Experience */}
          {profile.experience?.length > 0 && (
            <div className="card">
              <h3 style={{ marginBottom: 16 }}>Experience</h3>
              <div style={{ display: "grid", gap: 14 }}>
                {profile.experience.map((exp, i) => (
                  <div key={i} style={{
                    padding: "14px 18px", borderRadius: "var(--radius-sm)",
                    background: "var(--bg)", border: "1px solid var(--border2)"
                  }}>
                    <div style={{ fontFamily: "var(--font-head)", fontWeight: 700 }}>{exp.title || "Role"}</div>
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
              <h3 style={{ marginBottom: 16 }}>Education</h3>
              <div style={{ display: "grid", gap: 12 }}>
                {profile.education.map((edu, i) => (
                  <div key={i} style={{
                    padding: "14px 18px", borderRadius: "var(--radius-sm)",
                    background: "var(--bg)", border: "1px solid var(--border2)"
                  }}>
                    <div style={{ fontFamily: "var(--font-head)", fontWeight: 700 }}>{edu.degree || "Degree"}</div>
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
        <div className="empty-state">
          <h3>No profile yet</h3>
          <p>Upload your PDF resume above to get started.</p>
        </div>
      )}
    </div>
  );
}
