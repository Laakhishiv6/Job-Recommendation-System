from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from bson import ObjectId
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
import os, shutil, re, fitz
from pathlib import Path

from db import users_collection, user_info_collection, jobs_collection, pending_verifications_collection
from models import UserSignup, UserLogin, JobPosting, SkillGapRequest, VerifyEmailRequest, AdminPasswordReset, AdminFetchRequest, ChangePasswordRequest, ProjectIdeasRequest
from auth import hash_password, verify_password, create_access_token, get_current_user, get_admin_user
from ai_engine import parse_resume_llm, get_job_recommendations, analyze_skill_gap, generate_project_ideas
from job_fetcher import fetch_and_cache_jobs, bulk_fetch_jobs, get_all_jobs_from_mongo, get_job_by_id, get_db_stats, fetched_jobs_col, fetch_from_source
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


# ─── Startup: seed default admin account ─────────────────────────────────────

@app.on_event("startup")
async def seed_admin():
    admin_email    = os.getenv("ADMIN_EMAIL",    "admin@admin.com")
    admin_password = os.getenv("ADMIN_PASSWORD", "admin")
    if not users_collection.find_one({"email": admin_email}):
        users_collection.insert_one({
            "name":     "Admin",
            "email":    admin_email,
            "password": hash_password(admin_password),
            "role":     "admin",
        })
        print(f"[startup] Admin account created: {admin_email}")


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
        "name":     pending["name"],
        "email":    pending["email"],
        "password": pending["password_hash"],
        "role":     "user",
    })
    pending_verifications_collection.delete_one({"email": data.email})

    return {"message": "Account created successfully! You can now sign in."}


@app.post("/login", tags=["Auth"])
async def login(user: UserLogin):
    db_user = users_collection.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    role  = db_user.get("role", "user")
    token = create_access_token({"sub": user.email, "role": role})
    return {"access_token": token, "token_type": "bearer", "role": role}


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
                "name":       parsed.get("name"),
                "phone":      parsed.get("phone"),
                "skills":     parsed.get("skills", []),
                "education":  parsed.get("education", []),
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


# ─── Account ─────────────────────────────────────────────────────────────────

