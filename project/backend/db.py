from pymongo import MongoClient, ASCENDING
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = MongoClient(MONGO_URI)
db = client["job_recommendation_db"]

users_collection                = db["users"]
user_info_collection            = db["user_info"]
jobs_collection                 = db["jobs"]
pending_verifications_collection = db["pending_verifications"]

# Indexes
users_collection.create_index("email", unique=True)
user_info_collection.create_index("email", unique=True)
jobs_collection.create_index("title")
pending_verifications_collection.create_index("email", unique=True)
# TTL index: MongoDB auto-removes expired documents (runs every ~60s)
pending_verifications_collection.create_index(
    [("expires_at", ASCENDING)], expireAfterSeconds=0
)
