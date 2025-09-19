from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any, List, Literal
from datetime import datetime

class ProcessUpdate(BaseModel):
    process: Literal["assigned", "Work has started", "pending verification", "complaint sent"] = Field(
        ..., description="Valid process status")
    
class DepartmentUpdate(BaseModel):
    department: Literal["Roads", "Electricity", "Sanitation", "Water","Waste"] = Field(
        ..., description="Valid Department update")


class AIResponse(BaseModel):
    inferred_title: str
    description: str
    descriptions: List[str]
    suggested_category: str
    suggested_department: str
    tags: List[str]

# Base schema (shared fields)
class ComplaintBase(BaseModel):
    title: str
    description: str
    department: str

# For creating complaints (input from frontend)
class ComplaintCreate(ComplaintBase):
    latitude: float
    longitude: float
    image_url: Optional[str] = None

# For returning complaints (output to frontend)
class ComplaintResponse(ComplaintBase):
    id: int
    status: str
    image_url: Optional[str]
    location: Optional[Dict[str, Any]]  # GeoJSON dict
    created_at: datetime
    locationName: Optional[str]

    class Config:
        from_attributes= True

# Complaint Update Schema
class ComplaintUpdate(BaseModel):
    department: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    process: Optional[str] = None

    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    first_name: str
    last_name: str
    age: int
    aadhar_number: str
    email: str
    phnumber: str
    password: str

class UserOut(BaseModel):
    id: int
    first_name: str
    last_name: str
    age: int
    aadhar_number: str
    email: EmailStr
    role: str
    phnumber: str

    class Config:
        from_attributes = True

# Schema for updating urgency (priority)
class UrgencyUpdate(BaseModel):
    urgency: Literal['LOW', 'MEDIUM', 'HIGH']

from pydantic import BaseModel

class VoteCreate(BaseModel):
    user_id: int
    vote_type: str  # "verified" or "not_verified"
