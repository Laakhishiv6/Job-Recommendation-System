from groq import Groq
from dotenv import load_dotenv
from typing import Optional
import os, json, re

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
RESUME_CHAR_LIMIT = 4000


def _chat(prompt: str, max_tokens: int = 800, temperature: float = 0.1) -> str:
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=max_tokens,
        temperature=temperature,
    )
    return response.choices[0].message.content.strip()


def _extract_json_block(text: str) -> Optional[dict]:
    text = re.sub(r"```(?:json)?", "", text).strip().rstrip("`").strip()
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass
    return None


# ─── 1. Resume Parsing ───────────────────────────────────────────────────────

def parse_resume_llm(text: str) -> dict:
    text = text[:RESUME_CHAR_LIMIT]
    prompt = f"""You are a resume parser. Extract the following fields and return ONLY valid JSON.
JSON format:
{{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "phone number or null",
  "skills": ["skill1", "skill2"],
  "education": [{{"degree": "BSc CS", "institution": "MIT", "year": "2020"}}],
  "experience": [{{"title": "Engineer", "company": "Google", "duration": "2 years", "summary": "brief"}}]
}}
Rules:
- skills must be a flat list of strings
- Return null for missing fields, empty arrays [] if section not found
Resume:
{text}"""
    raw = _chat(prompt, max_tokens=900)
    parsed = _extract_json_block(raw)
    if parsed:
        for key in ("skills", "education", "experience"):
            if not isinstance(parsed.get(key), list):
                parsed[key] = []
        return parsed
    return _fallback_parse(raw)


def _fallback_parse(output: str) -> dict:
    data = {"name": None, "email": None, "phone": None,
            "skills": [], "education": [], "experience": []}
    for line in output.splitlines():
        line = line.strip()
        lower = line.lower()
        if lower.startswith("name:"):
            data["name"] = line.split(":", 1)[1].strip() or None
        elif lower.startswith("email:"):
            data["email"] = line.split(":", 1)[1].strip() or None
        elif lower.startswith("phone:"):
            data["phone"] = line.split(":", 1)[1].strip() or None
        elif lower.startswith("skills:"):
            raw_skills = line.split(":", 1)[1].strip()
            data["skills"] = [s.strip() for s in raw_skills.split(",") if s.strip()]
    return data


# ─── 2. Job Recommendations ──────────────────────────────────────────────────

def get_job_recommendations(
    user_skills: list[str],
    user_experience: list[dict],
    available_jobs: list[dict],
    top_n: int = 5,
) -> list[dict]:
    if not available_jobs:
        return []

    jobs_summary = []
    for i, job in enumerate(available_jobs[:30]):
        jobs_summary.append(
            f"{i}. {job.get('title')} at {job.get('company')} | "
            f"Required: {', '.join(job.get('required_skills', []))}"
        )

    prompt = f"""You are a career advisor AI. Return ONLY a valid JSON array – no explanation, no markdown.
User Skills: {', '.join(user_skills)}
User Experience:
{json.dumps(user_experience, indent=2)}
Available Jobs (index | title | company | required skills):
{chr(10).join(jobs_summary)}
Task: Select the top {top_n} best matching jobs for this user.
Return JSON array:
[
  {{
    "job_index": 0,
    "match_score": 85,
    "reason": "Strong match because...",
    "missing_skills": ["skill_a"]
  }}
]
Rules:
- match_score is 0-100 integer
- missing_skills are skills in the job NOT in the user profile
- Order by match_score descending
- Return exactly {top_n} items or fewer if fewer jobs exist"""

    raw = _chat(prompt, max_tokens=1000)
    raw = re.sub(r"```(?:json)?", "", raw).strip().rstrip("`").strip()
    match = re.search(r"\[.*\]", raw, re.DOTALL)
    if not match:
        return []
    try:
        rankings = json.loads(match.group())
    except json.JSONDecodeError:
        return []

    results = []
    for item in rankings:
        idx = item.get("job_index")
        if idx is not None and 0 <= idx < len(available_jobs):
            job = available_jobs[idx]
            results.append({
                "title":          job.get("title"),
                "company":        job.get("company"),
                "location":       job.get("location"),
                "job_type":       job.get("job_type"),
                "salary":         job.get("salary"),
                "apply_link":     job.get("apply_link"),      # ← preserved
                "match_score":    item.get("match_score", 0),
                "reason":         item.get("reason", ""),
                "missing_skills": item.get("missing_skills", []),
                "job_id":         str(job.get("source_id", job.get("_id", ""))),
                "posted_date":    job.get("posted_date"),
                "company_logo":   job.get("company_logo"),
            })
    return sorted(results, key=lambda x: x["match_score"], reverse=True)


# ─── 3. Skill Gap Analysis ───────────────────────────────────────────────────

