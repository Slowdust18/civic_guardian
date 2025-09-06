from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from passlib.context import CryptContext

import models, schemas
from database import get_db

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
