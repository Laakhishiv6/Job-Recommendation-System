"""
job_fetcher.py
──────────────
Cache-first pipeline: Redis → MongoDB → JSearch API (last resort)

Key optimisations vs original:
  1. fetch_details=False by default  (halves API calls)
  2. MongoDB-first retrieval         (zero API calls on warm cache)
  3. apply_link always preserved     (stored & returned)
  4. Dedup by source_id before bulk-write (avoids write errors)
  5. Single Redis TTL constant       (6 hours)
"""

import os, re, json, html, hashlib, requests
from datetime import datetime
from dotenv import load_dotenv
from pymongo import MongoClient, UpdateOne
from pymongo.errors import BulkWriteError

load_dotenv()

# ─── Connections ─────────────────────────────────────────────────────────────

MONGO_URI         = os.getenv("MONGO_URI", "mongodb://localhost:27017")
_mongo            = MongoClient(MONGO_URI)
_db               = _mongo["job_recommendation_db"]
fetched_jobs_col  = _db["fetched_jobs"]

fetched_jobs_col.create_index("source_id", unique=True)
fetched_jobs_col.create_index("required_skills")
fetched_jobs_col.create_index("title")
fetched_jobs_col.create_index("apply_link")

# Optional Redis – gracefully disabled if not running
try:
    import redis as _redis_lib
    _redis = _redis_lib.Redis(
        host=os.getenv("REDIS_HOST", "localhost"),
        port=int(os.getenv("REDIS_PORT", 6379)),
        db=0, decode_responses=True,
        socket_connect_timeout=2,
    )
    _redis.ping()
    REDIS_OK = True
    print("[REDIS] connected")
except Exception as e:
    _redis   = None
    REDIS_OK = False
    print(f"[REDIS] not available ({e}) – using MongoDB-only cache")

CACHE_TTL = 60 * 60 * 6   # 6 hours

# ─── JSearch config ──────────────────────────────────────────────────────────

RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY", "")
_HEADERS     = {
    "X-RapidAPI-Key":  RAPIDAPI_KEY,
    "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
}
SEARCH_URL  = "https://jsearch.p.rapidapi.com/search"
DETAILS_URL = "https://jsearch.p.rapidapi.com/job-details"


# ─── Redis helpers ───────────────────────────────────────────────────────────

def _rget(key: str):
    if not REDIS_OK:
        return None
    try:
        return _redis.get(key)
    except Exception:
        return None


def _rset(key: str, value: str):
    if not REDIS_OK:
        return
    try:
        _redis.setex(key, CACHE_TTL, value)
    except Exception:
        pass


# ─── Cleaning helpers ────────────────────────────────────────────────────────

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
    lo, hi   = job.get("job_min_salary"), job.get("job_max_salary")
    curr     = job.get("job_salary_currency", "USD")
    period   = job.get("job_salary_period", "year")
    if lo and hi:  return f"{curr} {int(lo):,} – {int(hi):,} / {period.lower()}"
    if lo:         return f"{curr} {int(lo):,}+ / {period.lower()}"
    return None


