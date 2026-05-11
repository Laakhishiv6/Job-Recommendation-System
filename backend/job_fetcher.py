"""
job_fetcher.py  –  MongoDB-only cache pipeline (Redis removed)
"""

import os, re, html, hashlib, requests
from datetime import datetime
from dotenv import load_dotenv
from pymongo import MongoClient, UpdateOne
from pymongo.errors import BulkWriteError

load_dotenv()

# ─── MongoDB ──────────────────────────────────────────────────────────────────

MONGO_URI        = os.getenv("MONGO_URI", "mongodb://localhost:27017")
_mongo           = MongoClient(MONGO_URI)
_db              = _mongo["job_recommendation_db"]
fetched_jobs_col = _db["fetched_jobs"]

fetched_jobs_col.create_index("source_id", unique=True)
fetched_jobs_col.create_index("required_skills")
fetched_jobs_col.create_index("title")
fetched_jobs_col.create_index("apply_link")

# ─── JSearch config ───────────────────────────────────────────────────────────

RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY", "")
_HEADERS     = {
    "X-RapidAPI-Key":  RAPIDAPI_KEY,
    "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
}
SEARCH_URL  = "https://jsearch.p.rapidapi.com/search"
DETAILS_URL = "https://jsearch.p.rapidapi.com/job-details"


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _safe_id(raw: str) -> str:
    return hashlib.md5(raw.encode()).hexdigest()


def _clean(text) -> str | None:
    if not text:
        return None
    text = html.unescape(str(text))
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"[^\x00-\x7F]+", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip() or None


def _job_type(raw) -> str:
    if not raw:
        return "unknown"
    r = raw.lower()
    if "full" in r:                          return "full-time"
    if "part" in r:                          return "part-time"
    if "contract" in r or "freelance" in r:  return "contract"
    if "intern" in r:                        return "internship"
    if "remote" in r:                        return "remote"
    return r.strip()


def _salary(job: dict) -> str | None:
    lo, hi = job.get("job_min_salary"), job.get("job_max_salary")
    curr   = job.get("job_salary_currency", "USD")
    period = job.get("job_salary_period", "year")
    if lo and hi: return f"{curr} {int(lo):,} – {int(hi):,} / {period.lower()}"
    if lo:        return f"{curr} {int(lo):,}+ / {period.lower()}"
    return None


KNOWN_SKILLS = [
    "python","java","javascript","typescript","c++","c#","go","rust",
    "fastapi","django","flask","spring","react","angular","vue","node.js",
    "sql","mysql","postgresql","mongodb","elasticsearch",
    "docker","kubernetes","aws","azure","gcp","terraform","ansible",
    "git","linux","bash","rest api","graphql","kafka","spark",
    "machine learning","deep learning","nlp","tensorflow","pytorch",
    "scikit-learn","pandas","numpy","langchain","openai",
    "html","css","tailwind","next.js","express",
    "prometheus","grafana","jenkins","ci/cd",
    "cybersecurity","penetration testing","nmap","wireshark",
]

def _skills_from_desc(desc) -> list[str]:
    if not desc:
        return []
    low = desc.lower()
    found = []
    for s in KNOWN_SKILLS:
        if re.search(r'\b' + re.escape(s) + r'\b', low):
            found.append(s.title() if len(s) > 3 else s.upper())
    return list(dict.fromkeys(found))


# ─── JSearch calls ────────────────────────────────────────────────────────────

def _search(query: str, location: str, page: int) -> list[dict]:
    params = {
        "query":     f"{query} in {location}",
        "page":      str(page),
        "num_pages": "1",
        "date_posted": "all",
    }
    print(f"  [JSEARCH] page {page} – '{query}' in '{location}'")
    resp = requests.get(SEARCH_URL, headers=_HEADERS, params=params, timeout=15)
    resp.raise_for_status()
    data = resp.json().get("data", [])
    print(f"  [JSEARCH] got {len(data)} results")
    return data


def _details(job_id: str) -> dict | None:
    try:
        params = {"job_id": job_id, "extended_publisher_details": "false"}
        resp   = requests.get(DETAILS_URL, headers=_HEADERS, params=params, timeout=15)
        resp.raise_for_status()
        data = resp.json().get("data", [])
        return data[0] if data else None
    except requests.RequestException as e:
        print(f"  [WARN] detail fetch failed: {e}")
    return None


