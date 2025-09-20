# backend/config.py
from pydantic_settings import BaseSettings
import os
from typing import Optional # <-- 1. ADD THIS IMPORT

class Settings(BaseSettings):
    DATABASE_URL: Optional[str] = None
    API_BASE_URL: Optional[str] = None
    ADMIN_TOKEN: Optional[str] = None
    GROQ_API_KEY: str
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    STATIC_DIR: str = "static"
    UPLOAD_DIR: str = "static/uploads"
    CORS_ORIGINS: str = "*"

    class Config:
        env_file = os.path.join(os.path.dirname(__file__), ".env")
        env_file_encoding = "utf-8"
        case_sensitive = True

settings = Settings()
