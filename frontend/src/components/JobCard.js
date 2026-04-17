import React, { useState } from "react";

function scoreClass(s) {
  if (s >= 75) return "score-high";
  if (s >= 45) return "score-mid";
  return "score-low";
}

export default function JobCard({ job, showScore = false, onSkillGap }) {
  const [expanded, setExpanded] = useState(false);

  const applyLink = job.apply_link || job.applyLink;

  return (
    <div className="job-card">
      {/* Top row */}
      <div className="job-card-top">
        <div style={{ flex: 1 }}>
          <div className="flex items-center gap-2 wrap" style={{ gap: 10 }}>
            {job.company_logo && (
              <img
                src={job.company_logo} alt=""
                style={{ width: 32, height: 32, borderRadius: 6, objectFit: "contain",
                         background: "#1e2024", padding: 2 }}
                onError={e => { e.target.style.display = "none"; }}
              />
            )}
            <div>
              <div className="job-title">{job.title}</div>
              <div className="job-company">{job.company}</div>
            </div>
          </div>
        </div>

        {showScore && job.match_score !== undefined && (
          <div className={`score-ring ${scoreClass(job.match_score)}`}>
            {job.match_score}%
          </div>
        )}
      </div>

      {/* Meta badges */}
      <div className="job-meta">
        {job.location && <span className="badge">📍 {job.location}</span>}
        {job.job_type  && <span className="badge accent">{job.job_type}</span>}
        {job.salary    && <span className="badge green">💰 {job.salary}</span>}
        {job.posted_date && <span className="badge">🗓 {job.posted_date}</span>}
      </div>

      {/* Skills */}
      {job.required_skills?.length > 0 && (
        <div className="skills-list">
          {job.required_skills.slice(0, 6).map(s => (
            <span key={s} className="badge">{s}</span>
          ))}
          {job.required_skills.length > 6 && (
            <span className="badge">+{job.required_skills.length - 6} more</span>
          )}
        </div>
      )}

      {/* Recommendation reason */}
      {showScore && job.reason && (
        <p style={{ fontSize: 13, color: "var(--muted)", fontStyle: "italic" }}>
          {job.reason}
        </p>
      )}

      {/* Missing skills */}
      {showScore && job.missing_skills?.length > 0 && (
        <div>
          <span className="text-sm text-muted">Missing skills: </span>
          <div className="skills-list" style={{ marginTop: 4 }}>
            {job.missing_skills.map(s => <span key={s} className="badge warn">{s}</span>)}
          </div>
        </div>
      )}

      {/* Description expand */}
      {job.description && (
        <div>
          <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
            {expanded ? job.description : job.description.slice(0, 200) + (job.description.length > 200 ? "…" : "")}
          </p>
          {job.description.length > 200 && (
            <button
              onClick={() => setExpanded(!expanded)}
              style={{ fontSize: 12, color: "var(--accent)", background: "none",
                       border: "none", cursor: "pointer", padding: 0, marginTop: 4 }}
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>
      )}

      {/* Action row */}
      <div className="flex items-center wrap" style={{ gap: 10, marginTop: 4 }}>
        {/* Apply button – always shown, disabled if no link */}
        {applyLink ? (
          <a
            href={applyLink}
            target="_blank"
            rel="noopener noreferrer"
            className="apply-btn"
          >
            Apply now ↗
          </a>
        ) : (
          <span className="apply-btn" aria-disabled="true" style={{
            background: "var(--border)", color: "var(--muted)", cursor: "not-allowed"
          }}>
            No link available
          </span>
        )}

        {onSkillGap && (
          <button
            className="apply-btn outline"
            onClick={() => onSkillGap(job)}
          >
            Analyse skill gap
          </button>
        )}
      </div>
    </div>
  );
}
