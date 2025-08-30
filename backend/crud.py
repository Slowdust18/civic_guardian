from sqlalchemy.orm import Session
import models
from shapely.geometry import mapping
from geoalchemy2.shape import to_shape

# 🔹 Create complaint
def create_complaint(db: Session, complaint_data: dict):
    complaint = models.Complaint(**complaint_data)
    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    return complaint

# 🔹 Get all complaints
def get_all_complaints(db: Session):
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
            "location": mapping(geom) if geom else None,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "locationName": c.locationName
        })
    return result

# 🔹 Get one complaint
def get_complaint(db: Session, complaint_id: int):
    return db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()

# 🔹 Delete complaint
def delete_complaint(db: Session, complaint_id: int):
    complaint = get_complaint(db, complaint_id)
    if complaint:
        db.delete(complaint)
        db.commit()
    return complaint
