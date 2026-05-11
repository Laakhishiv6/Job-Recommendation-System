import React, { useState, useEffect } from "react";
import api from "../../utils/api";

const SOURCES = [
  {
    id: "all_free",
    label: "All Free Sources",
    desc: "Remotive + Arbeitnow + The Muse — no API key required",
    tag: "Recommended",
    tagColor: "var(--accent2)",
    needsKey: false,
  },
  {
    id: "remotive",
    label: "Remotive",
    desc: "Remote-only tech jobs worldwide — free, no key",
    tag: "Free",
    tagColor: "var(--accent2)",
    needsKey: false,
  },
  {
    id: "arbeitnow",
    label: "Arbeitnow",
    desc: "EU & global remote jobs — free, no key",
    tag: "Free",
    tagColor: "var(--accent2)",
    needsKey: false,
  },
  {
    id: "themuse",
    label: "The Muse",
    desc: "Tech & creative company jobs — free, no key",
    tag: "Free",
    tagColor: "var(--accent2)",
    needsKey: false,
  },
  {
    id: "jsearch",
    label: "JSearch (RapidAPI)",
    desc: "Global job listings — requires RAPIDAPI_KEY in .env",
    tag: "Paid",
    tagColor: "var(--warn)",
    needsKey: true,
  },
];

