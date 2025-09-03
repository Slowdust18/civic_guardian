from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
import os, shutil
import models
from database import get_db
from shapely.geometry import mapping
from geoalchemy2.shape import to_shape

router = APIRouter(
    prefix="/complaints",
    tags=["Complaints"]
)

@router.post("/register")
async def register_complaint(
    title: str = Form(...),
    description: str = Form(...),
    department: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    image: UploadFile = File(None),
    locationName: str = Form(...),
    db: Session = Depends(get_db)
):
    # Save image locally (later replace with Cloudinary)
    image_url = None
    if image:
        import uuid
        os.makedirs("uploads", exist_ok=True)

        # Generate unique filename
        filename = f"{uuid.uuid4().hex}_{image.filename}"
        save_path = f"uploads/{filename}"

        try:
            with open(save_path, "wb") as buffer:
                shutil.copyfileobj(image.file, buffer)
        except Exception:
            raise HTTPException(status_code=500, detail="Image upload failed")

        # ✅ This is the URL your frontend can use
        image_url = f"/uploads/{filename}"

    # Create complaint record
    complaint = models.Complaint(
        user_id=1,  # TODO: replace with auth user id
        title=title,
        description=description,
        department=department,
        image_url=image_url,
        location=f"SRID=4326;POINT({longitude} {latitude})",
        locationName= locationName
    )

    db.add(complaint)
    db.commit()
    db.refresh(complaint)

    return {"message": "Complaint registered successfully", "id": complaint.id, "image_url": image_url}

@router.get("/all")
def get_complaints(db: Session = Depends(get_db)):
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
            "image_url": c.image_url,
            "location": mapping(geom) if geom else None,  # shapely -> GeoJSON dict
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "locationName": c.locationName  # ✅ fixed
        })
    return result


# 🔴 Delete a complaint by ID
@router.delete("/{complaint_id}")
def delete_complaint(complaint_id: int, db: Session = Depends(get_db)):
    complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    db.delete(complaint)
    db.commit()
    return {"message": f"Complaint {complaint_id} deleted successfully"}
