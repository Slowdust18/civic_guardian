# backend/execution.py
from database import SessionLocal, engine
import models
from sqlalchemy.exc import IntegrityError
import random
import ranking_service # Import to recalculate scores

def run_temp_updates():
    """
    Selects a batch of complaints and updates their status, priority,
    and adds votes for specific cases.
    """
    db = SessionLocal()
    print("--- Starting temporary execution script ---")

    # --- 1. Fetch a batch of complaints to update ---
    complaints_to_update = db.query(models.Complaint).order_by(models.Complaint.id).limit(12).all()
    if len(complaints_to_update) < 12:
        print("⚠️ Not enough complaints in the database to run the script. Please seed first.")
        return

    # --- 2. Define new statuses and priorities ---
    process_statuses = ['assigned'] * 4 + ['in_progress'] * 4 + ['pending_verification'] * 4
    priorities = ['low', 'medium', 'high', 'critical'] * 3
    random.shuffle(process_statuses)
    random.shuffle(priorities)

    pending_verification_ids = []

    print("\nUpdating complaint statuses and priorities...")
    for i, complaint in enumerate(complaints_to_update):
        old_score = complaint.score
        complaint.process = process_statuses[i]
        complaint.priority = priorities[i]
        
        if complaint.process == 'pending_verification':
            pending_verification_ids.append(complaint.id)
        
        print(f"  -> Updated Complaint #{complaint.id}: Process='{complaint.process}', Priority='{complaint.priority}'")

    db.commit()

    # --- 3. Add votes for 'pending_verification' cases ---
    if pending_verification_ids:
        print(f"\nAdding 'not_resolved' votes for {len(pending_verification_ids)} complaints marked for verification...")

        # Get two random users to cast the votes
        users = db.query(models.User).filter(models.User.role == 'citizen').limit(2).all()
        if len(users) < 2:
            print("⚠️ Not enough citizen users to add votes. Please seed users first.")
            db.close()
            return
        
        user_ids_for_voting = [users[0].id, users[1].id]

        for complaint_id in pending_verification_ids:
            for user_id in user_ids_for_voting:
                # Avoid adding a duplicate vote
                existing_vote = db.query(models.Vote).filter_by(user_id=user_id, complaint_id=complaint_id).first()
                if not existing_vote:
                    new_vote = models.Vote(
                        user_id=user_id,
                        complaint_id=complaint_id,
                        vote_type='not_resolved'
                    )
                    db.add(new_vote)
                    print(f"   -> Added 'not_resolved' vote from User #{user_id} to Complaint #{complaint_id}")
        
        db.commit()

        # --- 4. Recalculate scores for complaints that received votes ---
        print("\nRecalculating scores for complaints with new votes...")
        complaints_with_new_votes = db.query(models.Complaint).filter(models.Complaint.id.in_(pending_verification_ids)).all()
        
        for complaint in complaints_with_new_votes:
            old_score = complaint.score
            new_score = ranking_service.calculate_priority_score(complaint, db)
            complaint.score = new_score
            print(f"   -> Complaint #{complaint.id} score updated from {old_score} to {new_score}")

        db.commit()

    print("\n--- Temporary execution finished successfully! ---")
    db.close()


if __name__ == "__main__":
    run_temp_updates()