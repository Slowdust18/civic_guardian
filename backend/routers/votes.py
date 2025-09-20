# backend/routers/votes.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import Vote, Complaint, VerifiedIssue, User
import ranking_service
import models
router = APIRouter(
    prefix="/votes",
    tags=["Votes"]
)

# --- Vote Thresholds ---
RESOLVED_THRESHOLD = 3
NOT_RESOLVED_THRESHOLD = 3 
PRIORITY_HIGH_THRESHOLD = 3
PRIORITY_CRITICAL_THRESHOLD = 6


@router.post("/{complaint_id}/{user_id}")
def vote_on_complaint(
    complaint_id: int,
    user_id: int,
    vote_type: str, # "resolved" or "not_resolved"
    db: Session = Depends(get_db)
):
    # --- Initial Checks ---
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if vote_type not in ["resolved", "not_resolved"]:
        raise HTTPException(status_code=400, detail="Invalid vote type")

    existing_vote = db.query(Vote).filter(Vote.user_id == user_id, Vote.complaint_id == complaint_id).first()
    if existing_vote:
        raise HTTPException(status_code=400, detail="User has already voted on this complaint")

    # --- 1. Record the New Vote ---
    new_vote = Vote(user_id=user_id, complaint_id=complaint_id, vote_type=vote_type)
    db.add(new_vote)

    # --- 2. Escalate Priority & Recalculate Score (The Ranking Part) ---
    if vote_type == 'not_resolved':
        # We need the new total, so we query for all "not_resolved" votes
        not_resolved_count = db.query(func.count(Vote.id)).filter(
            Vote.complaint_id == complaint_id, Vote.vote_type == 'not_resolved'
        ).scalar() or 0

        promoted = False
        if not_resolved_count >= PRIORITY_CRITICAL_THRESHOLD and complaint.priority != 'critical':
            complaint.priority = 'critical'
            promoted = True
        elif not_resolved_count >= PRIORITY_HIGH_THRESHOLD and complaint.priority not in ['high', 'critical']:
            complaint.priority = 'high'
            promoted = True
        
        if promoted:
            print(f"Complaint #{complaint.id} priority escalated to '{complaint.priority}'")

    # Recalculate score after any vote or priority change
    complaint.score = ranking_service.calculate_priority_score(complaint, db)
    print(f"Complaint #{complaint.id} score updated to {complaint.score}")

    # --- 3. Check Vote Thresholds (The Process/Verification Part) ---
    vote_summary = {
        vt: count for vt, count in 
        db.query(Vote.vote_type, func.count(Vote.id))
        .filter(Vote.complaint_id == complaint_id).group_by(Vote.vote_type).all()
    }
    
    resolved_count = vote_summary.get("resolved", 0)
    not_resolved_count = vote_summary.get("not_resolved", 0)

    # Case 1: Issue is verified as resolved
    if resolved_count >= RESOLVED_THRESHOLD:
        print(f"Complaint #{complaint.id} has been verified as RESOLVED.")
        complaint.status = "resolved"
        complaint.process = "verified_resolved"
        
        # Copy to VerifiedIssue table if it's not already there
        if not db.query(VerifiedIssue).filter(VerifiedIssue.complaint_id == complaint_id).first():
            verified = VerifiedIssue(
                complaint_id=complaint.id, title=complaint.title, description=complaint.description,
                department=complaint.department, status="verified", priority=complaint.priority,
                location=complaint.location, locationName=complaint.locationName
            )
            db.add(verified)
        
        # Clear all votes for this complaint
        db.query(Vote).filter(Vote.complaint_id == complaint_id).delete(synchronize_session=False)

    # Case 2: Issue is verified as still pending
    elif not_resolved_count >= NOT_RESOLVED_THRESHOLD:
        print(f"Complaint #{complaint.id} has been verified as STILL PENDING.")
        complaint.process = "community_verified"
        
        # Clear all votes for this complaint
        db.query(Vote).filter(Vote.complaint_id == complaint_id).delete(synchronize_session=False)

    # --- 4. Final Commit ---
    # All changes (new vote, score/priority updates, status changes, new verified issues)
    # are saved in one single, safe transaction.
    db.commit()

    return {"message": "Vote registered successfully", "complaint_status": complaint.status, "new_score": complaint.score}

@router.get("/complaints/{complaint_id}/votes")
def get_vote_summary(complaint_id: int, db: Session = Depends(get_db)):
    """
    Fetches a summary of 'resolved' and 'not_resolved' votes
    for a specific complaint ID.
    """
    # 1. Check if the complaint exists to provide a clear error message
    complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail=f"Complaint with ID {complaint_id} not found.")

    # 2. Query the database to count votes, grouped by their type
    vote_counts = (
        db.query(models.Vote.vote_type, func.count(models.Vote.id))
        .filter(models.Vote.complaint_id == complaint_id)
        .group_by(models.Vote.vote_type)
        .all()
    )
    
    # 3. Format the result into a clean dictionary
    summary = {vote_type: count for vote_type, count in vote_counts}

    # 4. Return the final, structured response
    return {
        "complaint_id": complaint_id,
        "resolved_count": summary.get("resolved", 0),
        "not_resolved_count": summary.get("not_resolved", 0),
        "total_votes": sum(summary.values())
    }
