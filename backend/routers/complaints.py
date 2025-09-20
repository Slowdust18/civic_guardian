# backend/routers/complaints.py

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
import os, shutil
import uuid
import models
from database import get_db
from shapely.geometry import mapping
from geoalchemy2.shape import to_shape
import ranking_service

router = APIRouter(
    prefix="/complaints",
    tags=["Complaints"]
)

@router.post("/register")
async def register_complaint(
    # --- ADDED user_id as a required form field ---
    user_id: int = Form(...),
    title: str = Form(...),
    description: str = Form(...),
    department: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    image: UploadFile = File(None),
    locationName: str = Form(...),
    db: Session = Depends(get_db)
):
    # Image saving logic
    image_url = None
    if image:
        os.makedirs("uploads", exist_ok=True)
        filename = f"{uuid.uuid4().hex}_{image.filename}"
        save_path = os.path.join("uploads", filename)
        try:
            with open(save_path, "wb") as buffer:
                shutil.copyfileobj(image.file, buffer)
            image_url = f"/uploads/{filename}"
        except Exception:
            raise HTTPException(status_code=500, detail="Image upload failed")

    # Automatically assign priority based on severity
    severity_score = ranking_service.calculate_severity_score(department)
    initial_priority = ranking_service.assign_priority_from_score(severity_score)

    # Create complaint record
    complaint = models.Complaint(
        user_id=user_id, # <-- Use the user_id from the form
        title=title,
        description=description,
        department=department,
        priority=initial_priority,
        image_url=image_url,
        location=f"SRID=4326;POINT({longitude} {latitude})",
        locationName=locationName
    )

    db.add(complaint)
    db.commit()
    db.refresh(complaint)

    # Calculate and save the initial overall score
    initial_score = ranking_service.calculate_priority_score(complaint, db)
    complaint.score = initial_score
    db.commit()

    return {"message": "Complaint registered successfully", "id": complaint.id, "image_url": image_url}


@router.get("/all")
def get_complaints(db: Session = Depends(get_db)):
    # ... (this function remains the same)
    complaints = db.query(models.Complaint).all()
    result = []
    for c in complaints:
        geom = to_shape(c.location) if c.location else None
        result.append({
            "id": c.id,
            "title": c.title,
            "description": c.description,
            "department": c.department,
            "status": c.status,
            "process": c.process,
            "image_url": c.image_url,
            "location": mapping(geom) if geom else None,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "locationName": c.locationName
        })
    return result


@router.delete("/{complaint_id}")
def delete_complaint(complaint_id: int, db: Session = Depends(get_db)):
    # ... (this function remains the same)
    complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    db.delete(complaint)
    db.commit()
    return {"message": f"Complaint {complaint_id} deleted successfully"}