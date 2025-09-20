from sqlalchemy import Column, Integer, String, Text, ForeignKey, TIMESTAMP, func, Boolean, DateTime, UniqueConstraint, Float
from sqlalchemy.dialects.postgresql import TEXT
from sqlalchemy.orm import relationship
from geoalchemy2 import Geography
from database import Base

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    department = Column(String, nullable=True)   # can be empty at first
    status = Column(String, default="Unresolved")  # unresolved and resolved
    priority = Column(String, default="none")      # none, low, medium, high
    image_url = Column(String, nullable=True)
    location = Column(Geography(geometry_type="POINT", srid=4326))
    locationName = Column("locationName", String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    process= Column(String, nullable=True) # unassigned, assigned, in_progress, pending_verification
    score = Column(Float, nullable=False, default=0, server_default='0') # <-- ADD THIS LINE

    user = relationship("User", back_populates="complaints")
    votes = relationship("Vote", back_populates="complaint")
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    age = Column(Integer, nullable=False)
    aadhar_number = Column(String(12), unique=True, nullable=False)  # Aadhaar is 12 digits
    email = Column(String(100), unique=True, nullable=False)
    phnumber = Column(String(10), unique=True, nullable=False)
    password_hash = Column(TEXT, nullable=False)
    role = Column(String(20), default="citizen")   # citizen, admin
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    # Relationship with complaints
    complaints = relationship("Complaint", back_populates="user")
    votes = relationship("Vote", back_populates="user")


class Vote(Base):
    __tablename__ = "votes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False)
    voted_at = Column(DateTime(timezone=True), server_default=func.now())
    vote_type = Column(String(20), nullable=False, default="resolved") 

    # relationships
    user = relationship("User", back_populates="votes")
    complaint = relationship("Complaint", back_populates="votes")

    __table_args__ = (
        UniqueConstraint("user_id", "complaint_id", name="unique_user_complaint_vote"),
    )

class VerifiedIssue(Base):
    __tablename__ = "verified_issues"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    complaint_id = Column(Integer, nullable=False, unique=True)  
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    department = Column(String(100))
    status = Column(String(50))
    priority = Column(String(50))
    location = Column(Geography(geometry_type="POINT", srid=4326))
    locationName = Column(String(200))
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
