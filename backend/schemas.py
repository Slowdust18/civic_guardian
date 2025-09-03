from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
from datetime import datetime

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
        orm_mode = True

# Complaint Update Schema
class ComplaintUpdate(BaseModel):
    department: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    process: Optional[str] = None

    class Config:
        orm_mode = True  # lets Pydantic work directly with ORM objects


class UserCreate(BaseModel):
    first_name: str
    last_name: str
    age: int
    aadhar_number: str
    email: EmailStr
    password: str   # plain password, will be hashed

class UserOut(BaseModel):
    id: int
    first_name: str
    last_name: str
    age: int
    aadhar_number: str
    email: EmailStr
    role: str

    class Config:
        from_attributes = True