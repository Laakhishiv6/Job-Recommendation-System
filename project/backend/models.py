from pydantic import BaseModel, EmailStr
from typing import Optional, List


class UserSignup(BaseModel):
    name: str
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class VerifyEmailRequest(BaseModel):
    email: str
    code: str


class JobPosting(BaseModel):
    title: str
    company: str
    location: Optional[str] = None
    job_type: Optional[str] = None
    description: Optional[str] = None
    required_skills: List[str] = []
    salary: Optional[str] = None
    apply_link: Optional[str] = None       # ← apply link field
    posted_date: Optional[str] = None


class SkillGapRequest(BaseModel):
    target_job_title: str
    required_skills: Optional[List[str]] = []
    job_id: Optional[str] = None           # look up from MongoDB