@app.post("/change-password", tags=["Auth"])
async def change_password(body: ChangePasswordRequest, current_user: dict = Depends(get_current_user)):
    if len(body.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    db_user = users_collection.find_one({"email": current_user["email"]})
    if not db_user or not verify_password(body.current_password, db_user["password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    users_collection.update_one(
        {"email": current_user["email"]},
        {"$set": {"password": hash_password(body.new_password)}}
    )
    return {"message": "Password changed successfully"}


@app.delete("/delete-account", tags=["Auth"])
async def delete_account(current_user: dict = Depends(get_current_user)):
    email = current_user["email"]
    users_collection.delete_one({"email": email})
    user_info_collection.delete_one({"email": email})
    return {"message": "Account deleted"}


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
    fetch_details: bool = False,
):
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
    result = bulk_fetch_jobs(
        queries=body.queries,
        num_pages=body.num_pages,
        force_refresh=body.force_refresh,
        fetch_details=body.fetch_details,
    )
    return result


@app.get("/fetched-jobs/all", tags=["Fetched Jobs"])
async def all_fetched_jobs(limit: int = Query(default=100, le=500)):
    jobs = get_all_jobs_from_mongo(limit=limit)
    return {"total": len(jobs), "jobs": jobs}


@app.get("/fetched-jobs/{source_id}", tags=["Fetched Jobs"])
async def get_single_job(source_id: str):
    job = get_job_by_id(source_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@app.get("/cache-stats", tags=["Fetched Jobs"])
async def cache_stats():
    return get_db_stats()


# ─── Recommendations ─────────────────────────────────────────────────────────

@app.get("/recommend", tags=["Recommendations"])
async def recommend_jobs(
    current_user: dict = Depends(get_current_user),
    limit: int = Query(default=5, le=10),
):
    profile = user_info_collection.find_one({"email": current_user["email"]}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Upload your resume first")

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
    profile = user_info_collection.find_one({"email": current_user["email"]}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Upload your resume first")

    required_skills = body.required_skills or []

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


# ─── Project Ideas ───────────────────────────────────────────────────────────

@app.post("/project-ideas", tags=["Project Ideas"])
async def project_ideas(body: ProjectIdeasRequest, current_user: dict = Depends(get_current_user)):
    profile = user_info_collection.find_one({"email": current_user["email"]}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Upload your resume first")

    required_skills = body.required_skills or []
    missing_skills  = body.missing_skills  or []

    if body.job_id and not required_skills:
        job = get_job_by_id(body.job_id)
        if job:
            required_skills = job.get("required_skills", [])

    result = generate_project_ideas(
        user_skills=profile.get("skills", []),
        user_experience=profile.get("experience", []),
        user_education=profile.get("education", []),
        target_job_title=body.target_job_title,
        required_skills=required_skills,
        missing_skills=missing_skills,
    )
    return result


# ─── Admin ───────────────────────────────────────────────────────────────────

@app.get("/admin/stats", tags=["Admin"])
async def admin_stats(admin: dict = Depends(get_admin_user)):
    total_users    = users_collection.count_documents({"role": {"$ne": "admin"}})
    total_profiles = user_info_collection.count_documents({})
    db             = get_db_stats()
    return {
        "total_users":    total_users,
        "total_profiles": total_profiles,
        "total_jobs":     db.get("mongo_total_jobs", 0),
    }


@app.get("/admin/overview", tags=["Admin"])
async def admin_overview(admin: dict = Depends(get_admin_user)):
    # Users (excluding admin)
    users = list(users_collection.find(
        {"role": {"$ne": "admin"}},
        {"_id": 0, "password": 0}
    ))
    enriched_users = []
    for u in users:
        profile = user_info_collection.find_one({"email": u["email"]}, {"_id": 0})
        enriched_users.append({
            "name":           u.get("name", "—"),
            "email":          u["email"],
            "has_profile":    profile is not None,
            "skills_count":   len(profile.get("skills", [])) if profile else 0,
            "skills":         profile.get("skills", []) if profile else [],
            "experience":     profile.get("experience", []) if profile else [],
            "education":      profile.get("education", []) if profile else [],
            "phone":          profile.get("phone") if profile else None,
        })

    # Jobs (recent 50, lightweight — skip heavy fields)
    jobs_cursor = list(
        fetched_jobs_col
            .find({}, {"_id": 0, "description": 0, "highlights": 0, "qualifications": 0, "benefits": 0})
            .sort("fetched_at", -1)
            .limit(50)
    )
    total_jobs = fetched_jobs_col.count_documents({})

    return {
        "stats": {
            "total_users":        len(users),
            "users_with_resume":  sum(1 for u in enriched_users if u["has_profile"]),
            "users_no_resume":    sum(1 for u in enriched_users if not u["has_profile"]),
            "total_jobs":         total_jobs,
        },
        "users": enriched_users,
        "recent_jobs": jobs_cursor,
    }


@app.get("/admin/users", tags=["Admin"])
async def admin_list_users(admin: dict = Depends(get_admin_user)):
    users = list(users_collection.find(
        {"role": {"$ne": "admin"}},
        {"_id": 0, "password": 0}
    ))
    result = []
    for u in users:
        profile = user_info_collection.find_one({"email": u["email"]}, {"_id": 0})
        result.append({
            **u,
            "has_profile":   profile is not None,
            "skills_count":  len(profile.get("skills", [])) if profile else 0,
            "skills_preview": (profile.get("skills", [])[:5] if profile else []),
        })
    return {"users": result, "total": len(result)}


@app.get("/admin/users/{email}/profile", tags=["Admin"])
async def admin_get_user_profile(email: str, admin: dict = Depends(get_admin_user)):
    profile = user_info_collection.find_one({"email": email}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="No profile found for this user")
    return {"profile": profile}


@app.delete("/admin/users/{email}", tags=["Admin"])
async def admin_delete_user(email: str, admin: dict = Depends(get_admin_user)):
    if email == admin["email"]:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")
    r = users_collection.delete_one({"email": email, "role": {"$ne": "admin"}})
    user_info_collection.delete_one({"email": email})
    if r.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": f"User {email} deleted successfully"}


@app.post("/admin/users/{email}/reset-password", tags=["Admin"])
async def admin_reset_password(email: str, body: AdminPasswordReset, admin: dict = Depends(get_admin_user)):
    if len(body.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    result = users_collection.update_one(
        {"email": email, "role": {"$ne": "admin"}},
        {"$set": {"password": hash_password(body.new_password)}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": f"Password reset successfully for {email}"}


@app.post("/admin/fetch-jobs", tags=["Admin"])
async def admin_fetch_jobs(body: AdminFetchRequest, admin: dict = Depends(get_admin_user)):
    try:
        return fetch_from_source(
            source=body.source,
            query=body.query,
            location=body.location,
            num_pages=body.num_pages,
            force_refresh=body.force_refresh,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {"status": "ok", "version": "2.0.0"}
