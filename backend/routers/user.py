from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from pydantic import BaseModel


import models, schemas
from database import get_db
from models import User

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

# password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str):
    return pwd_context.hash(password)


@router.post("/register", response_model=schemas.UserOut)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # check if Aadhaar or email already exists
    existing_user = db.query(models.User).filter(
        (models.User.aadhar_number == user.aadhar_number) | 
        (models.User.email == user.email)
    ).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="User with this Aadhaar or Email already exists")

    # hash password
    hashed_pw = hash_password(user.password)

    new_user = models.User(
        first_name=user.first_name,
        last_name=user.last_name,
        age=user.age,
        aadhar_number=user.aadhar_number,
        email=user.email,
        phnumber=user.phnumber, 
        password_hash=hashed_pw
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # ✅ verify the plain password against hashed password
    if not pwd_context.verify(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return {
        "message": "Login successful",
        "user_id": user.id,
        "email": user.email,
        "role": user.role,
    }