# ─── Preprocess ───────────────────────────────────────────────────────────────

def preprocess_job(raw: dict) -> dict | None:
    title   = _clean(raw.get("job_title"))
    company = _clean(raw.get("employer_name"))
    if not title or not company:
        return None

    raw_id = raw.get("job_id", "")
    if not raw_id:
        return None
    safe_id = _safe_id(raw_id)

    desc            = _clean(raw.get("job_description"))
    required_skills = raw.get("job_required_skills") or []
    if not required_skills:
        required_skills = _skills_from_desc(desc)

    city      = _clean(raw.get("job_city"))
    state     = _clean(raw.get("job_state"))
    country   = _clean(raw.get("job_country"))
    is_remote = raw.get("job_is_remote", False)
    location  = "Remote" if is_remote else ", ".join(filter(None, [city, state, country]))

    posted_raw = raw.get("job_posted_at_datetime_utc")
    try:
        posted_date = datetime.fromisoformat(
            posted_raw.replace("Z", "+00:00")
        ).strftime("%Y-%m-%d") if posted_raw else None
    except Exception:
        posted_date = None

    highlights = {}
    for section, items in (raw.get("job_highlights") or {}).items():
        if isinstance(items, list):
            highlights[section.lower()] = [_clean(i) for i in items if i]

    qualifications = raw.get("job_required_experience") or {}
    benefits       = raw.get("job_benefits") or []
    apply_link     = raw.get("job_apply_link") or raw.get("apply_link")

    return {
        "source_id":        safe_id,
        "source_id_raw":    raw_id,
        "source":           "jsearch",
        "title":            title,
        "company":          company,
        "description":      desc,
        "location":         location or "Not specified",
        "job_type":         _job_type(raw.get("job_employment_type")),
        "salary":           _salary(raw),
        "apply_link":       apply_link,
        "posted_date":      posted_date,
        "company_type":     _clean(raw.get("employer_company_type")),
        "company_website":  raw.get("employer_website"),
        "company_logo":     raw.get("employer_logo"),
        "required_skills":  required_skills,
        "highlights":       highlights,
        "qualifications":   qualifications,
        "benefits":         benefits,
        "experience_years": qualifications.get("required_experience_in_months", 0),
        "fetched_at":       datetime.utcnow().isoformat(),
    }


# ─── Store to MongoDB ─────────────────────────────────────────────────────────

def _store(jobs: list[dict]) -> dict:
    if not jobs:
        return {"mongo_upserted": 0, "mongo_modified": 0}

    seen = {}
    for j in jobs:
        seen[j["source_id"]] = j
    jobs = list(seen.values())

    ops = [UpdateOne({"source_id": j["source_id"]}, {"$set": j}, upsert=True) for j in jobs]
    try:
        result = fetched_jobs_col.bulk_write(ops, ordered=False)
        return {"mongo_upserted": result.upserted_count, "mongo_modified": result.modified_count}
    except BulkWriteError as bwe:
        errors = bwe.details.get("writeErrors", [])
        print(f"  [MONGO] {len(errors)} write errors (partial write ok)")
        return {
            "mongo_upserted": bwe.details.get("nUpserted", 0),
            "mongo_modified": bwe.details.get("nModified", 0),
            "errors":         len(errors),
        }
    except Exception as e:
        print(f"  [MONGO ERROR] {e}")
        return {"mongo_upserted": 0, "mongo_modified": 0}


# ─── Public API ───────────────────────────────────────────────────────────────

