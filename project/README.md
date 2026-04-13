# CareerLens – Job Recommendation System

## Project Structure
```
project/
├── backend/        FastAPI Python backend
└── frontend/       React frontend
```

---

## PREREQUISITES

- Python 3.11+
- Node.js 18+
- MongoDB running on localhost:27017
- (Optional) Redis on localhost:6379 — app works without it, just slower cache

---

## BACKEND SETUP

### 1. Navigate to backend
```bash
cd backend
```

### 2. Create virtual environment
```bash
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure environment
Edit `.env` and fill in your keys:
```
GROQ_API_KEY=your_groq_api_key        # https://console.groq.com
JWT_SECRET_KEY=change_this_secret
RAPIDAPI_KEY=your_rapidapi_key         # https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
MONGO_URI=mongodb://localhost:27017
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 5. Start MongoDB
```bash
# Windows (if installed as service): net start MongoDB
# Mac: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

### 6. Run backend
```bash
uvicorn main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

---

## FRONTEND SETUP

### 1. Navigate to frontend
```bash
cd frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start dev server
```bash
npm start
```

App opens at: http://localhost:3000

---

## USAGE FLOW

1. **Sign up** at /signup → **Log in** at /login
2. **Upload Resume** at /profile → AI parses your PDF and stores your skills
3. **Browse Jobs** at /jobs → Search to populate MongoDB cache (first time calls JSearch API, subsequent calls are free from cache)
4. **Recommendations** at /recommend → AI matches your profile to cached jobs (zero API calls)
5. **Skill Gap** at /skill-gap → Click "Analyse skill gap" on any job card, or enter a custom title

---

## API OPTIMIZATION — HOW IT WORKS

The original code called JSearch on every request. This version:

| Operation | JSearch calls |
|-----------|--------------|
| First search for a query | 1 call (cached in Redis + MongoDB) |
| Same search again (within 6h) | 0 calls (served from Redis) |
| Same search (Redis expired) | 0 calls (served from MongoDB) |
| /recommend endpoint | **0 calls** (reads MongoDB only) |
| /skill-gap endpoint | **0 calls** (reads MongoDB only) |
| fetch_details | OFF by default (saves 10x calls) |

---

## KEY FEATURES

- ✅ Apply Now button on every job card (links directly to job application URL)
- ✅ AI-powered resume parsing (Groq LLM)
- ✅ AI job recommendations with match scores
- ✅ Skill gap analysis with learning roadmap
- ✅ MongoDB as permanent job cache
- ✅ Redis as fast secondary cache (optional)
- ✅ JWT authentication
- ✅ Dark editorial UI