def analyze_skill_gap(
    user_skills: list[str],
    user_experience: list[dict],
    target_job_title: str,
    required_skills: list[str],
) -> dict:
    prompt = f"""You are a career coach AI. Analyze the skill gap. Return ONLY valid JSON – no explanation, no markdown.
User's current skills: {', '.join(user_skills)}
User's experience:
{json.dumps(user_experience, indent=2)}
Target job: {target_job_title}
Required skills: {', '.join(required_skills) if required_skills else 'Infer from the job title'}
Return this exact JSON:
{{
  "matched_skills": ["skill1"],
  "missing_skills": ["skill2"],
  "recommended_learning": [
    {{"skill": "skill2", "why": "Why important", "resources": ["Coursera", "Udemy"]}}
  ],
  "readiness_score": 72,
  "summary": "2-3 sentence honest assessment"
}}
Rules:
- readiness_score is 0-100 integer
- List at most 6 missing skills, prioritised by importance
- recommended_learning must only include skills from missing_skills
- resources should be real well-known platforms"""

    raw = _chat(prompt, max_tokens=1200)
    parsed = _extract_json_block(raw)
    if parsed:
        for key in ("matched_skills", "missing_skills", "recommended_learning"):
            if not isinstance(parsed.get(key), list):
                parsed[key] = []
        if not isinstance(parsed.get("readiness_score"), (int, float)):
            parsed["readiness_score"] = 0
        return parsed

    user_set = set(s.lower() for s in user_skills)
    matched = [s for s in required_skills if s.lower() in user_set]
    missing = [s for s in required_skills if s.lower() not in user_set]
    readiness = int((len(matched) / max(len(required_skills), 1)) * 100)
    return {
        "matched_skills": matched,
        "missing_skills": missing,
        "recommended_learning": [{"skill": s, "why": "", "resources": []} for s in missing[:6]],
        "readiness_score": readiness,
        "summary": "Could not generate detailed analysis. Showing basic skill comparison.",
    }


# ─── 4. Project Ideas ────────────────────────────────────────────────────────

def generate_project_ideas(
    user_skills: list[str],
    user_experience: list[dict],
    user_education: list[dict],
    target_job_title: str,
    required_skills: list[str],
    missing_skills: list[str],
) -> dict:
    prompt = f"""You are a senior software engineer and career mentor. Suggest practical portfolio projects for a job seeker.

First, classify the user as STUDENT or PROFESSIONAL:
- STUDENT: currently studying, only intern/no experience, or fresh graduate within 1 year
- PROFESSIONAL: has real full-time work experience

User Skills: {', '.join(user_skills) if user_skills else 'None listed'}
User Experience:
{json.dumps(user_experience, indent=2) if user_experience else '[]'}
User Education:
{json.dumps(user_education, indent=2) if user_education else '[]'}

Target Role: {target_job_title}
Required Skills for Role: {', '.join(required_skills) if required_skills else 'Infer from job title'}
Skills the User Still Needs: {', '.join(missing_skills) if missing_skills else 'None identified'}

Return ONLY valid JSON – no explanation, no markdown:
{{
  "user_context": "student",
  "context_note": "One sentence explaining why classified as student or professional",
  "projects": [
    {{
      "name": "Project title",
      "type": "Web App",
      "difficulty": "Intermediate",
      "estimated_time": "3–4 weeks",
      "description": "2-3 sentences on what it does and why it fits the target role",
      "tech_stack": ["Tech1", "Tech2"],
      "implementation_steps": [
        "Step 1: ...",
        "Step 2: ...",
        "Step 3: ...",
        "Step 4: ...",
        "Step 5: ..."
      ],
      "why_it_helps": "One sentence on how this project proves readiness for the role"
    }}
  ]
}}
Rules:
- Generate exactly 3 projects
- STUDENT projects: beginner-to-intermediate, portfolio-focused, realistic solo builds
- PROFESSIONAL projects: intermediate-to-advanced, production-thinking, scalable designs
- Each project must use at least 2 skills from required_skills or missing_skills
- difficulty must be one of: Beginner, Intermediate, Advanced
- type examples: Web App, REST API, CLI Tool, ML Model, Data Pipeline, Dashboard, Mobile App
- Keep descriptions concise and actionable"""

    raw = _chat(prompt, max_tokens=1600, temperature=0.3)
    parsed = _extract_json_block(raw)

    if parsed and isinstance(parsed.get("projects"), list):
        for proj in parsed["projects"]:
            if not isinstance(proj.get("tech_stack"), list):
                proj["tech_stack"] = []
            if not isinstance(proj.get("implementation_steps"), list):
                proj["implementation_steps"] = []
        return parsed

    # Fallback: generic ideas based on job title
    return {
        "user_context": "unknown",
        "context_note": "Could not determine user context from profile.",
        "projects": [
            {
                "name": f"Portfolio project for {target_job_title}",
                "type": "Web App",
                "difficulty": "Intermediate",
                "estimated_time": "3–4 weeks",
                "description": f"Build a full-stack project that demonstrates core skills needed for a {target_job_title} role.",
                "tech_stack": required_skills[:4] if required_skills else ["Python", "React"],
                "implementation_steps": [
                    "Step 1: Plan the project scope and define core features",
                    "Step 2: Set up project structure and development environment",
                    "Step 3: Implement core backend logic and data models",
                    "Step 4: Build the frontend interface and connect to the API",
                    "Step 5: Deploy to a cloud platform and document the project",
                ],
                "why_it_helps": f"Demonstrates hands-on experience with skills required for {target_job_title}",
            }
        ],
    }
