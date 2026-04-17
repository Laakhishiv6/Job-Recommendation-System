from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from bson import ObjectId
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
import os, shutil, re, fitz
from pathlib import Path

from db import users_collection, user_info_collection, jobs_collection, pending_verifications_collection
from models import UserSignup, UserLogin, JobPosting, SkillGapRequest, VerifyEmailRequest
from auth import hash_password, verify_password, create_access_token, get_current_user
from ai_engine import parse_resume_llm, get_job_recommendations, analyze_skill_gap
from job_fetcher import fetch_and_cache_jobs, bulk_fetch_jobs, get_all_jobs_from_mongo, get_job_by_id, get_redis_stats
from email_service import generate_verification_code, send_verification_email

app = FastAPI(
    title="Job Recommendation & Skill Gap API",
    version="2.0.0",
    description="Context-aware job recommendations and skill gap analysis powered by LLMs"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_FOLDER = Path("resumes")
UPLOAD_FOLDER.mkdir(exist_ok=True)


class BulkFetchRequest(BaseModel):
    queries: list[dict]
    num_pages: int = 1
    force_refresh: bool = False
    fetch_details: bool = True


def _serialize(doc: dict) -> dict:
    doc["_id"] = str(doc["_id"])
    return doc


# ─── Auth ────────────────────────────────────────────────────────────────────

@app.post("/signup", tags=["Auth"])
async def signup(user: UserSignup):
    if len(user.name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Name must be at least 2 characters")
    if len(user.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    if users_collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")

    code = generate_verification_code()
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    # Upsert pending verification (allows resend if user tries again)
    pending_verifications_collection.update_one(
        {"email": user.email},
        {"$set": {
            "name": user.name.strip(),
            "email": user.email,
            "password_hash": hash_password(user.password),
            "code": code,
            "expires_at": expires_at,
        }},
        upsert=True,
    )

    sent = send_verification_email(user.email, code, user.name.strip())
    if not sent:
        pending_verifications_collection.delete_one({"email": user.email})
        raise HTTPException(
            status_code=500,
            detail="Failed to send verification email. Check EMAIL_ADDRESS and EMAIL_PASSWORD in .env",
        )

    return {"message": "Verification code sent to your email. Check your inbox."}


@app.post("/verify-email", tags=["Auth"])
async def verify_email(data: VerifyEmailRequest):
    pending = pending_verifications_collection.find_one({"email": data.email})
    if not pending:
        raise HTTPException(
            status_code=404,
            detail="No pending verification found. Please sign up again.",
        )

    if pending["expires_at"] < datetime.utcnow():
        pending_verifications_collection.delete_one({"email": data.email})
        raise HTTPException(status_code=400, detail="Code expired. Please sign up again.")

    if pending["code"] != data.code.strip():
        raise HTTPException(status_code=400, detail="Invalid verification code")

    if users_collection.find_one({"email": data.email}):
        pending_verifications_collection.delete_one({"email": data.email})
        raise HTTPException(status_code=400, detail="Email already registered")

    users_collection.insert_one({
        "name": pending["name"],
        "email": pending["email"],
        "password": pending["password_hash"],
    })
    pending_verifications_collection.delete_one({"email": data.email})

    return {"message": "Account created successfully! You can now sign in."}


@app.post("/login", tags=["Auth"])
async def login(user: UserLogin):
    db_user = users_collection.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}


# ─── Resume ──────────────────────────────────────────────────────────────────

@app.post("/upload-resume", tags=["Resume"])
async def upload_resume(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    safe_filename = re.sub(r"[^\w\-.]", "_", file.filename)
    save_path = UPLOAD_FOLDER / safe_filename
    try:
        with open(save_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {e}")

    try:
        doc = fitz.open(str(save_path))
        raw_text = " ".join(page.get_text() for page in doc)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read PDF: {e}")

    if not raw_text.strip():
        raise HTTPException(status_code=400, detail="PDF is empty or image-only.")

    try:
        parsed = parse_resume_llm(raw_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM parsing failed: {e}")

    if not parsed.get("email"):
        return {"error": "Could not extract email from resume", "parsed_so_far": parsed}

    try:
        user_info_collection.update_one(
            {"email": current_user["email"]},
            {"$set": {
                "name": parsed.get("name"),
                "phone": parsed.get("phone"),
                "skills": parsed.get("skills", []),
                "education": parsed.get("education", []),
                "experience": parsed.get("experience", []),
            }},
            upsert=True
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

    return {"filename": safe_filename, "message": "Resume parsed and stored successfully", **parsed}


@app.get("/my-profile", tags=["Resume"])
async def get_profile(current_user: dict = Depends(get_current_user)):
    profile = user_info_collection.find_one({"email": current_user["email"]}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="No profile found – upload your resume first")
    return {"profiles": profile}


# ─── Manual Jobs ─────────────────────────────────────────────────────────────

@app.post("/jobs", tags=["Jobs (Manual)"])
async def add_job(job: JobPosting, current_user: dict = Depends(get_current_user)):
    result = jobs_collection.insert_one(job.model_dump())
    return {"message": "Job added", "results": str(result.inserted_id)}


@app.get("/jobs", tags=["Jobs (Manual)"])
async def list_jobs(skill: Optional[str] = None, limit: int = Query(default=20, le=100)):
    query = {}
    if skill:
        query["required_skills"] = {"$regex": skill, "$options": "i"}
    jobs = list(jobs_collection.find(query).limit(limit))
    return {"results": [_serialize(j) for j in jobs]}


# ─── Fetched Jobs (JSearch + MongoDB cache) ──────────────────────────────────

@app.get("/fetched-jobs", tags=["Fetched Jobs"])
async def get_fetched_jobs(
    query: str = "software developer",
    location: str = "remote",
    num_pages: int = Query(default=1, le=3),
    force_refresh: bool = False,
    fetch_details: bool = False,   # Default OFF to save API calls
):
    """
    Fetch jobs from JSearch API, cache in Redis+MongoDB.
    On subsequent calls with same query/location, serves from cache - NO API call made.
    fetch_details is OFF by default to minimize JSearch API usage.
    """
    result = fetch_and_cache_jobs(
        query=query,
        location=location,
        num_pages=num_pages,
        force_refresh=force_refresh,
        fetch_details=fetch_details,
    )
    return result


@app.post("/fetched-jobs/bulk", tags=["Fetched Jobs"])
async def bulk_fetch(body: BulkFetchRequest, current_user: dict = Depends(get_current_user)):
    """Bulk pre-fetch jobs for multiple queries. Cache-first, minimal API calls."""
    result = bulk_fetch_jobs(
        queries=body.queries,
        num_pages=body.num_pages,
        force_refresh=body.force_refresh,
        fetch_details=body.fetch_details,
    )
    return result


@app.get("/fetched-jobs/all", tags=["Fetched Jobs"])
async def all_fetched_jobs(limit: int = Query(default=100, le=500)):
    """Return all jobs stored in MongoDB (no API call)."""
    jobs = get_all_jobs_from_mongo(limit=limit)
    return {"total": len(jobs), "jobs": jobs}


@app.get("/fetched-jobs/{source_id}", tags=["Fetched Jobs"])
async def get_single_job(source_id: str):
    """Get a single job from Redis/MongoDB (no API call)."""
    job = get_job_by_id(source_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@app.get("/cache-stats", tags=["Fetched Jobs"])
async def cache_stats():
    return get_redis_stats()


# ─── Recommendations ─────────────────────────────────────────────────────────

@app.get("/recommend", tags=["Recommendations"])
async def recommend_jobs(
    current_user: dict = Depends(get_current_user),
    limit: int = Query(default=5, le=10),
):
    """
    Recommend jobs for the logged-in user.
    Uses MongoDB-cached jobs only - ZERO JSearch API calls.
    """
    profile = user_info_collection.find_one({"email": current_user["email"]}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Upload your resume first")

    # Pull from MongoDB cache only - no JSearch API call
    available_jobs = get_all_jobs_from_mongo(limit=200)
    if not available_jobs:
        raise HTTPException(status_code=404, detail="No jobs in database yet. Use /fetched-jobs to populate first.")

    recommendations = get_job_recommendations(
        user_skills=profile.get("skills", []),
        user_experience=profile.get("experience", []),
        available_jobs=available_jobs,
        top_n=limit,
    )
    return {"recommendations": recommendations, "total_jobs_analyzed": len(available_jobs)}


# ─── Skill Gap ───────────────────────────────────────────────────────────────

@app.post("/skill-gap", tags=["Skill Gap"])
async def skill_gap(body: SkillGapRequest, current_user: dict = Depends(get_current_user)):
    """
    Analyze skill gap between user profile and a target job.
    Uses MongoDB for job lookup - ZERO JSearch API calls.
    """
    profile = user_info_collection.find_one({"email": current_user["email"]}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Upload your resume first")

    required_skills = body.required_skills or []

    # If job_id provided, pull required_skills from MongoDB
    if body.job_id and not required_skills:
        job = get_job_by_id(body.job_id)
        if job:
            required_skills = job.get("required_skills", [])

    analysis = analyze_skill_gap(
        user_skills=profile.get("skills", []),
        user_experience=profile.get("experience", []),
        target_job_title=body.target_job_title,
        required_skills=required_skills,
    )
    return analysis


@app.get("/health")
async def health():
    return {"status": "ok", "version": "2.0.0"}
