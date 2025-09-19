from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import Vote, Complaint, VerifiedIssue, User
from datetime import datetime
from schemas import VoteCreate
import models

router = APIRouter(
    prefix="/votes",
    tags=["Votes"]
)

# thresholds
RESOLVED_THRESHOLD = 3
NOT_RESOLVED_THRESHOLD = 3


@router.post("/{complaint_id}")
def vote_on_complaint(
    complaint_id: int,
    vote: VoteCreate,
    db: Session = Depends(get_db)
):
    # check if complaint exists
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    # check if user exists
    user = db.query(User).filter(User.id == vote.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # check if user already voted on this complaint
    existing_vote = (
        db.query(Vote)
        .filter(Vote.user_id == vote.user_id, Vote.complaint_id == complaint_id)
        .first()
    )
    if existing_vote:
        raise HTTPException(status_code=400, detail="User has already voted on this complaint")

    # record new vote
    new_vote = Vote(
        user_id=vote.user_id,
        complaint_id=complaint_id,
        vote_type=vote.vote_type,
        voted_at=datetime.utcnow()
    )
    db.add(new_vote)
    db.commit()
    db.refresh(new_vote)

    # count votes for this complaint
    results = (
        db.query(Vote.vote_type, func.count(Vote.id))
        .filter(Vote.complaint_id == complaint_id)
        .group_by(Vote.vote_type)
        .all()
    )
    vote_summary = {vt: count for vt, count in results}

    # Case 1: Enough resolved votes → move to verified_issues
    
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

@router.get("/all/{complaint_id}")
def get_all_votes(complaint_id: int, db: Session = Depends(get_db)):
    votes = db.query(Vote).filter(Vote.complaint_id == complaint_id).all()
    if not votes:
        raise HTTPException(status_code=404, detail="No votes found for this complaint")
    return votes
