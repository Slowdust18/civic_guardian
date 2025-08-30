from pydantic import BaseModel
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