export default function AdminJobs() {
  const [form, setForm] = useState({
    source:        "all_free",
    query:         "software developer",
    location:      "remote",
    num_pages:     2,
    force_refresh: true,
  });
  const [loading,   setLoading]   = useState(false);
  const [result,    setResult]    = useState(null);
  const [error,     setError]     = useState("");
  const [totalJobs, setTotalJobs] = useState(null);

  useEffect(() => {
    api.get("/admin/stats")
      .then(r => setTotalJobs(r.data.total_jobs))
      .catch(() => {});
  }, []);

  const fetchJobs = async () => {
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await api.post("/admin/fetch-jobs", form);
      setResult(res.data);
      api.get("/admin/stats").then(r => setTotalJobs(r.data.total_jobs)).catch(() => {});
    } catch (err) {
      setError(err.response?.data?.detail || "Fetch failed. Check server logs.");
    } finally { setLoading(false); }
  };

  const selectedSource = SOURCES.find(s => s.id === form.source);
  const newJobs        = result?.storage?.mongo_new_upserted ?? 0;
  const fetchedTotal   = result?.total_stored ?? result?.storage?.mongo_total_in_db ?? 0;

  return (
    <div>
      <div className="page-header">
        <h1>Job Fetcher</h1>
        <p>Pull fresh job listings from free or paid sources and cache them in MongoDB.</p>
      </div>

      {/* DB stat */}
      <div style={{ marginBottom: 28 }}>
        <div className="card" style={{ display: "inline-block", minWidth: 160 }}>
          <div style={{ fontSize: 26, fontFamily: "var(--font-head)", fontWeight: 800, color: "var(--accent)" }}>
            {totalJobs ?? "—"}
          </div>
          <div style={{ fontWeight: 600, marginTop: 4 }}>Jobs in Database</div>
          <div className="text-muted text-sm" style={{ marginTop: 2 }}>Stored in MongoDB</div>
        </div>
      </div>

      {/* Source picker */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 14 }}>Select Data Source</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
          {SOURCES.map(s => (
            <div
              key={s.id}
              onClick={() => setForm(f => ({ ...f, source: s.id }))}
              style={{
                padding: "14px 16px", borderRadius: "var(--radius-sm)", cursor: "pointer",
                border: `1.5px solid ${form.source === s.id ? "var(--accent)" : "var(--border2)"}`,
                background: form.source === s.id ? "rgba(200,241,53,.06)" : "var(--bg)",
                transition: "border-color .15s, background .15s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>{s.label}</span>
                <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 20,
                  background: `${s.tagColor}20`, color: s.tagColor, border: `1px solid ${s.tagColor}40`,
                  fontWeight: 600 }}>{s.tag}</span>
              </div>
              <div className="text-muted text-sm">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Fetch options */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 18 }}>Fetch Options</h3>

        <div className="flex wrap" style={{ gap: 14, marginBottom: 16 }}>
          <div className="form-group" style={{ flex: 2, minWidth: 180, marginBottom: 0 }}>
            <label>Search query</label>
            <input
              className="form-input"
              placeholder="e.g. software developer"
              value={form.query}
              onChange={e => setForm({ ...form, query: e.target.value })}
            />
          </div>

          {form.source === "jsearch" && (
            <div className="form-group" style={{ flex: 1, minWidth: 140, marginBottom: 0 }}>
              <label>Location</label>
              <input
                className="form-input"
                placeholder="e.g. remote"
                value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
              />
            </div>
          )}

          <div className="form-group" style={{ flex: "0 0 120px", minWidth: 100, marginBottom: 0 }}>
            <label>Pages (1–5)</label>
            <input
              className="form-input"
              type="number" min={1} max={5}
              value={form.num_pages}
              onChange={e => setForm({ ...form, num_pages: Math.min(5, Math.max(1, +e.target.value)) })}
            />
          </div>
        </div>

        {/* Force refresh toggle */}
        <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
          marginBottom: 20, userSelect: "none" }}>
          <div
            onClick={() => setForm(f => ({ ...f, force_refresh: !f.force_refresh }))}
            style={{
              width: 42, height: 24, borderRadius: 12, position: "relative",
              background: form.force_refresh ? "var(--accent)" : "var(--border2)",
              transition: "background .2s", flexShrink: 0,
            }}
          >
            <div style={{
              position: "absolute", top: 3, left: form.force_refresh ? 21 : 3,
              width: 18, height: 18, borderRadius: "50%",
              background: form.force_refresh ? "#0b0c0e" : "var(--muted)",
              transition: "left .2s",
            }} />
          </div>
          <span style={{ fontSize: 14 }}>
            Force refresh <span className="text-muted text-sm">(re-fetch even if data exists)</span>
          </span>
        </label>

        {selectedSource?.needsKey && (
          <div className="alert alert-info" style={{ marginBottom: 16, fontSize: 13 }}>
            JSearch requires <strong>RAPIDAPI_KEY</strong> set in your backend <code>.env</code> file.
          </div>
        )}

        <button
          className="apply-btn"
          style={{ padding: "11px 28px", fontSize: 15 }}
          onClick={fetchJobs}
          disabled={loading}
        >
          {loading ? "⏳ Fetching…" : `Fetch from ${selectedSource?.label ?? "source"}`}
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      {loading && (
        <div className="loading-center">
          <div className="spinner" />
          <p style={{ marginTop: 16 }}>Fetching jobs and caching in MongoDB…</p>
        </div>
      )}

      {result && !loading && (
        <div className="card" style={{ borderColor: "rgba(123,241,168,.3)" }}>
          <h3 style={{ color: "var(--accent2)", marginBottom: 14 }}>Fetch Complete</h3>
          <div className="flex wrap" style={{ gap: 20, marginBottom: 14 }}>
            {[
              { label: "Jobs fetched", value: result.total_fetched ?? "—" },
              { label: "New to DB",    value: newJobs, accent: true },
              { label: "Total in DB",  value: fetchedTotal },
              { label: "Source",       value: result.source },
              { label: "Query",        value: result.query },
            ].map(s => (
              <div key={s.label}>
                <div className="text-muted text-sm">{s.label}</div>
                <div style={{
                  fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 18, marginTop: 2,
                  color: s.accent ? "var(--accent)" : "var(--text)"
                }}>{s.value ?? "—"}</div>
              </div>
            ))}
          </div>

          {/* Per-source breakdown for all_free */}
          {result.sources?.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 10, marginBottom: 14 }}>
              {result.sources.map(s => (
                <div key={s.source} style={{ padding: "12px 14px", borderRadius: "var(--radius-sm)",
                  background: "var(--bg)", border: "1px solid var(--border2)" }}>
                  <div style={{ fontWeight: 700, textTransform: "capitalize", marginBottom: 4 }}>{s.source}</div>
                  <div className="text-muted text-sm">{s.total_fetched} fetched · {s.total_stored} stored</div>
                </div>
              ))}
            </div>
          )}

          <p className="text-muted text-sm">
            All fetched jobs are now available to users in Browse Jobs and AI Recommendations.
          </p>
        </div>
      )}

      <div className="alert alert-info" style={{ marginTop: 24, fontSize: 13, lineHeight: 1.8 }}>
        <strong>How it works:</strong> Free sources (Remotive, Arbeitnow, The Muse) require no API key and
        work immediately. Jobs are stored in MongoDB permanently — users browse and get AI recommendations
        from the cache with no further API calls until you fetch again.
      </div>
    </div>
  );
}