KNOWN_SKILLS = [
    "python","java","javascript","typescript","c++","c#","go","rust",
    "fastapi","django","flask","spring","react","angular","vue","node.js",
    "sql","mysql","postgresql","mongodb","redis","elasticsearch",
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


# ─── Step 1 – Search ─────────────────────────────────────────────────────────

def _search(query: str, location: str, page: int) -> list[dict]:
    params = {
        "query":     f"{query} in {location}",
        "page":      str(page),
        "num_pages": "1",
        "date_posted": "all",
    }
    print(f"  [JSEARCH SEARCH] page {page} – '{query}' in '{location}'")
    resp = requests.get(SEARCH_URL, headers=_HEADERS, params=params, timeout=15)
    resp.raise_for_status()
    data = resp.json().get("data", [])
    print(f"  [JSEARCH SEARCH] got {len(data)} results")
    return data


# ─── Step 2 – Details (optional) ─────────────────────────────────────────────

def _details(job_id: str) -> dict | None:
    safe      = _safe_id(job_id)
    cache_key = f"job_detail:{safe}"
    cached    = _rget(cache_key)
    if cached:
        return json.loads(cached)
    try:
        params = {"job_id": job_id, "extended_publisher_details": "false"}
        resp   = requests.get(DETAILS_URL, headers=_HEADERS, params=params, timeout=15)
        resp.raise_for_status()
        data = resp.json().get("data", [])
        if data:
            detail = data[0]
            _rset(cache_key, json.dumps(detail))
            return detail
    except requests.RequestException as e:
        print(f"  [WARN] detail fetch failed: {e}")
    return None


# ─── Step 3 – Preprocess ─────────────────────────────────────────────────────

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

    highlights     = {}
    for section, items in (raw.get("job_highlights") or {}).items():
        if isinstance(items, list):
            highlights[section.lower()] = [_clean(i) for i in items if i]

    qualifications = raw.get("job_required_experience") or {}
    benefits       = raw.get("job_benefits") or []

    # ← apply_link is always preserved
    apply_link = raw.get("job_apply_link") or raw.get("apply_link")

    return {
        "source_id":           safe_id,
        "source_id_raw":       raw_id,
        "source":              "jsearch",
        "title":               title,
        "company":             company,
        "description":         desc,
        "location":            location or "Not specified",
        "job_type":            _job_type(raw.get("job_employment_type")),
        "salary":              _salary(raw),
        "apply_link":          apply_link,          # ← always stored
        "posted_date":         posted_date,
        "company_type":        _clean(raw.get("employer_company_type")),
        "company_website":     raw.get("employer_website"),
        "company_logo":        raw.get("employer_logo"),
        "required_skills":     required_skills,
        "highlights":          highlights,
        "qualifications":      qualifications,
        "benefits":            benefits,
        "experience_years":    qualifications.get("required_experience_in_months", 0),
        "fetched_at":          datetime.utcnow().isoformat(),
    }


# ─── Step 4 – Store ──────────────────────────────────────────────────────────

def _store(jobs: list[dict], query: str, location: str, page: int) -> dict:
    if not jobs:
        return {"redis": 0, "mongo_upserted": 0, "mongo_modified": 0}

    # Dedup by source_id before writing
    seen = {}
    for j in jobs:
        seen[j["source_id"]] = j
    jobs = list(seen.values())

    page_key = f"jobs_page:{hashlib.md5(f'{query}|{location}|{page}'.lower().encode()).hexdigest()}"
    _rset(page_key, json.dumps(jobs))
    for job in jobs:
        _rset(f"job:{job['source_id']}", json.dumps(job))

    ops = [
        UpdateOne({"source_id": j["source_id"]}, {"$set": j}, upsert=True)
        for j in jobs
    ]
    try:
        result = fetched_jobs_col.bulk_write(ops, ordered=False)
        return {
            "redis":          len(jobs),
            "mongo_upserted": result.upserted_count,
            "mongo_modified": result.modified_count,
        }
    except BulkWriteError as bwe:
        errors = bwe.details.get("writeErrors", [])
        print(f"  [MONGO] {len(errors)} write errors (partial write ok)")
        return {
            "redis":          len(jobs),
            "mongo_upserted": bwe.details.get("nUpserted", 0),
            "mongo_modified": bwe.details.get("nModified", 0),
            "errors":         len(errors),
        }
    except Exception as e:
        print(f"  [MONGO ERROR] {e}")
        return {"redis": len(jobs), "mongo_upserted": 0, "mongo_modified": 0}


# ─── Public API ──────────────────────────────────────────────────────────────

def fetch_and_cache_jobs(
    query: str,
    location: str = "remote",
    num_pages: int = 1,
    force_refresh: bool = False,
    fetch_details: bool = False,   # OFF by default – saves API calls
) -> dict:
    if not RAPIDAPI_KEY:
        raise ValueError("RAPIDAPI_KEY not set in .env")

    all_cleaned  = []
    total_stored = {"redis": 0, "mongo_upserted": 0, "mongo_modified": 0}
    skipped      = 0

    for page in range(1, num_pages + 1):
        page_key = f"jobs_page:{hashlib.md5(f'{query}|{location}|{page}'.lower().encode()).hexdigest()}"

        # 1. Redis cache hit
        if not force_refresh:
            cached_r = _rget(page_key)
            if cached_r:
                cached = json.loads(cached_r)
                all_cleaned.extend(cached)
                print(f"  [REDIS HIT] page {page} – {len(cached)} jobs")
                continue

        # 2. MongoDB cache hit (Redis miss)
        if not force_refresh:
            mongo_cached = list(fetched_jobs_col.find(
                {"title": {"$regex": query, "$options": "i"}},
                {"_id": 0}
            ).limit(10 * num_pages))
            if mongo_cached:
                all_cleaned.extend(mongo_cached)
                _rset(page_key, json.dumps(mongo_cached))
                print(f"  [MONGO HIT] page {page} – {len(mongo_cached)} jobs")
                continue

        # 3. JSearch API call (last resort)
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

        sr = _store(page_clean, query, location, page)
        for k in total_stored:
            total_stored[k] += sr.get(k, 0)
        all_cleaned.extend(page_clean)

    # ── When force_refresh=True, wipe DB and replace with fresh results ───
    if force_refresh and all_cleaned:
        fresh_ids = {j["source_id"] for j in all_cleaned}
        fetched_jobs_col.delete_many({"source_id": {"$nin": list(fresh_ids)}})
        print(f"  [MONGO SYNC] Replaced DB with {len(fresh_ids)} fresh jobs.")

    mongo_total = fetched_jobs_col.count_documents({})
    return {
        "query":         query,
        "location":      location,
        "total_fetched": len(all_cleaned) + skipped,
        "total_stored":  len(all_cleaned),
        "skipped":       skipped,
        "storage": {
            "redis_keys_written": total_stored["redis"],
            "mongo_new_upserted": total_stored["mongo_upserted"],
            "mongo_updated":      total_stored["mongo_modified"],
            "mongo_total_in_db":  mongo_total,
        },
        "cache_ttl_hours": CACHE_TTL // 3600,
        "sample": all_cleaned[:2],
    }


def bulk_fetch_jobs(
    queries: list[dict],
    num_pages: int = 1,
    force_refresh: bool = False,
    fetch_details: bool = False,
) -> dict:
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
    mongo_total = fetched_jobs_col.count_documents({})
    return {
        "total_queries":  len(queries),
        "total_fetched":  total_fetched,
        "total_stored":   total_stored,
        "mongo_total":    mongo_total,
        "breakdown":      breakdown,
    }


def get_all_jobs_from_mongo(limit: int = 200) -> list[dict]:
    return list(fetched_jobs_col.find({}, {"_id": 0}).limit(limit))


def get_job_by_id(source_id: str) -> dict | None:
    cached = _rget(f"job:{source_id}")
    if cached:
        return json.loads(cached)
    job = fetched_jobs_col.find_one({"source_id": source_id}, {"_id": 0})
    if job:
        return job
    try:
        from bson import ObjectId
        job = fetched_jobs_col.find_one({"_id": ObjectId(source_id)}, {"_id": 0})
        if job:
            return job
    except Exception:
        pass
    return None


def get_redis_stats() -> dict:
    redis_keys = 0
    if REDIS_OK:
        try:
            redis_keys = _redis.dbsize()
        except Exception:
            pass
    return {
        "redis_available":  REDIS_OK,
        "redis_total_keys": redis_keys,
        "mongo_total_jobs": fetched_jobs_col.count_documents({}),
    }
