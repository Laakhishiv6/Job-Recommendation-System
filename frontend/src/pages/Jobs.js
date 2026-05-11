import React, { useState, useEffect } from "react";
import api from "../utils/api";
import JobCard from "../components/JobCard";
import { useNavigate } from "react-router-dom";

export default function Jobs() {
  const [query,    setQuery]    = useState("");
  const [location, setLocation] = useState("");
  const [allJobs,  setAllJobs]  = useState([]);
  const [jobs,     setJobs]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const navigate = useNavigate();

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true); setError("");
    try {
      const res = await api.get("/fetched-jobs/all?limit=200");
      const fetched = res.data.jobs || [];
      setAllJobs(fetched);
      setJobs(fetched);
    } catch {
      setError("Failed to load jobs. Please try again.");
    } finally { setLoading(false); }
  };

  const search = () => {
    const q = query.trim().toLowerCase();
    const l = location.trim().toLowerCase();
    if (!q && !l) { setJobs(allJobs); return; }
    const filtered = allJobs.filter(j => {
      const matchQ = !q || (
        j.title?.toLowerCase().includes(q) ||
        j.company?.toLowerCase().includes(q) ||
        j.required_skills?.some(s => s.toLowerCase().includes(q))
      );
      const matchL = !l || j.location?.toLowerCase().includes(l);
      return matchQ && matchL;
    });
    setJobs(filtered);
  };

  const handleSkillGap = job => {
    navigate("/skill-gap", {
      state: { job_id: job.source_id, target_job_title: job.title, required_skills: job.required_skills || [] },
    });
  };

  const isFiltered = (query.trim() || location.trim()) !== "";

  return (
    <div>
      <div className="page-header">
        <h1>Browse Jobs</h1>
        <p>
          {allJobs.length > 0
            ? <><span className="text-accent">{allJobs.length}</span> jobs available</>
            : "Search and discover job opportunities."}
        </p>
      </div>

      {/* Search bar */}
      <div className="card jobs-search-panel">
        <div className="jobs-search-inputs">
          <input
            className="form-input"
            placeholder="Job title, skill, or keyword…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && search()}
          />
          <input
            className="form-input"
            placeholder="Location (e.g. Remote, New York…)"
            value={location}
            onChange={e => setLocation(e.target.value)}
            onKeyDown={e => e.key === "Enter" && search()}
          />
        </div>
        <div className="jobs-search-btns">
          <button className="apply-btn" onClick={search} disabled={loading}>
            Search
          </button>
          {isFiltered && (
            <button
              className="apply-btn outline"
              onClick={() => { setQuery(""); setLocation(""); setJobs(allJobs); }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <div className="spinner" />
      ) : jobs.length === 0 ? (
        <div className="empty-state">
          <h3>{isFiltered ? "No jobs match your search" : "No jobs yet"}</h3>
          <p>
            {isFiltered
              ? "Try different keywords or clear filters."
              : "The admin will populate jobs soon."}
          </p>
          {isFiltered && (
            <button
              className="apply-btn outline"
              style={{ marginTop: 16, display: "inline-flex" }}
              onClick={() => { setQuery(""); setLocation(""); setJobs(allJobs); }}
            >
              Show all jobs
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center" style={{ marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <h2 style={{ margin: 0 }}>
              {isFiltered
                ? <>{jobs.length} result{jobs.length !== 1 ? "s" : ""} for "{query || location}"</>
                : <>{jobs.length} job{jobs.length !== 1 ? "s" : ""}</>}
            </h2>
          </div>
          <div className="jobs-grid">
            {jobs.map((job, i) => (
              <JobCard key={job.source_id || i} job={job} onSkillGap={handleSkillGap} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
