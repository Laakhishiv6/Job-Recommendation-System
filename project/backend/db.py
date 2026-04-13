from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = MongoClient(MONGO_URI)
db = client["job_recommendation_db"]

users_collection     = db["users"]
user_info_collection = db["user_info"]
jobs_collection      = db["jobs"]

# Indexes
users_collection.create_index("email", unique=True)
user_info_collection.create_index("email", unique=True)
jobs_collection.create_index("title")
