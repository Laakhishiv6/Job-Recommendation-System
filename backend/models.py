from pydantic import BaseModel
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
    apply_link: Optional[str] = None
    posted_date: Optional[str] = None


class SkillGapRequest(BaseModel):
    target_job_title: str
    required_skills: Optional[List[str]] = []
    job_id: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class AdminPasswordReset(BaseModel):
    new_password: str


class AdminFetchRequest(BaseModel):
    source: str = "all_free"   # all_free | remotive | arbeitnow | themuse | jsearch
    query: str = "software developer"
    location: str = "remote"
    num_pages: int = 2
    force_refresh: bool = True


class ProjectIdeasRequest(BaseModel):
    target_job_title: str
    required_skills: Optional[List[str]] = []
    missing_skills: Optional[List[str]] = []
    job_id: Optional[str] = None
