from db import users_collection
from auth import hash_password, verify_password

email    = "admin@admin.com"
password = "admin"

# Hard delete any existing admin record (regardless of field structure)
deleted = users_collection.delete_many({"email": email})
print(f"🗑  Removed {deleted.deleted_count} existing record(s) for {email}")

hashed = hash_password(password)

users_collection.insert_one({
    "name":     "Admin",
    "email":    email,
    "password": hashed,
    "role":     "admin",
})
print(f"✅ Admin account CREATED fresh")

# Verify it round-trips correctly
doc = users_collection.find_one({"email": email})
ok  = verify_password(password, doc["password"])
print(f"🔑 Password verify check: {'PASS' if ok else 'FAIL'}")
print(f"   Email : {email}")
print(f"   Pass  : {password}")
print(f"   Role  : {doc.get('role')}")
