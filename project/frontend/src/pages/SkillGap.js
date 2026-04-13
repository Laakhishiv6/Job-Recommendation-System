import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import api from "../utils/api";

// ── Curated phase-by-phase roadmaps per technology ────────────────────────
const SKILL_ROADMAPS = {
  python: {
    phases: [
      { phase: "Foundations", duration: "2–3 weeks", icon: "🐍",
        topics: ["Variables, data types, operators", "Control flow: if/else, loops", "Functions, scope, modules", "Lists, dicts, sets, tuples"] },
      { phase: "Intermediate", duration: "3–4 weeks", icon: "⚙️",
        topics: ["OOP: classes, inheritance, dunder methods", "File I/O & exception handling", "List comprehensions, generators", "pip, venv, requirements.txt"] },
      { phase: "Advanced", duration: "4–6 weeks", icon: "🚀",
        topics: ["Decorators & context managers", "Concurrency: threading, asyncio", "Testing with pytest", "Type hints & dataclasses"] },
    ],
    resources: [
      { name: "Python Official Tutorial",  url: "https://docs.python.org/3/tutorial/",                           free: true },
      { name: "Automate the Boring Stuff", url: "https://automatetheboringstuff.com",                           free: true },
      { name: "CS50P – Harvard (edX)",     url: "https://cs50.harvard.edu/python",                              free: true },
      { name: "Real Python",               url: "https://realpython.com",                                       free: false },
    ],
  },
  javascript: {
    phases: [
      { phase: "Core JS", duration: "2–3 weeks", icon: "📜",
        topics: ["Variables (var/let/const), types", "Functions, scope & closures", "Arrays, objects, iteration", "DOM manipulation & events"] },
      { phase: "Modern ES6+", duration: "2–3 weeks", icon: "✨",
        topics: ["Arrow functions, destructuring", "Promises, async/await, fetch", "ES6 modules (import/export)", "Spread, rest, optional chaining"] },
      { phase: "Ecosystem", duration: "4–5 weeks", icon: "🌐",
        topics: ["Node.js basics & npm", "Bundlers: Vite or Webpack", "Testing with Jest", "TypeScript introduction"] },
    ],
    resources: [
      { name: "MDN JavaScript Guide",    url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript", free: true },
      { name: "javascript.info",         url: "https://javascript.info",                                  free: true },
      { name: "Eloquent JavaScript",     url: "https://eloquentjavascript.net",                           free: true },
      { name: "freeCodeCamp JS Course",  url: "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/", free: true },
    ],
  },
  typescript: {
    phases: [
      { phase: "Type Basics", duration: "1–2 weeks", icon: "🔷",
        topics: ["Type annotations, interfaces", "Union, intersection, literal types", "Generics basics", "tsconfig.json setup"] },
      { phase: "Advanced Types", duration: "2–3 weeks", icon: "⚙️",
        topics: ["Utility types (Partial, Pick, Omit)", "Conditional & mapped types", "Type guards & narrowing", "Declaration files (.d.ts)"] },
      { phase: "Real-world TS", duration: "2–3 weeks", icon: "🏭",
        topics: ["TS with React", "TS with Node.js / Express", "Strict mode best practices", "Migrating JS to TS"] },
    ],
    resources: [
      { name: "TypeScript Official Handbook", url: "https://www.typescriptlang.org/docs/handbook/intro.html", free: true },
      { name: "Total TypeScript (Matt Pocock)", url: "https://www.totaltypescript.com",                      free: false },
      { name: "Execute Program TS",            url: "https://www.executeprogram.com/courses/typescript",    free: false },
    ],
  },
  react: {
    phases: [
      { phase: "React Basics", duration: "2–3 weeks", icon: "⚛️",
        topics: ["JSX, functional components, props", "useState, useEffect hooks", "Event handling & controlled forms", "Component composition"] },
      { phase: "State & Navigation", duration: "2–3 weeks", icon: "🔀",
        topics: ["Context API & useReducer", "React Router v6", "Custom hooks", "Error boundaries"] },
      { phase: "Production React", duration: "3–4 weeks", icon: "🏭",
        topics: ["Performance: memo, useMemo, useCallback", "React Testing Library + Jest", "Next.js (SSR, SSG, App Router)", "State libs: Zustand or Redux Toolkit"] },
    ],
    resources: [
      { name: "React Official Docs (react.dev)", url: "https://react.dev",                          free: true },
      { name: "Full Stack Open (Helsinki)",       url: "https://fullstackopen.com",                  free: true },
      { name: "Scrimba React Course",             url: "https://scrimba.com/learn/learnreact",       free: false },
      { name: "Epic React – Kent C. Dodds",       url: "https://epicreact.dev",                      free: false },
    ],
  },
  "machine learning": {
    phases: [
      { phase: "Math & Stats", duration: "3–4 weeks", icon: "📐",
        topics: ["Linear algebra (vectors, matrices)", "Probability & statistics fundamentals", "Calculus intuition (gradients, chain rule)", "NumPy & Pandas basics"] },
      { phase: "Core ML", duration: "4–6 weeks", icon: "🤖",
        topics: ["Supervised learning: regression, classification", "Unsupervised: k-means, PCA", "scikit-learn pipeline & preprocessing", "Model evaluation: CV, metrics, overfitting"] },
      { phase: "Deep Learning", duration: "6–8 weeks", icon: "🧠",
        topics: ["Neural networks & backpropagation", "CNNs for computer vision", "RNNs & Transformers for NLP", "PyTorch or TensorFlow basics", "Hugging Face ecosystem"] },
    ],
    resources: [
      { name: "fast.ai – Practical Deep Learning",       url: "https://course.fast.ai",                       free: true },
      { name: "Andrew Ng ML Specialisation (Coursera)",  url: "https://www.coursera.org/specializations/machine-learning-introduction", free: false },
      { name: "Kaggle Learn",                            url: "https://www.kaggle.com/learn",                  free: true },
      { name: "Dive into Deep Learning (d2l.ai)",        url: "https://d2l.ai",                                free: true },
    ],
  },
  docker: {
    phases: [
      { phase: "Container Basics", duration: "1–2 weeks", icon: "📦",
        topics: ["Containers vs VMs", "docker run, pull, build", "Dockerfile instructions", "Image layers & caching"] },
      { phase: "Compose & Networks", duration: "1–2 weeks", icon: "🔗",
        topics: ["docker-compose.yml syntax", "Multi-container apps", "Named volumes & bind mounts", "Bridge networks & DNS"] },
      { phase: "Production", duration: "2–3 weeks", icon: "🔐",
        topics: ["Multi-stage builds for smaller images", "Docker Hub / ECR / GHCR", "Security scanning (Trivy, Snyk)", "Healthchecks & restart policies"] },
    ],
    resources: [
      { name: "Docker Official Get Started",   url: "https://docs.docker.com/get-started/",      free: true },
      { name: "Play with Docker (browser)",    url: "https://labs.play-with-docker.com",          free: true },
      { name: "TechWorld with Nana (YouTube)", url: "https://www.youtube.com/@TechWorldwithNana", free: true },
      { name: "Docker & K8s – Udemy (Bret)",  url: "https://www.udemy.com/course/docker-mastery/", free: false },
    ],
  },
  kubernetes: {
    phases: [
      { phase: "Core Objects", duration: "2–3 weeks", icon: "☸️",
        topics: ["Pods, ReplicaSets, Deployments", "Services: ClusterIP, NodePort, LoadBalancer", "ConfigMaps & Secrets", "kubectl commands"] },
      { phase: "Networking & Storage", duration: "2–3 weeks", icon: "🌐",
        topics: ["Ingress controllers (nginx)", "Persistent Volumes & Claims", "Network policies", "Namespaces & RBAC"] },
      { phase: "Operations", duration: "3–4 weeks", icon: "🛠️",
        topics: ["Helm charts", "Horizontal Pod Autoscaler", "Monitoring: Prometheus + Grafana", "Rolling updates & rollbacks"] },
    ],
    resources: [
      { name: "Kubernetes Official Tutorials", url: "https://kubernetes.io/docs/tutorials/",  free: true },
      { name: "Killercoda (browser labs)",     url: "https://killercoda.com",                  free: true },
      { name: "KodeKloud",                     url: "https://kodekloud.com",                   free: false },
      { name: "CKA Exam Prep (Udemy)",         url: "https://www.udemy.com/course/certified-kubernetes-administrator-with-practice-tests/", free: false },
    ],
  },
  aws: {
    phases: [
      { phase: "Fundamentals", duration: "2–3 weeks", icon: "☁️",
        topics: ["IAM: users, roles, policies", "EC2: instances, AMIs, security groups", "S3: buckets, policies, lifecycle", "VPC, subnets, routing basics"] },
      { phase: "Core Services", duration: "3–4 weeks", icon: "⚙️",
        topics: ["RDS & DynamoDB", "Lambda & API Gateway", "ECS (Fargate) basics", "CloudWatch logging & alarms"] },
      { phase: "Architect Level", duration: "4–6 weeks", icon: "🏗️",
        topics: ["High availability & fault tolerance", "CloudFormation / CDK IaC", "Cost optimisation strategies", "SAA-C03 exam preparation"] },
    ],
    resources: [
      { name: "AWS Skill Builder (free tier)",  url: "https://skillbuilder.aws",              free: true },
      { name: "AWS Free Tier (hands-on)",        url: "https://aws.amazon.com/free/",           free: true },
      { name: "Adrian Cantrill's Courses",       url: "https://learn.cantrill.io",              free: false },
      { name: "Tutorials Dojo Practice Exams",   url: "https://tutorialsdojo.com",              free: false },
    ],
  },
  sql: {
    phases: [
      { phase: "Fundamentals", duration: "1–2 weeks", icon: "🗃️",
        topics: ["SELECT, WHERE, ORDER BY, LIMIT", "Aggregate functions: COUNT, SUM, AVG", "JOINs: INNER, LEFT, RIGHT, FULL", "GROUP BY & HAVING"] },
      { phase: "Intermediate", duration: "2–3 weeks", icon: "📊",
        topics: ["Subqueries & CTEs (WITH clause)", "Window functions: ROW_NUMBER, RANK, LAG", "Indexes & EXPLAIN query plans", "NULL handling"] },
      { phase: "Advanced", duration: "2–3 weeks", icon: "🔧",
        topics: ["Stored procedures & functions", "Transactions & ACID properties", "Database design & normalisation", "PostgreSQL vs MySQL differences"] },
    ],
    resources: [
      { name: "SQLZoo (interactive)",     url: "https://sqlzoo.net",                                          free: true },
      { name: "Mode SQL Tutorial",        url: "https://mode.com/sql-tutorial/",                              free: true },
      { name: "LeetCode SQL Problems",    url: "https://leetcode.com/problemset/database/",                   free: true },
      { name: "pgexercises.com",          url: "https://pgexercises.com",                                     free: true },
    ],
  },
  default: {
    phases: [
      { phase: "Beginner",     duration: "2–4 weeks", icon: "📖",
        topics: ["Core syntax and fundamentals", "Official documentation walkthrough", "Follow beginner tutorials", "Build small practice projects"] },
      { phase: "Intermediate", duration: "4–6 weeks", icon: "⚙️",
        topics: ["Common patterns and best practices", "Integration with related tools", "Community tutorials and structured courses"] },
      { phase: "Advanced",     duration: "6–8 weeks", icon: "🚀",
        topics: ["Production-grade usage", "Performance and optimisation", "Build a portfolio project", "Contribute to open source"] },
    ],
    resources: [
      { name: "Official Documentation", url: null,                         free: true },
      { name: "Coursera",               url: "https://www.coursera.org",   free: false },
      { name: "Udemy",                  url: "https://www.udemy.com",      free: false },
      { name: "YouTube tutorials",      url: "https://www.youtube.com",    free: true },
    ],
  },
};

function getRoadmap(skill) {
  const key = skill.toLowerCase();
  for (const [k, v] of Object.entries(SKILL_ROADMAPS)) {
    if (key.includes(k)) return v;
  }
  return SKILL_ROADMAPS.default;
}

// ── Expandable roadmap card for a single skill ───────────────────────────────
function ExpandableRoadmap({ index, skill, why, forceOpen }) {
  const [open, setOpen] = useState(false);
  const roadmap = getRoadmap(skill);
  const isOpen  = forceOpen || open;

  return (
    <div style={{ border: "1px solid var(--border2)", borderRadius: "var(--radius)",
      background: "var(--bg)", overflow: "hidden" }}>

      {/* Header */}
      <button onClick={() => setOpen(o => !o)} style={{
        width: "100%", padding: "16px 20px", background: "none", border: "none",
        cursor: "pointer", display: "flex", justifyContent: "space-between",
        alignItems: "center", gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, textAlign: "left", flexWrap: "wrap" }}>
          <span style={{
            width: 28, height: 28, borderRadius: "50%", background: "var(--surface)",
            border: "1.5px solid var(--danger)", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 12, fontWeight: 800,
            color: "var(--danger)", flexShrink: 0,
          }}>{index + 1}</span>
          <span style={{ fontFamily: "var(--font-head)", fontWeight: 700,
            fontSize: 16, color: "var(--text)" }}>{skill}</span>
          {why && <span style={{ fontSize: 13, color: "var(--muted)", fontStyle: "italic" }}>{why}</span>}
        </div>
        <span style={{ color: "var(--accent)", fontSize: 20, flexShrink: 0 }}>
          {isOpen ? "▾" : "▸"}
        </span>
      </button>

      {/* Expanded content */}
      {isOpen && (
        <div style={{ padding: "0 20px 24px" }}>

          {/* Phase timeline */}
          <div style={{ position: "relative", marginBottom: 24 }}>
            {/* Vertical connector line */}
            <div style={{ position: "absolute", left: 19, top: 4, bottom: 24,
              width: 2, background: "var(--border2)", zIndex: 0 }} />

            {roadmap.phases.map((phase, i) => (
              <div key={i} style={{ display: "flex", gap: 16, marginBottom: 22,
                position: "relative", zIndex: 1 }}>
                {/* Node */}
                <div style={{
                  width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                  background: "var(--surface)", border: "2px solid var(--accent)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                }}>{phase.icon}</div>

                <div style={{ flex: 1, paddingTop: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 8 }}>
                    <span style={{ fontFamily: "var(--font-head)", fontWeight: 700,
                      fontSize: 14, color: "var(--text)" }}>
                      Phase {i + 1}: {phase.phase}
                    </span>
                    <span className="badge" style={{ fontSize: 11 }}>⏱ {phase.duration}</span>
                  </div>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 5 }}>
                    {phase.topics.map((t, j) => (
                      <li key={j} style={{ fontSize: 13, color: "var(--muted)",
                        display: "flex", alignItems: "flex-start", gap: 7 }}>
                        <span style={{ color: "var(--accent)", flexShrink: 0, marginTop: 1 }}>›</span>{t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* Resources */}
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)",
            marginBottom: 10, textTransform: "uppercase", letterSpacing: 1.2 }}>
            Recommended Resources
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {roadmap.resources.map((r, i) => (
              <a key={i}
                href={r.url || `https://www.google.com/search?q=${encodeURIComponent(skill + " tutorial")}`}
                target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 14px", borderRadius: "var(--radius-sm)",
                  background: "var(--surface)", border: "1px solid var(--border)",
                  textDecoration: "none", transition: "border-color .2s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "var(--border2)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
              >
                <span style={{ fontSize: 14, color: "var(--text)", fontWeight: 500 }}>{r.name}</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span className={`badge ${r.free ? "green" : ""}`} style={{ fontSize: 11 }}>
                    {r.free ? "✓ Free" : "Paid"}
                  </span>
                  <span style={{ color: "var(--accent)", fontSize: 13 }}>↗</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SkillGap() {
  const routeState = useLocation().state || {};

  const [form, setForm] = useState({
    target_job_title: routeState.target_job_title || "",
    required_skills:  (routeState.required_skills || []).join(", "),
    job_id:           routeState.job_id || "",
  });
  const [result, setResult]         = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [hasProfile, setHasProfile] = useState(true);
  const [expandAll, setExpandAll]   = useState(false);

  useEffect(() => {
    api.get("/my-profile").catch(() => setHasProfile(false));
    if (routeState.target_job_title) {
      runAnalysis({
        target_job_title: routeState.target_job_title,
        required_skills:  routeState.required_skills || [],
        job_id:           routeState.job_id || "",
      });
    }
  }, []);

  const runAnalysis = async (payload) => {
    setLoading(true); setError(""); setResult(null);
    try {
      const body = payload || {
        target_job_title: form.target_job_title,
        required_skills:  form.required_skills.split(",").map(s => s.trim()).filter(Boolean),
        job_id:           form.job_id || undefined,
      };
      const res = await api.post("/skill-gap", body);
      setResult(res.data);
    } catch (err) {
      const detail = err.response?.data?.detail || "";
      if (detail.includes("Upload")) setHasProfile(false);
      else setError(detail || "Analysis failed.");
    } finally { setLoading(false); }
  };

  const score      = result?.readiness_score ?? 0;
  const scoreColor = score >= 70 ? "var(--accent2)" : score >= 40 ? "var(--warn)" : "var(--danger)";

  if (!hasProfile) return (
    <div>
      <div className="page-header"><h1>Skill Gap Analysis</h1></div>
      <div className="card" style={{ textAlign: "center", padding: "48px 32px" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
        <h3>Upload your resume first</h3>
        <p className="text-muted" style={{ marginTop: 8, marginBottom: 24 }}>
          We need your profile to run the analysis.
        </p>
        <Link to="/profile" className="apply-btn" style={{ display: "inline-flex" }}>Upload Resume</Link>
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h1>Skill Gap Analysis</h1>
        <p>See exactly what you're missing — then follow a phase-by-phase roadmap to get job-ready.</p>
      </div>

      {/* Form */}
      <div className="card" style={{ marginBottom: 24 }}>
        <form onSubmit={e => { e.preventDefault(); runAnalysis(); }}>
          <div className="flex wrap" style={{ gap: 12 }}>
            <div className="form-group" style={{ flex: 2, minWidth: 200, marginBottom: 0 }}>
              <label>Target job title</label>
              <input className="form-input"
                placeholder="e.g. Senior Machine Learning Engineer"
                value={form.target_job_title}
                onChange={e => setForm({ ...form, target_job_title: e.target.value })} required />
            </div>
            <div className="form-group" style={{ flex: 3, minWidth: 240, marginBottom: 0 }}>
              <label>Required skills (comma-separated, optional)</label>
              <input className="form-input"
                placeholder="e.g. Python, TensorFlow — leave blank to auto-detect from title"
                value={form.required_skills}
                onChange={e => setForm({ ...form, required_skills: e.target.value })} />
            </div>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button className="apply-btn" style={{ padding: "10px 24px" }} disabled={loading}>
                {loading ? "Analysing…" : "Analyse gap"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      {loading && (
        <div className="loading-center">
          <div className="spinner" />
          <p style={{ marginTop: 16 }}>AI is analysing your profile and building your learning roadmap…</p>
        </div>
      )}

      {result && (
        <div style={{ display: "grid", gap: 20 }}>

          {/* Readiness score card */}
          <div className="card">
            <div className="flex justify-between items-center"
              style={{ marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
              <div>
                <h2>Readiness Score</h2>
                <p className="text-muted text-sm" style={{ marginTop: 4 }}>
                  For: <strong style={{ color: "var(--text)" }}>
                    {form.target_job_title || routeState.target_job_title}
                  </strong>
                </p>
              </div>
              <div style={{ width: 90, height: 90, borderRadius: "50%",
                border: `4px solid ${scoreColor}`, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-head)", fontWeight: 800,
                fontSize: 24, color: scoreColor }}>
                {score}%
                <span style={{ fontSize: 9, fontWeight: 400, color: "var(--muted)",
                  textTransform: "uppercase", letterSpacing: 1 }}>ready</span>
              </div>
            </div>
            <div className="readiness-bar-wrap">
              <div className="readiness-bar" style={{ width: `${score}%`, background: scoreColor }} />
            </div>
            <div style={{ display: "flex", fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
              <span>0% — Beginner</span>
              <span style={{ marginLeft: "auto" }}>100% — Job-ready</span>
            </div>
            <p style={{ marginTop: 14, fontSize: 14, color: "var(--muted)", lineHeight: 1.8,
              borderTop: "1px solid var(--border)", paddingTop: 14 }}>
              {result.summary}
            </p>
          </div>

          {/* Skills columns */}
          <div className="flex wrap" style={{ gap: 16 }}>
            <div className="card" style={{ flex: 1, minWidth: 200 }}>
              <h3 style={{ marginBottom: 12 }}>
                <span style={{ color: "var(--accent2)" }}>✓</span>{" "}
                You already have ({result.matched_skills?.length || 0})
              </h3>
              <div className="skills-list">
                {result.matched_skills?.length > 0
                  ? result.matched_skills.map(s => <span key={s} className="badge green">{s}</span>)
                  : <span className="text-muted text-sm">None matched yet</span>}
              </div>
            </div>
            <div className="card" style={{ flex: 1, minWidth: 200 }}>
              <h3 style={{ marginBottom: 12 }}>
                <span style={{ color: "var(--danger)" }}>✗</span>{" "}
                Still need ({result.missing_skills?.length || 0})
              </h3>
              <div className="skills-list">
                {result.missing_skills?.length > 0
                  ? result.missing_skills.map(s => <span key={s} className="badge danger">{s}</span>)
                  : <span className="text-muted text-sm">🎉 No gaps — you're ready!</span>}
              </div>
            </div>
          </div>

          {/* Learning roadmap */}
          {result.missing_skills?.length > 0 && (
            <div>
              <div className="flex justify-between items-center" style={{ marginBottom: 14 }}>
                <div>
                  <h2>📚 Learning Roadmap</h2>
                  <p className="text-muted text-sm" style={{ marginTop: 4 }}>
                    Click any skill to see a 3-phase roadmap with curated resources.
                  </p>
                </div>
                <button className="nav-btn ghost" style={{ fontSize: 13 }}
                  onClick={() => setExpandAll(v => !v)}>
                  {expandAll ? "Collapse all" : "Expand all"}
                </button>
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                {(result.recommended_learning?.length > 0
                  ? result.recommended_learning
                  : result.missing_skills.map(s => ({ skill: s, why: "" }))
                ).map((item, i) => (
                  <ExpandableRoadmap
                    key={i} index={i}
                    skill={item.skill} why={item.why}
                    forceOpen={expandAll}
                  />
                ))}
              </div>

              {/* Time estimate */}
              <div className="card" style={{ marginTop: 20, textAlign: "center", padding: "24px 32px" }}>
                <div style={{ fontFamily: "var(--font-head)", fontSize: 26, fontWeight: 800,
                  color: "var(--accent)", marginBottom: 6 }}>
                  ~{result.missing_skills.length * 5}–{result.missing_skills.length * 10} weeks
                </div>
                <div className="text-muted text-sm">
                  Estimated total time to close all {result.missing_skills.length} skill gap{result.missing_skills.length > 1 ? "s" : ""}{" "}
                  (studying 1–2 hours per day)
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