def fetch_and_cache_jobs(
    query: str,
    location: str = "remote",
    num_pages: int = 1,
    force_refresh: bool = False,
    fetch_details: bool = False,
) -> dict:
    if not RAPIDAPI_KEY:
        raise ValueError("RAPIDAPI_KEY not set in .env")

    all_cleaned  = []
    total_stored = {"mongo_upserted": 0, "mongo_modified": 0}
    skipped      = 0

    for page in range(1, num_pages + 1):
        # MongoDB cache hit (skip API call if not forced)
        if not force_refresh:
            mongo_cached = list(fetched_jobs_col.find(
                {"title": {"$regex": query, "$options": "i"}},
                {"_id": 0}
            ).limit(10 * num_pages))
            if mongo_cached:
                all_cleaned.extend(mongo_cached)
                print(f"  [MONGO HIT] page {page} – {len(mongo_cached)} jobs")
                continue

        # JSearch API call
        try:
            raw_jobs = _search(query, location, page)
        except requests.RequestException as e:
            print(f"  [ERROR] Search page {page}: {e}")
            break

        page_clean = []
        for raw in raw_jobs:
            job_id = raw.get("job_id")
            if fetch_details and job_id:
                detail = _details(job_id)
                merged = {**raw, **detail} if detail else raw
            else:
                merged = raw
            cleaned = preprocess_job(merged)
            if cleaned:
                page_clean.append(cleaned)
            else:
                skipped += 1

        sr = _store(page_clean)
        for k in total_stored:
            total_stored[k] += sr.get(k, 0)
        all_cleaned.extend(page_clean)

    if force_refresh and all_cleaned:
        fresh_ids = {j["source_id"] for j in all_cleaned}
        fetched_jobs_col.delete_many({"source": "jsearch", "source_id": {"$nin": list(fresh_ids)}})
        print(f"  [MONGO SYNC] Replaced jsearch jobs with {len(fresh_ids)} fresh.")

    mongo_total = fetched_jobs_col.count_documents({})
    return {
        "query":         query,
        "location":      location,
        "total_fetched": len(all_cleaned) + skipped,
        "total_stored":  len(all_cleaned),
        "skipped":       skipped,
        "storage": {
            "mongo_new_upserted": total_stored["mongo_upserted"],
            "mongo_updated":      total_stored["mongo_modified"],
            "mongo_total_in_db":  mongo_total,
        },
    }


def bulk_fetch_jobs(queries, num_pages=1, force_refresh=False, fetch_details=False):
    total_stored = total_fetched = 0
    breakdown = []
    for item in queries:
        q = item.get("query", "")
        l = item.get("location", "remote")
        result = fetch_and_cache_jobs(q, l, num_pages, force_refresh, fetch_details)
        total_stored  += result["total_stored"]
        total_fetched += result["total_fetched"]
        breakdown.append({"query": q, "location": l,
                          "stored": result["total_stored"],
                          "mongo_new": result["storage"]["mongo_new_upserted"]})
    return {
        "total_queries": len(queries),
        "total_fetched": total_fetched,
        "total_stored":  total_stored,
        "mongo_total":   fetched_jobs_col.count_documents({}),
        "breakdown":     breakdown,
    }


def get_all_jobs_from_mongo(limit: int = 200) -> list[dict]:
    return list(fetched_jobs_col.find({}, {"_id": 0}).limit(limit))


def get_job_by_id(source_id: str) -> dict | None:
    job = fetched_jobs_col.find_one({"source_id": source_id}, {"_id": 0})
    if job:
        return job
    try:
        from bson import ObjectId
        return fetched_jobs_col.find_one({"_id": ObjectId(source_id)}, {"_id": 0})
    except Exception:
        return None


def get_db_stats() -> dict:
    return {"mongo_total_jobs": fetched_jobs_col.count_documents({})}


# ─── Shared result builder ─────────────────────────────────────────────────────

def _source_result(source: str, query: str, total_raw: int, cleaned: list, storage: dict) -> dict:
    return {
        "source":        source,
        "query":         query,
        "total_fetched": total_raw,
        "total_stored":  len(cleaned),
        "storage": {
            "mongo_new_upserted": storage.get("mongo_upserted", 0),
            "mongo_updated":      storage.get("mongo_modified", 0),
            "mongo_total_in_db":  fetched_jobs_col.count_documents({}),
        },
    }


# ─── Remotive (free, no key) ───────────────────────────────────────────────────

def _preprocess_remotive(raw: dict) -> dict | None:
    title   = _clean(raw.get("title"))
    company = _clean(raw.get("company_name"))
    if not title or not company:
        return None
    job_id = str(raw.get("id", ""))
    if not job_id:
        return None
    safe_id = _safe_id(f"remotive_{job_id}")
    desc    = _clean(raw.get("description"))
    tags    = [t.strip() for t in (raw.get("tags") or []) if t]
    skills  = tags if tags else _skills_from_desc(desc)
    return {
        "source_id":       safe_id,
        "source_id_raw":   job_id,
        "source":          "remotive",
        "title":           title,
        "company":         company,
        "description":     desc,
        "location":        _clean(raw.get("candidate_required_location")) or "Remote",
        "job_type":        _job_type(raw.get("job_type", "")),
        "salary":          _clean(raw.get("salary")) or None,
        "apply_link":      raw.get("url"),
        "posted_date":     (raw.get("publication_date") or "")[:10] or None,
        "company_logo":    raw.get("company_logo_url"),
        "required_skills": skills[:15],
        "highlights":      {}, "qualifications": {}, "benefits": [],
        "fetched_at":      datetime.utcnow().isoformat(),
    }


