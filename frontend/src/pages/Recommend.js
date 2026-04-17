import React, { useState, useEffect } from "react";
import api from "../utils/api";
import JobCard from "../components/JobCard";
import { Link, useNavigate } from "react-router-dom";

export default function Recommend() {
  const [recs, setRecs]         = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [meta, setMeta]         = useState(null);
  const [hasProfile, setHasProfile] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check profile exists
    api.get("/my-profile").catch(() => setHasProfile(false));
  }, []);

  const fetchRecs = async () => {
    setLoading(true);
    setError("");
    setRecs([]);
    setMeta(null);
    try {
      const res = await api.get("/recommend?limit=8");
      setRecs(res.data.recommendations || []);
      setMeta(res.data);
    } catch (err) {
      const detail = err.response?.data?.detail || "";
      if (detail.includes("Upload your resume")) {
        setHasProfile(false);
      } else if (detail.includes("No jobs in database")) {
        setError("No jobs in the database yet. Go to Browse Jobs first to populate the cache.");
      } else {
        setError(detail || "Failed to fetch recommendations.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSkillGap = (job) => {
    navigate("/skill-gap", {
      state: {
        job_id: job.job_id,
        target_job_title: job.title,
        required_skills: job.missing_skills || [],
      },
    });
  };

  if (!hasProfile) {
    return (
      <div>
        <div className="page-header">
          <h1>Recommendations</h1>
        </div>
        <div className="card" style={{ textAlign: "center", padding: "48px 32px" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
          <h3>Upload your resume first</h3>
          <p className="text-muted" style={{ marginTop: 8, marginBottom: 24 }}>
            We need your skills and experience to generate personalised recommendations.
          </p>
          <Link to="/profile" className="apply-btn" style={{ display: "inline-flex" }}>
            Upload Resume
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>AI Recommendations</h1>
        <p>
          Jobs matched to your skills using AI — served from MongoDB cache,{" "}
          <strong style={{ color: "var(--accent)" }}>zero JSearch API calls</strong>.
        </p>
      </div>

      {/* Trigger card */}
      {recs.length === 0 && !loading && (
        <div className="card" style={{ marginBottom: 24, textAlign: "center", padding: "40px 32px" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✨</div>
          <h3>Ready to find your perfect match?</h3>
          <p className="text-muted" style={{ marginTop: 8, marginBottom: 24 }}>
            Our AI will compare your profile against all cached jobs and rank them for you.
          </p>
          <button className="apply-btn" style={{ display: "inline-flex" }} onClick={fetchRecs}>
            Generate Recommendations
          </button>
          {error && (
            <div className="alert alert-error" style={{ marginTop: 16, textAlign: "left" }}>
              {error}{" "}
              {error.includes("Browse Jobs") && (
                <Link to="/jobs" style={{ color: "var(--accent)" }}>Go there →</Link>
              )}
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="loading-center">
          <div className="spinner" />
          <p style={{ marginTop: 16 }}>AI is analysing your profile against {meta?.total_jobs_analyzed || "all"} cached jobs…</p>
        </div>
      )}

      {recs.length > 0 && (
        <>
          <div className="flex justify-between items-center" style={{ marginBottom: 20 }}>
            <div>
              <h2>Your top matches</h2>
              <p className="text-muted text-sm" style={{ marginTop: 4 }}>
                Analysed {meta?.total_jobs_analyzed} jobs · Showing top {recs.length}
              </p>
            </div>
            <button className="nav-btn ghost" onClick={fetchRecs} style={{ fontSize: 13 }}>
              Refresh
            </button>
          </div>

          {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

          <div className="jobs-grid">
            {recs.map((job, i) => (
              <JobCard
                key={job.job_id || i}
                job={job}
                showScore
                onSkillGap={handleSkillGap}
              />
            ))}
          </div>

          <div style={{ marginTop: 24, textAlign: "center" }}>
            <button className="nav-btn ghost" onClick={fetchRecs}>Re-run recommendations</button>
          </div>
        </>
      )}
    </div>
  );
}
