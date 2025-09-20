from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import traceback

from database import Base, engine
import models
from routers import complaints, admin, user, votes, autofillAi, resolved
from dotenv import load_dotenv


app = FastAPI()

# 🔹 CORS
origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🔹 Static files (for images)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# 🔹 Auto-create tables (dev only)
Base.metadata.create_all(bind=engine)

# ✅ GLOBAL ERROR HANDLER
@app.exception_handler(Exception)
async def all_exception_handler(request, exc: Exception):
    print("ERROR:", traceback.format_exc())  # Logs in terminal
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
    )

# 🔹 Root endpoint
@app.get("/")
async def root():
    return {"message": "Civic Guardian API running"}

# 🔹 Routers
app.include_router(complaints.router)
app.include_router(admin.router)
app.include_router(user.router)
app.include_router(votes.router)
app.include_router(autofillAi.router)
app.include_router(resolved.router)
