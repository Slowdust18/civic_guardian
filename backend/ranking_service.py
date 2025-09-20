# backend/ranking_service.py
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from models import Complaint, Vote
from typing import Optional
from geoalchemy2.shape import to_shape

# --- Scoring Constants ---
LOCATION_SCORES = {
    # Health & Emergency (High Priority)
    "hospital": 15, "ambulance_station": 15, "fire_station": 14, "police": 14,
    "clinic": 12, "dispensary": 12, "nursing_home": 12, "pharmacy": 12,

    # Education & Childcare (High Priority)
    "school": 10, "college": 10, "university": 10, "kindergarten": 10,
    
    # Public Spaces & Recreation (Medium Priority)
    "playground": 8, "park": 7, "community_centre": 7, "library": 6,

    # Culture & Infrastructure (Low Priority)
    "monument": 5, "museum": 5, "archaeological": 5,
    "water_tower": 4, "water_well": 4,
}

SEVERITY_MAPPING = {
    "Electricity": 10, "Water": 9, "Roads": 7, "Waste": 5,
    "Sanitation": 5, "default": 3
}

# --- Formula Weights ---
W_SEVERITY, W_VOTES, W_LOCATION = 0.5, 0.2, 0.3


def calculate_severity_score(department: str) -> int:
    """Calculates the severity score based on the department."""
    return SEVERITY_MAPPING.get(department, SEVERITY_MAPPING["default"])

def assign_priority_from_score(score: int) -> str:
    """Assigns a priority level ('critical', 'high', etc.) from a numerical score."""
    if score >= 7:
        return 'critical'
    elif score >= 5:
        return 'high'
    elif score >= 2:
        return 'medium'
    else:
        return 'low'

def get_location_score(complaint: Complaint, db: Session) -> int:
    """Calculates the max location score by performing the entire calculation in the database."""
    if not complaint.location:
        return 0

    point = to_shape(complaint.location)
    complaint_wkt = f'POINT({point.x} {point.y})'
    
    # This CASE statement lets the database calculate the score for each POI type
    case_statement = " ".join([f"WHEN type = '{k}' THEN {v}" for k, v in LOCATION_SCORES.items()])

    # A more efficient query that finds the maximum score directly in the DB
    sql_query = text(f"""
        SELECT MAX(CASE {case_statement} ELSE 0 END)
        FROM pois
        WHERE ST_DWithin(geom, ST_GeogFromText(:complaint_loc), 500)
    """)
    
    max_score = db.execute(sql_query, {"complaint_loc": complaint_wkt}).scalar_one_or_none()
    
    return max_score or 0

def calculate_priority_score(complaint: Complaint, db: Session) -> float:
    """Calculates the final weighted priority score for a single complaint."""
    
    s_score = calculate_severity_score(complaint.department)
    
    vote_count = db.query(func.count(Vote.id)).filter(
        Vote.complaint_id == complaint.id,
        Vote.vote_type == 'not_resolved'
    ).scalar() or 0
    v_score = vote_count * 2
    
    l_score = get_location_score(complaint, db)
    
    priority_score = (W_SEVERITY * s_score) + (W_VOTES * v_score) + (W_LOCATION * l_score)
    
    return round(priority_score, 2)