# backend/routers/votes.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import Vote, Complaint, VerifiedIssue, User
from schemas import VoteCreate # For receiving request data
from datetime import datetime
import ranking_service
import models
from geoalchemy2.shape import to_shape


router = APIRouter(
    prefix="/votes",
    tags=["Votes"]
)

# --- Consolidated Vote Thresholds ---
RESOLVED_THRESHOLD = 3
NOT_RESOLVED_THRESHOLD = 3 
PRIORITY_HIGH_THRESHOLD = 3
PRIORITY_CRITICAL_THRESHOLD = 6


@router.post("/{complaint_id}")
def vote_on_complaint(
    complaint_id: int,
    vote: VoteCreate, # Use Pydantic model to get data from the JSON body
    db: Session = Depends(get_db)
):
    # --- Initial Checks ---
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    user = db.query(User).filter(User.id == vote.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User with ID {vote.user_id} not found")

    if vote.vote_type not in ["resolved", "not_resolved"]:
        raise HTTPException(status_code=400, detail="Invalid vote type")

    existing_vote = db.query(Vote).filter(Vote.user_id == vote.user_id, Vote.complaint_id == complaint_id).first()
    if existing_vote:
        raise HTTPException(status_code=400, detail="User has already voted on this complaint")

    # --- 1. Record the New Vote (with timestamp) ---
    new_vote = Vote(
        user_id=vote.user_id,
        complaint_id=complaint_id,
        vote_type=vote.vote_type,
        voted_at=datetime.utcnow()
    )
    db.add(new_vote)

    # --- 2. Escalate Priority & Recalculate Score ---
    if vote.vote_type == 'not_resolved':
        not_resolved_count = db.query(func.count(Vote.id)).filter(
            Vote.complaint_id == complaint_id, Vote.vote_type == 'not_resolved'
        ).scalar() or 0

        if not_resolved_count >= PRIORITY_CRITICAL_THRESHOLD and complaint.priority != 'critical':
            complaint.priority = 'critical'
        elif not_resolved_count >= PRIORITY_HIGH_THRESHOLD and complaint.priority not in ['high', 'critical']:
            complaint.priority = 'high'
    
    complaint.score = ranking_service.calculate_priority_score(complaint, db)

    # --- 3. Check Vote Thresholds ---
    vote_summary = {vt: count for vt, count in db.query(Vote.vote_type, func.count(Vote.id)).filter(Vote.complaint_id == complaint_id).group_by(Vote.vote_type).all()}
    
    if vote_summary.get("resolved", 0) >= RESOLVED_THRESHOLD:
        complaint.status = "resolved"
        complaint.process = "verified_resolved"
        if not db.query(VerifiedIssue).filter(VerifiedIssue.complaint_id == complaint_id).first():
            db.add(VerifiedIssue(
                complaint_id=complaint.id, title=complaint.title, description=complaint.description,
                department=complaint.department, status="verified", priority=complaint.priority,
                location=complaint.location, locationName=complaint.locationName
            ))
        db.query(Vote).filter(Vote.complaint_id == complaint_id).delete(synchronize_session=False)

    elif vote_summary.get("not_resolved", 0) >= NOT_RESOLVED_THRESHOLD:
        complaint.process = "community_verified" # A more descriptive status
        db.query(Vote).filter(Vote.complaint_id == complaint_id).delete(synchronize_session=False)

    # --- 4. Final Commit ---
    db.commit()

    return {"message": "Vote registered successfully", "complaint_status": complaint.status, "new_score": complaint.score}


@router.get("/complaints/{complaint_id}/votes")
def get_vote_summary(complaint_id: int, db: Session = Depends(get_db)):
    """Fetches a summary of votes for a specific complaint ID."""
    complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail=f"Complaint with ID {complaint_id} not found.")
    vote_counts = (db.query(models.Vote.vote_type, func.count(models.Vote.id)).filter(models.Vote.complaint_id == complaint_id).group_by(models.Vote.vote_type).all())
    summary = {vote_type: count for vote_type, count in vote_counts}
    return {
        "complaint_id": complaint_id,
        "resolved_count": summary.get("resolved", 0),
        "not_resolved_count": summary.get("not_resolved", 0),
        "total_votes": sum(summary.values())
    }

@router.get("/pending")
def get_pending_complaints(db: Session = Depends(get_db)):
    """Fetches complaints with the 'pending verification' process status."""
    complaints = db.query(Complaint).filter(Complaint.process == "pending_verification").all()
    result = []
    for c in complaints:
        shapely_geom = to_shape(c.location) if c.location else None
        location = {"lat": shapely_geom.y, "lon": shapely_geom.x} if shapely_geom else None
        result.append({
            "id": c.id, "title": c.title, "description": c.description,
            "department": c.department, "status": c.status, "priority": c.priority,
            "location": location, "locationName": c.locationName, "process": c.process,
        })
    return result