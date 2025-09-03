from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models

router = APIRouter(prefix="/votes", tags=["Votes"])

@router.post("/{complaint_id}")
def cast_vote(complaint_id: int, user_id: int, db: Session = Depends(get_db)):
    # check if user exists
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # check if complaint exists
    complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    # check if already voted
    existing_vote = db.query(models.Vote).filter(
        models.Vote.user_id == user_id,
        models.Vote.complaint_id == complaint_id
    ).first()
    if existing_vote:
        raise HTTPException(status_code=400, detail="User has already voted for this complaint")

    # record vote
    new_vote = models.Vote(user_id=user_id, complaint_id=complaint_id)
    db.add(new_vote)
    db.commit()
    db.refresh(new_vote)

    return {"message": "Vote cast successfully", "vote_id": new_vote.id}

@router.get("/complaint/{complaint_id}")
def get_votes(complaint_id: int, db: Session = Depends(get_db)):
    count = db.query(models.Vote).filter(models.Vote.complaint_id == complaint_id).count()
    return {"complaint_id": complaint_id, "vote_count": count}
