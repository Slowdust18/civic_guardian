# backend/seed.py
from database import SessionLocal, engine
import models
from sqlalchemy.exc import IntegrityError
from werkzeug.security import generate_password_hash
from geoalchemy2.shape import from_shape
from shapely.geometry import Point
import random
import ranking_service # <-- Import our ranking service

# Ensure tables exist
models.Base.metadata.create_all(bind=engine)

db = SessionLocal()

# --- Seed Users (no changes here) ---
def seed_users():
    users = [
        models.User(first_name="Anirudh", last_name="Sarkar", age=21, aadhar_number="111122223333", email="anirudh@example.com", phnumber="9000000001", password_hash=generate_password_hash("password123"), role="citizen"),
        models.User(first_name="Ravi", last_name="Kumar", age=35, aadhar_number="222233334444", email="ravi@example.com", phnumber="9000000002", password_hash=generate_password_hash("password123"), role="citizen"),
        models.User(first_name="Meera", last_name="Sharma", age=28, aadhar_number="333344445555", email="meera@example.com", phnumber="9000000003", password_hash=generate_password_hash("password123"), role="citizen"),
        models.User(first_name="Admin", last_name="User", age=40, aadhar_number="444455556666", email="admin@example.com", phnumber="9000000004", password_hash=generate_password_hash("adminpass"), role="admin"),
        models.User(first_name="Sita", last_name="Iyer", age=32, aadhar_number="555566667777", email="sita@example.com", phnumber="9000000005", password_hash=generate_password_hash("password123"), role="citizen"),
    ]
    for user in users:
        try:
            db.add(user)
            db.commit()
        except IntegrityError:
            db.rollback()
            print(f"⚠️ User {user.email} already exists, skipping.")

# --- NEW Complaint Seeding Function ---
def seed_complaints():
    print("🌱 Seeding 30 new complaints for Mumbai...")

    # --- Data Pools for Random Generation ---
    complaint_types = {
        "Roads": ("Pothole on Arterial Road", "Damaged Footpath", "Cracked Road Surface"),
        "Sanitation": ("Garbage Dump Not Cleared", "Overflowing Public Bin", "Clogged Drain"),
        "Electricity": ("Flickering Streetlight", "Exposed Wiring on Pole", "Streetlight Outage"),
        "Water": ("Leaking Public Tap", "Contaminated Water Supply Reported", "Pipe Burst on Main Street"),
        "Waste": ("Illegal Dumping on Vacant Lot", "Construction Debris Left on Roadside", "Lack of Waste Segregation Bins")
    }
    
    # --- Mumbai Cluster Locations (Latitude, Longitude) ---
    clusters = {
        "Bandra West": (19.0596, 72.8295),
        "Fort/Colaba": (18.9220, 72.8347),
        "Andheri East": (19.1136, 72.8697),
        "Dadar": (19.0213, 72.8424),
        "Thane": (19.2183, 72.9781)
    }
    cluster_names = list(clusters.keys())

    for i in range(30):
        # 1. Randomly pick a complaint type and location
        department = random.choice(list(complaint_types.keys()))
        title = random.choice(complaint_types[department])
        location_name = random.choice(cluster_names)
        base_lat, base_lon = clusters[location_name]

        # 2. Create a clustered location with a small random offset
        lat = base_lat + random.uniform(-0.02, 0.02)
        lon = base_lon + random.uniform(-0.02, 0.02)
        
        description = f"{title} near {location_name}. This has been causing issues for local residents and requires attention."
        
        # 3. Create and save the complaint object
        complaint = models.Complaint(
            user_id=random.randint(1, 5),
            title=title,
            description=description,
            department=department,
            location=from_shape(Point(lon, lat), srid=4326),
            locationName=location_name
        )
        
        db.add(complaint)
        db.commit()
        db.refresh(complaint)

        # 4. --- Calculate and save its initial score using the ranking service ---
        initial_score = ranking_service.calculate_priority_score(complaint, db)
        complaint.score = initial_score
        db.commit()
        
        print(f"   -> Created complaint #{complaint.id} ('{title}') with score {initial_score}")

if __name__ == "__main__":
    print("--- Starting Database Seeding ---")
    seed_users()
    seed_complaints()
    print("✅ Seeding complete.")