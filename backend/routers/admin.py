from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from geoalchemy2.shape import to_shape
from shapely.geometry import mapping
from schemas import ProcessUpdate
from models import Complaint
from sqlalchemy import func
from sqlalchemy import or_
import ranking_service

router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)

from fastapi import Request

@router.get("/complaints")
def get_all_complaints(request: Request, db: Session = Depends(get_db)):
    complaints = db.query(models.Complaint).all()
    result = []
    for c in complaints:
        geom = to_shape(c.location) if c.location else None
        
        # Fix image_url here
        if c.image_url:
            # Remove leading slash if present
            img_path = c.image_url.lstrip("/")
            image_url = str(request.base_url) + img_path
        else:
            image_url = None

        result.append({
            "id": c.id,
            "user_id": c.user_id,
            "title": c.title,
            "description": c.description,
            "department": c.department,
            "status": c.status,
            "priority": c.priority,
            "image_url": image_url,
            "location": mapping(geom) if geom else None,
            "locationName": c.locationName,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "process": c.process
        })
    return result



@router.get("/get_complaint/{complaint_id}")
def get_complaint(complaint_id: int, db: Session = Depends(get_db)):
    complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()

    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    geom = to_shape(complaint.location) if complaint.location else None

    return {
        "id": complaint.id,
        "user_id": complaint.user_id,
        "title": complaint.title,
        "description": complaint.description,
        "department": complaint.department,
        "status": complaint.status,
        "priority": complaint.priority,
        "process": complaint.process,
        "image_url": complaint.image_url,
        "locationName": complaint.locationName,
        "location": mapping(geom) if geom else None,
        "created_at": complaint.created_at.isoformat() if complaint.created_at else None,
    }



@router.put("/update_complaint/{complaint_id}")
def update_complaint(
    complaint_id: int,
    data: schemas.ComplaintUpdate,
    db: Session = Depends(get_db)
):
    complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()

    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    # Only update provided fields
    update_data = data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(complaint, key, value)

    db.commit()
    db.refresh(complaint)

    geom = to_shape(complaint.location) if complaint.location else None
@router.put("/reports/{id}/urgency")
def update_report_urgency(id: int, data: schemas.UrgencyUpdate, db: Session = Depends(get_db)):
    report = db.query(models.Complaint).filter(models.Complaint.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    report.priority = data.urgency
    db.commit()
    db.refresh(report)

    geom = to_shape(report.location) if report.location else None

    return {
        "id": report.id,
        "user_id": report.user_id,
        "title": report.title,
        "description": report.description,
        "department": report.department,
        "status": report.status,
        "priority": report.priority,
        "process": report.process,
        "image_url": report.image_url,
        "locationName": report.locationName,
        "location": mapping(geom) if geom else None,
        "created_at": report.created_at.isoformat() if report.created_at else None,
    }


@router.put("/complaints/{id}/process", tags=["Admin"])
def update_process(id: int, data: ProcessUpdate, db: Session = Depends(get_db)):
    complaint = db.query(models.Complaint).filter(models.Complaint.id == id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    complaint.process = data.process
    db.commit()
    return {"message": "Process updated successfully"}
    
@router.put("/complaints/{id}/department")
def update_department(id: int, data: schemas.DepartmentUpdate, db: Session = Depends(get_db)):
    complaint = db.query(models.Complaint).filter(models.Complaint.id == id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    complaint.department = data.department
    db.commit()
    db.refresh(complaint)
    return {"message": "Department updated successfully"}

@router.get("/filter", response_model=None)  # <-- Disable Pydantic inference
def filter_complaints(
    db: Session = Depends(get_db),
    department: str = None,
    process: str = None,
    status: str = None,
    priority: str = None,
    partial: bool = True
):
    query = db.query(Complaint)

    if department:
        query = query.filter(Complaint.department == department)

    if process:
        if partial:
            query = query.filter(Complaint.process.ilike(f"%{process}%"))
        else:
            query = query.filter(
                func.coalesce(func.lower(func.trim(Complaint.process)), '') == process.strip().lower()
            )

    if status:
        if partial:
            query = query.filter(Complaint.status.ilike(f"%{status}%"))
        else:
            query = query.filter(
                func.coalesce(func.lower(func.trim(Complaint.status)), '') == status.strip().lower()
            )

    if priority:
        if partial:
            query = query.filter(Complaint.priority.ilike(f"%{priority}%"))
        else:
            query = query.filter(
                func.coalesce(func.lower(func.trim(Complaint.priority)), '') == priority.strip().lower()
            )

    complaints = query.all()

    result = []
    for c in complaints:
        geom = to_shape(c.location) if c.location else None
        result.append({
            "id": c.id,
            "title": c.title,
            "description": c.description,
            "department": c.department,
            "status": c.status,
            "priority": c.priority,
            "process": c.process,
            "image_url": c.image_url,
            "location": mapping(geom) if geom else None,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "locationName": c.locationName
        })

    return result


@router.get("/complaints/ranked")
def get_ranked_complaints(request: Request, db: Session = Depends(get_db)):
    """
    Gets all unresolved complaints, calculates a priority score for each,
    and returns them sorted from most to least critical.
    """
    unresolved_complaints = db.query(models.Complaint).filter(models.Complaint.status != 'resolved').all()
    
    ranked_list = []
    for c in unresolved_complaints:
        score = ranking_service.calculate_priority_score(c, db)
        
        geom = to_shape(c.location) if c.location else None
        img_path = c.image_url.lstrip("/") if c.image_url else None
        image_url = str(request.base_url) + img_path if img_path else None

        ranked_list.append({
            "score": score,
            "id": c.id,
            "title": c.title,
            "description": c.description,
            "department": c.department,
            "status": c.status,
            "image_url": image_url,
            "location": mapping(geom) if geom else None,
            "locationName": c.locationName,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        })

    # Sort the final list by score, with the highest score first
    ranked_list.sort(key=lambda x: x['score'], reverse=True)
    
    return ranked_list