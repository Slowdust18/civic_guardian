from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import VerifiedIssue
from datetime import datetime
from schemas import VoteCreate 
import models
from shapely.geometry import mapping
from geoalchemy2.shape import to_shape

router = APIRouter(
    prefix="/resolved",
    tags=["resolved"]
)
@router.get("/all_resolved")
def get_complaints(db: Session = Depends(get_db)):
    verifed = db.query(models.VerifiedIssue).all()
    result = []
    for c in verifed:
        geom = to_shape(c.location) if c.location else None
        result.append({
            "id": c.id,
            "title": c.title,
            "description": c.description,
            "department": c.department,
            "location": mapping(geom) if geom else None,  # shapely -> GeoJSON dict
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "locationName": c.locationName
        })
    return result