def fetch_remotive(search: str = "developer", num_pages: int = 2, force_refresh: bool = False) -> dict:
    print(f"  [REMOTIVE] search='{search}'")
    try:
        resp = requests.get(
            "https://remotive.com/api/remote-jobs",
            params={"search": search, "limit": 50 * num_pages},
            timeout=15,
        )
        resp.raise_for_status()
        raw_jobs = resp.json().get("jobs", [])
    except requests.RequestException as e:
        raise RuntimeError(f"Remotive API error: {e}")
    print(f"  [REMOTIVE] got {len(raw_jobs)} jobs")
    cleaned = [j for j in (_preprocess_remotive(r) for r in raw_jobs) if j]
    if force_refresh:
        fresh = {j["source_id"] for j in cleaned}
        fetched_jobs_col.delete_many({"source": "remotive", "source_id": {"$nin": list(fresh)}})
    return _source_result("remotive", search, len(raw_jobs), cleaned, _store(cleaned))


# ─── Arbeitnow (free, no key) ─────────────────────────────────────────────────

def _preprocess_arbeitnow(raw: dict) -> dict | None:
    title   = _clean(raw.get("title"))
    company = _clean(raw.get("company_name"))
    if not title or not company:
        return None
    slug = raw.get("slug", "")
    if not slug:
        return None
    safe_id  = _safe_id(f"arbeitnow_{slug}")
    desc     = _clean(raw.get("description"))
    tags     = [t.strip() for t in (raw.get("tags") or []) if t]
    skills   = tags if tags else _skills_from_desc(desc)
    location = _clean(raw.get("location")) or "Remote"
    if raw.get("remote"):
        location = "Remote"
    job_types   = raw.get("job_types") or []
    posted_date = None
    try:
        ts = raw.get("created_at")
        if ts:
            posted_date = datetime.fromtimestamp(int(ts)).strftime("%Y-%m-%d")
    except Exception:
        pass
    return {
        "source_id":       safe_id,
        "source_id_raw":   slug,
        "source":          "arbeitnow",
        "title":           title,
        "company":         company,
        "description":     desc,
        "location":        location,
        "job_type":        _job_type(job_types[0] if job_types else ""),
        "salary":          None,
        "apply_link":      raw.get("url"),
        "posted_date":     posted_date,
        "company_logo":    None,
        "required_skills": skills[:15],
        "highlights":      {}, "qualifications": {}, "benefits": [],
        "fetched_at":      datetime.utcnow().isoformat(),
    }


def fetch_arbeitnow(num_pages: int = 2, force_refresh: bool = False) -> dict:
    all_cleaned: list[dict] = []
    total_raw = 0
    for page in range(1, num_pages + 1):
        print(f"  [ARBEITNOW] page {page}")
        try:
            resp = requests.get(
                "https://www.arbeitnow.com/api/job-board-api",
                params={"page": page},
                timeout=15,
            )
            resp.raise_for_status()
        except requests.RequestException as e:
            print(f"  [ARBEITNOW] error page {page}: {e}")
            break
        raw_jobs = resp.json().get("data", [])
        total_raw += len(raw_jobs)
        all_cleaned.extend(j for j in (_preprocess_arbeitnow(r) for r in raw_jobs) if j)
    print(f"  [ARBEITNOW] total raw={total_raw}, cleaned={len(all_cleaned)}")
    if force_refresh:
        fresh = {j["source_id"] for j in all_cleaned}
        fetched_jobs_col.delete_many({"source": "arbeitnow", "source_id": {"$nin": list(fresh)}})
    return _source_result("arbeitnow", "all", total_raw, all_cleaned, _store(all_cleaned))


# ─── The Muse (free, no key) ──────────────────────────────────────────────────

def _muse_category(query: str) -> str:
    q = query.lower()
    if any(w in q for w in ["data", "machine learning", "ml", "analytics", "science", "analyst"]):
        return "Data Science"
    if any(w in q for w in ["design", "ui", "ux"]):
        return "Design"
    if any(w in q for w in ["product", "pm"]):
        return "Product"
    return "Engineering"


