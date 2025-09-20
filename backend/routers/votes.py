from fastapi import Request, APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import Vote, Complaint, VerifiedIssue, User
from datetime import datetime

router = APIRouter(
    prefix="/votes",
    tags=["Votes"]
)

RESOLVED_THRESHOLD = 3
NOT_RESOLVED_THRESHOLD = 3


@router.post("/{complaint_id}")
async def vote_on_complaint(
    complaint_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    # 👀 Parse JSON manually to avoid Pydantic errors
    body = await request.json()
    print("📥 Raw request body:", body)

    user_id = body.get("user_id")
    vote_type = body.get("vote_type")

    if not user_id or not vote_type:
        raise HTTPException(status_code=422, detail="user_id and vote_type are required")

    # ✅ Check if complaint exists
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    # ✅ Check if user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # ✅ Prevent duplicate votes
    existing_vote = (
        db.query(Vote)
        .filter(Vote.user_id == user_id, Vote.complaint_id == complaint_id)
        .first()
    )
    if existing_vote:
        raise HTTPException(status_code=400, detail="User has already voted on this complaint")

    # ✅ Record new vote
    new_vote = Vote(
        user_id=user_id,
        complaint_id=complaint_id,
        vote_type=vote_type,
        voted_at=datetime.utcnow()
    )
    db.add(new_vote)
    db.commit()
    db.refresh(new_vote)

    # ✅ Count votes for this complaint
    results = (
        db.query(Vote.vote_type, func.count(Vote.id))
        .filter(Vote.complaint_id == complaint_id)
        .group_by(Vote.vote_type)
        .all()
    )
    vote_summary = {vt: count for vt, count in results}

    # Case 1: Enough resolved votes → move to verified_issues
    if vote_summary.get("resolved", 0) >= RESOLVED_THRESHOLD:
        existing_verified = db.query(VerifiedIssue).filter(
            VerifiedIssue.complaint_id == complaint_id
        ).first()

        if not existing_verified:
            verified = VerifiedIssue(
                complaint_id=complaint.id,
                title=complaint.title,
                description=complaint.description,
                department=complaint.department,
                status="verified",
                priority=complaint.priority,
                location=complaint.location,
                locationName=complaint.locationName,
            )
            db.add(verified)
            db.commit()

        # 🔥 Delete all votes for this complaint
        db.query(Vote).filter(Vote.complaint_id == complaint_id).delete()
        db.commit()

    # Case 2: Enough not_resolved votes → mark complaint as in progress
    if vote_summary.get("not_resolved", 0) >= NOT_RESOLVED_THRESHOLD:
        db.query(Complaint).filter(Complaint.id == complaint_id).update(
            {"process": "in progress"}
        )
        db.commit()

        # 🔥 Delete all votes for this complaint
        db.query(Vote).filter(Vote.complaint_id == complaint_id).delete()
        db.commit()

    return {"message": "Vote recorded successfully", "vote_summary": vote_summary}


@router.get("/all/{complaint_id}")
def get_all_votes(complaint_id: int, db: Session = Depends(get_db)):
    votes = db.query(Vote).filter(Vote.complaint_id == complaint_id).all()
    if not votes:
        raise HTTPException(status_code=404, detail="No votes found for this complaint")
    return votes

from geoalchemy2.shape import to_shape

@router.get("/pending")
def get_pending_complaints(db: Session = Depends(get_db)):
    complaints = db.query(Complaint).filter(Complaint.process == "Pending Verification").all()
    if not complaints:
        return []

    result = []
    for c in complaints:
        location = None
        if c.location:  # convert WKBElement → (lon, lat)
            shapely_geom = to_shape(c.location)
            location = {"lat": shapely_geom.y, "lon": shapely_geom.x}

        result.append({
            "id": c.id,
            "title": c.title,
            "description": c.description,
            "department": c.department,
            "status": c.status,
            "priority": c.priority,
            "location": location,
            "locationName": c.locationName,
            "process": c.process,
        })

    return result
