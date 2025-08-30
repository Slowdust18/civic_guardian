from fastapi import FastAPI
from pydantic import BaseModel
from typing import List

app = FastAPI()

# Temporary "database" (in-memory list)
users_db = []


from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # your React frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic model (for request validation)
class User(BaseModel):
    name: str
    age: int
    phone: str
    address: str

@app.post("/users/")
def create_user(user: User):
    users_db.append(user.dict())  # store in memory
    return {"message": "User added successfully", "user": user}

@app.get("/users/", response_model=List[User])
def get_users():
    return users_db
