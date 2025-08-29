from sqlalchemy import Column, Integer, String, Text, ForeignKey, TIMESTAMP, func, Boolean
from sqlalchemy.dialects.postgresql import TEXT
from sqlalchemy.orm import relationship
from geoalchemy2 import Geography
from database import Base

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    title = Column(String(100), nullable=False)  # short title
    description = Column(Text, nullable=False)   # detailed issue
    department = Column(String(50), nullable=False)  # sanitation, water, roads...
    status = Column(String(20), default="unresolved")
    image_url = Column(Text)
    location = Column(Geography(geometry_type="POINT", srid=4326))
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="complaints")
    votes = relationship("VerificationVote", back_populates="complaint")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(TEXT, nullable=False)
    role = Column(String(20), default="citizen")
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    complaints = relationship("Complaint", back_populates="user")


class VerificationVote(Base):
    __tablename__ = "verification_votes"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    vote = Column(Boolean, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    complaint = relationship("Complaint", back_populates="votes")
