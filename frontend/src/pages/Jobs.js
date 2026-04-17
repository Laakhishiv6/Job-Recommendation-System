import React, { useState, useEffect } from "react";
import api from "../utils/api";
import JobCard from "../components/JobCard";
import { useNavigate } from "react-router-dom";

// How it works explanation panel
function HowItWorks() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: 20 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ background: "none", border: "none", cursor: "pointer",
          color: "var(--accent)", fontSize: 13, fontWeight: 600, padding: 0 }}
      >
        {/* {open ? "▾" : "▸"} How does caching work? */}
      </button>
      {open && (
        <div style={{ marginTop: 10, padding: "14px 18px", borderRadius: "var(--radius-sm)",
          background: "var(--bg)", border: "1px solid var(--border2)", fontSize: 13,
          color: "var(--muted)", lineHeight: 1.8 }}>
          <div style={{ display: "grid", gap: 8 }}>
            {[
              { icon: "🔵", label: "local search",  desc: 'Click "local search" — queries MongoDB only. Zero JSearch API calls. Instant.' },
              { icon: "🟡", label: "Fetch from JSearch", desc: 'Click "Fetch from JSearch" — calls the live JSearch API, stores ALL results in MongoDB, then shows them. Use this to populate or refresh data.' },
              { icon: "♻️", label: "Auto cache",    desc: "Every JSearch result is automatically stored in MongoDB forever. Future cache searches find them instantly." },
            ].map(r => (
              <div key={r.label} className="flex" style={{ gap: 10, alignItems: "flex-start" }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{r.icon}</span>
                <div><strong style={{ color: "var(--text)" }}>{r.label}:</strong> {r.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Jobs() {
  const [query, setQuery]       = useState("software developer");
  const [location, setLocation] = useState("remote");
  const [jobs, setJobs]         = useState([]);
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(false);  // cache search
  const [liveLoading, setLiveLoading] = useState(false); // jsearch live
  const [error, setError]       = useState("");
  const [msg, setMsg]           = useState("");
  const [msgType, setMsgType]   = useState("info"); // info | success | warn
  const [totalInDb, setTotalInDb] = useState(null);
  const [lastSource, setLastSource] = useState(null); // "cache" | "jsearch"
  const navigate = useNavigate();

  useEffect(() => { loadCachedJobs(); }, []);

  const loadCachedJobs = async () => {
    setLoading(true); setError("");
    try {
      const res = await api.get("/fetched-jobs/all?limit=200");
      setJobs(res.data.jobs || []);
      setTotalInDb(res.data.total);
    } catch { setError("Failed to load jobs from database."); }
    finally { setLoading(false); }
  };

  // ── CACHE SEARCH: MongoDB only, no API call ───────────────────────────────
  const searchCache = async () => {
    setFetching(true); setError(""); setMsg(""); setJobs([]);
    try {
      const res = await api.get("/fetched-jobs/all?limit=200");
      const all = res.data.jobs || [];
      // client-side filter by query
      const q = query.toLowerCase();
      const filtered = all.filter(j =>
        j.title?.toLowerCase().includes(q) ||
        j.company?.toLowerCase().includes(q) ||
        j.required_skills?.some(s => s.toLowerCase().includes(q))
      );
      setJobs(filtered);
      setTotalInDb(res.data.total);
      setLastSource("cache");
      setMsg(`Found ${filtered.length} cached jobs matching "${query}" (from ${res.data.total} total in DB — no API call made).`);
      setMsgType("info");
    } catch (err) { setError("Cache search failed."); }
    finally { setFetching(false); }
  };

  // ── LIVE FETCH: calls JSearch, caches, then shows results ─────────────────
  const fetchFromJSearch = async () => {
    setLiveLoading(true); setError(""); setMsg(""); setJobs([]);
    try {
      // force_refresh=true so it always calls JSearch regardless of cache
      const res = await api.get("/fetched-jobs", {
        params: { query, location, num_pages: 2, fetch_details: false, force_refresh: true },
      });
      const newJobs  = res.data.storage?.mongo_new_upserted || 0;
      const total    = res.data.total_stored || 0;
      // Now load from MongoDB to show all results
      const all = await api.get("/fetched-jobs/all?limit=200");
      setJobs(all.data.jobs || []);
      setTotalInDb(all.data.total);
      setLastSource("jsearch");
      setMsg(`✅ JSearch returned ${total} jobs · ${newJobs} new jobs added to cache · Now showing all ${all.data.total} cached jobs.`);
      setMsgType("success");
    } catch (err) {
      setError(err.response?.data?.detail || "JSearch fetch failed. Check your RAPIDAPI_KEY in backend .env");
    } finally { setLiveLoading(false); }
  };

  const handleSkillGap = (job) => {
    navigate("/skill-gap", {
      state: { job_id: job.source_id, target_job_title: job.title, required_skills: job.required_skills || [] },
    });
  };

  const anyLoading = loading || fetching || liveLoading;

  return (
    <div>
      <div className="page-header">
        <h1>Browse Jobs</h1>
        <p>
          {totalInDb !== null
            ? <><span className="text-accent">{totalInDb}</span> jobs in MongoDB cache</>
            : "local searchd jobs or fetch fresh data from JSearch."}
        </p>
      </div>

      <HowItWorks />

      {/* Search panel */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="flex wrap" style={{ gap: 12, marginBottom: 14 }}>
          <input className="form-input" style={{ flex: 2, minWidth: 200 }}
            placeholder="Job title, skill, or keyword…"
            value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && searchCache()} />
          <input className="form-input" style={{ flex: 1, minWidth: 140 }}
            placeholder="Location or 'remote'"
            value={location} onChange={e => setLocation(e.target.value)}
            onKeyDown={e => e.key === "Enter" && searchCache()} />
        </div>

        {/* Two distinct buttons */}
        <div className="flex wrap" style={{ gap: 10 }}>
          {/* Cache search — primary */}
          <button className="apply-btn" style={{ padding: "10px 22px", fontSize: 14 }}
            onClick={searchCache} disabled={anyLoading}>
            {fetching ? "Searching cache…" : "🔵 local search"}
          </button>

          {/* JSearch live — outlined / secondary */}
          <button className="apply-btn outline" style={{ padding: "10px 22px", fontSize: 14 }}
            onClick={fetchFromJSearch} disabled={anyLoading}>
            {liveLoading
              ? <span>⏳ Fetching from JSearch…</span>
              : <span>🟡 Fetch from JSearch</span>}
          </button>

          {/* Reload all */}
          <button className="nav-btn ghost" style={{ fontSize: 13 }}
            onClick={loadCachedJobs} disabled={anyLoading}>
            Show all cached
          </button>
        </div>

        <div className="flex wrap" style={{ gap: 16, marginTop: 10 }}>
          <p className="text-muted text-sm">🔵 <strong>Cache</strong> = instant, no API call</p>
          <p className="text-muted text-sm">🟡 <strong>JSearch</strong> = live data, uses API quota, auto-caches results</p>
        </div>
      </div>

      {/* Status messages */}
      {msg && (
        <div className={`alert alert-${msgType === "success" ? "success" : "info"}`}
          style={{ marginBottom: 16 }}>
          {msg}
          {lastSource === "jsearch" && (
            <span style={{ marginLeft: 8, fontSize: 12, opacity: 0.8 }}>
              (results stored in MongoDB for future cache searches)
            </span>
          )}
        </div>
      )}
      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Results */}
      {anyLoading && !liveLoading ? (
        <div className="spinner" />
      ) : liveLoading ? (
        <div className="loading-center">
          <div className="spinner" />
          <p style={{ marginTop: 16, color: "var(--muted)" }}>
            Calling JSearch API… fetching up to 2 pages of results and caching them in MongoDB…
          </p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="empty-state">
          <h3>No jobs found</h3>
          <p>Try "Fetch from JSearch" to pull live data and populate the cache.</p>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
            <h2>
              {jobs.length} job{jobs.length !== 1 ? "s" : ""}
              {lastSource === "cache"   && <span className="badge" style={{ marginLeft: 10, fontSize: 11 }}>from cache</span>}
              {lastSource === "jsearch" && <span className="badge green" style={{ marginLeft: 10, fontSize: 11 }}>live + cached</span>}
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