def _preprocess_themuse(raw: dict) -> dict | None:
    title   = _clean(raw.get("name"))
    company = _clean((raw.get("company") or {}).get("name"))
    if not title or not company:
        return None
    job_id = str(raw.get("id", ""))
    if not job_id:
        return None
    safe_id  = _safe_id(f"themuse_{job_id}")
    desc     = _clean(raw.get("contents"))
    skills   = _skills_from_desc(desc)
    locs     = raw.get("locations") or []
    location = locs[0].get("name", "Not specified") if locs else "Not specified"
    levels   = raw.get("levels") or []
    level    = (levels[0].get("short_name") or "").lower() if levels else ""
    apply    = (raw.get("refs") or {}).get("landing_page")
    pub_date = (raw.get("publication_date") or "")[:10] or None
    logo     = ((raw.get("company") or {}).get("refs") or {}).get("logo_image")
    return {
        "source_id":       safe_id,
        "source_id_raw":   job_id,
        "source":          "themuse",
        "title":           title,
        "company":         company,
        "description":     desc,
        "location":        location,
        "job_type":        level or "unknown",
        "salary":          None,
        "apply_link":      apply,
        "posted_date":     pub_date,
        "company_logo":    logo,
        "required_skills": skills[:15],
        "highlights":      {}, "qualifications": {}, "benefits": [],
        "fetched_at":      datetime.utcnow().isoformat(),
    }


def fetch_themuse(query: str = "software developer", num_pages: int = 2, force_refresh: bool = False) -> dict:
    category    = _muse_category(query)
    all_cleaned: list[dict] = []
    total_raw   = 0
    for page in range(0, num_pages):
        print(f"  [THEMUSE] page {page}, category={category}")
        try:
            resp = requests.get(
                "https://www.themuse.com/api/public/jobs",
                params={"page": page, "category": category},
                timeout=15,
            )
            resp.raise_for_status()
        except requests.RequestException as e:
            print(f"  [THEMUSE] error page {page}: {e}")
            break
        results = resp.json().get("results", [])
        total_raw += len(results)
        all_cleaned.extend(j for j in (_preprocess_themuse(r) for r in results) if j)
    print(f"  [THEMUSE] total raw={total_raw}, cleaned={len(all_cleaned)}")
    if force_refresh:
        fresh = {j["source_id"] for j in all_cleaned}
        fetched_jobs_col.delete_many({"source": "themuse", "source_id": {"$nin": list(fresh)}})
    return _source_result("themuse", query, total_raw, all_cleaned, _store(all_cleaned))


# ─── Dispatcher ───────────────────────────────────────────────────────────────

def fetch_from_source(
    source: str,
    query: str = "software developer",
    location: str = "remote",
    num_pages: int = 2,
    force_refresh: bool = False,
) -> dict:
    if source == "remotive":
        return fetch_remotive(search=query, num_pages=num_pages, force_refresh=force_refresh)
    if source == "arbeitnow":
        return fetch_arbeitnow(num_pages=num_pages, force_refresh=force_refresh)
    if source == "themuse":
        return fetch_themuse(query=query, num_pages=num_pages, force_refresh=force_refresh)
    if source == "all_free":
        results = []
        for fn, kw in [
            (fetch_remotive,  {"search":     query,  "num_pages": num_pages, "force_refresh": force_refresh}),
            (fetch_arbeitnow, {"num_pages":  num_pages, "force_refresh": force_refresh}),
            (fetch_themuse,   {"query":      query,  "num_pages": num_pages, "force_refresh": force_refresh}),
        ]:
            try:
                results.append(fn(**kw))
            except Exception as e:
                print(f"  [WARN] {fn.__name__} failed: {e}")
        mongo_total = fetched_jobs_col.count_documents({})
        return {
            "source":        "all_free",
            "query":         query,
            "total_fetched": sum(r.get("total_fetched", 0) for r in results),
            "total_stored":  sum(r.get("total_stored",  0) for r in results),
            "sources":       results,
            "storage": {
                "mongo_new_upserted": sum(r["storage"].get("mongo_new_upserted", 0) for r in results),
                "mongo_updated":      sum(r["storage"].get("mongo_updated",      0) for r in results),
                "mongo_total_in_db":  mongo_total,
            },
        }
    return fetch_and_cache_jobs(query, location, num_pages, force_refresh)
