# seed.py
from database import SessionLocal, engine
import models
from sqlalchemy.exc import IntegrityError
from werkzeug.security import generate_password_hash
from geoalchemy2.shape import from_shape
from shapely.geometry import Point

# Ensure tables exist
models.Base.metadata.create_all(bind=engine)

db = SessionLocal()

def seed_users():
    users = [
        models.User(first_name="Anirudh", last_name="Sarkar", age=21,
                    aadhar_number="111122223333", email="anirudh@example.com",
                    password_hash=generate_password_hash("password123"),
                    role="citizen"),

        models.User(first_name="Ravi", last_name="Kumar", age=35,
                    aadhar_number="222233334444", email="ravi@example.com",
                    password_hash=generate_password_hash("password123"),
                    role="citizen"),

        models.User(first_name="Meera", last_name="Sharma", age=28,
                    aadhar_number="333344445555", email="meera@example.com",
                    password_hash=generate_password_hash("password123"),
                    role="citizen"),

        models.User(first_name="Admin", last_name="User", age=40,
                    aadhar_number="444455556666", email="admin@example.com",
                    password_hash=generate_password_hash("adminpass"),
                    role="admin"),

        models.User(first_name="Sita", last_name="Iyer", age=32,
                    aadhar_number="555566667777", email="sita@example.com",
                    password_hash=generate_password_hash("password123"),
                    role="citizen"),
    ]

    for user in users:
        try:
            db.add(user)
            db.commit()
        except IntegrityError:
            db.rollback()
            print(f"⚠️ User {user.email} already exists, skipping.")

def seed_complaints():
    complaints = [
        models.Complaint(
            user_id=1, title="Pothole on Main Road",
            description="Large pothole causing traffic near Anna Nagar.",
            department="Roads", status="unassigned", priority="none",
            location=from_shape(Point(80.217, 13.084), srid=4326),  # Anna Nagar
            locationName="Anna Nagar"
        ),
        models.Complaint(
            user_id=2, title="Garbage not collected",
            description="Garbage overflowing near Koyambedu market.",
            department="Sanitation", status="unassigned", priority="none",
            location=from_shape(Point(80.199, 13.073), srid=4326),  # Koyambedu
            locationName="Koyambedu"
        ),
        models.Complaint(
            user_id=3, title="Streetlight not working",
            description="Streetlight outage in Kilpauk area.",
            department="Electricity", status="unassigned", priority="none",
            location=from_shape(Point(80.237, 13.082), srid=4326),  # Kilpauk
            locationName="Kilpauk"
        ),
        models.Complaint(
            user_id=4, title="Water leakage",
            description="Water leakage near Egmore station causing puddles.",
            department="Water Supply", status="unassigned", priority="none",
            location=from_shape(Point(80.260, 13.078), srid=4326),  # Egmore
            locationName="Egmore"
        ),
        models.Complaint(
            user_id=5, title="Broken footpath",
            description="Damaged footpath in T. Nagar causing inconvenience.",
            department="Roads", status="unassigned", priority="none",
            location=from_shape(Point(80.234, 13.042), srid=4326),  # T. Nagar
            locationName="T. Nagar"
        ),
    ]

    for c in complaints:
        db.add(c)
    db.commit()

if __name__ == "__main__":
    print("🌱 Seeding database...")
    seed_users()
    seed_complaints()
    print("✅ Seeding complete.")
