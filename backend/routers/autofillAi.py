from fastapi import APIRouter, UploadFile, Form
from fastapi.responses import JSONResponse
from groq import Groq
from config import settings
from typing import Optional
import json
from schemas import AIResponse
import logging
logger = logging.getLogger(__name__)
router = APIRouter(
    tags=["AIhelp"])

# Initialize Groq client
groq_client = Groq(api_key=settings.GROQ_API_KEY)

def _system_prompt():
    return (
        "You are an AI assistant for a civic issue reporting app. "
        "Given partial issue details, output valid JSON with these keys: "
        "inferred_title, description (4–8 sentences), descriptions (4 alternatives), "
        "suggested_category [potholes, electricity, water, waste, parks, govt buildings, bridges], "
        "suggested_department [ROADS, ELECTRICITY, WATER, WASTE, PARKS, GOVT BUILDINGS], "
        "and tags (2–5 keywords). "
        "Always return valid JSON. Never leave fields empty."
    )

def _user_prompt(title, description, category, department, urgency):
    payload = {
        "title": title or "",
        "description": description or "",
        "category_hint": category or "",
        "department_hint": department or "",
        "urgency_hint": urgency or "",
    }
    return (
        "The user provided this partial report JSON:\n\n"
        f"{json.dumps(payload, ensure_ascii=False)}\n\n"
        "Now generate a completed JSON with ALL required fields filled. "
        "The main 'description' must be between 4 and 8 full sentences, realistic and specific to the civic issue. "
        "The 'descriptions' array must contain exactly 4 alternative versions, each 4–8 sentences long, not copies. "
        "If description is missing or empty, invent a plausible and detailed one."
    )


@router.post("/AIhelp/assist", response_model=AIResponse)
async def ai_assist(
    title: Optional[str] = Form(default=None),
    description: Optional[str] = Form(default=None),
    category: Optional[str] = Form(default=None),
    department: Optional[str] = Form(default=None),
):
    logger.info("AI Assist endpoint hit")
    logger.info(f"title={title}, description={description}, category={category}, department={department}")
    ...
    messages = [
        {"role": "system", "content": _system_prompt()},
        {"role": "user", "content": _user_prompt(title, description, category, department, None)},
    ]

    try:
        completion = groq_client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=messages,
            temperature=0.4,  # lower = more consistent output
            response_format={"type": "json_object"},
        )
        obj = json.loads(completion.choices[0].message.content)
    except Exception as e:
        # Fallback in case Groq fails
        fallback_desc = description or title or "This issue requires municipal attention."
        long_fallback = (
            f"{fallback_desc}. It continues to inconvenience residents, "
            "may worsen if ignored, and needs timely municipal intervention."
        )
        obj = {
            "inferred_title": title or "Issue Report",
            "description": long_fallback,
            "descriptions": [f"{long_fallback} (Alt {i+1})" for i in range(4)],
            "suggested_category": category or "potholes",
            "suggested_department": department or "ROADS",
            "tags": ["general"],
        }

    return AIResponse(**obj)
