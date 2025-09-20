from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import JSONResponse
from groq import Groq
from config import settings
from typing import Optional
import json
from schemas import AIResponse
import logging
from image_classifier import predict_issue_from_image_tf

logger = logging.getLogger(__name__)
router = APIRouter(tags=["AIhelp"])

# Initialize Groq client
groq_client = Groq(api_key=settings.GROQ_API_KEY)

def _system_prompt():
    """Sets the instructions for the language model."""
    return (
        "You are an AI assistant for a civic issue reporting app. "
        "Based on hints, generate a detailed report in valid JSON format. "
        "The JSON must include these keys: 'inferred_title', 'description' (3-4 sentences), "
        "'descriptions' (an array of 4 alternatives), 'suggested_category', 'suggested_department', and 'tags' (2-5 keywords). "
        "The 'suggested_category' and 'suggested_department' should strongly reflect the hints provided."
        "The only allowed categories and departments are roads, bridges, electricity, water, govt buildings, parks, solid waste"
    )

def _user_prompt(title: Optional[str], description: Optional[str], department_from_image: Optional[str]):
    """Creates the prompt with context for the language model."""
    hints = {
        "user_title_hint": title or "",
        "user_description_hint": description or "",
        "department_hint_from_image_analysis": department_from_image or "not available",
    }
    return (
        "Generate a complete civic issue report based on the following hints:\n\n"
        f"{json.dumps(hints, ensure_ascii=False)}\n\n"
        "Ensure the generated description is detailed and specific to the identified issue."
    )

@router.post("/AIhelp/assist", response_model=AIResponse)
async def ai_assist(
    title: Optional[str] = Form(default=None),
    description: Optional[str] = Form(default=None),
    image: Optional[UploadFile] = File(default=None),
):
    logger.info("AI Assist endpoint hit")
    
    # --- 1. Get Department Prediction from the Image (if provided) ---
    predicted_department = None
    if image and image.filename:
        logger.info(f"Image uploaded: {image.filename}, running TF model...")
        image_bytes = await image.read()
        predicted_department = predict_issue_from_image_tf(image_bytes)
        logger.info(f"TF Model Prediction -> Department: {predicted_department}")

    # --- 2. Call Language Model with Enhanced Context ---
    messages = [
        {"role": "system", "content": _system_prompt()},
        {"role": "user", "content": _user_prompt(title, description, predicted_department)},
    ]

    try:
        completion = groq_client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=messages,
            temperature=0.4,
            response_format={"type": "json_object"},
        )
        obj = json.loads(completion.choices[0].message.content)

        # Ensure the department from our superior TF model is used if the LLM misses it
        if not obj.get("suggested_department") and predicted_department:
            obj["suggested_department"] = predicted_department

    except Exception as e:
        logger.error(f"Groq API call failed: {e}")
        # --- 3. Smart Fallback Logic ---
        fallback_desc = description or title or "This issue requires municipal attention and timely intervention."
        obj = {
            "inferred_title": title or "Issue Report",
            "description": fallback_desc,
            "descriptions": [f"{fallback_desc} (Alt {i+1})" for i in range(4)],
            "suggested_category": "general",
            "suggested_department": predicted_department or "unassigned",
            "tags": [predicted_department] if predicted_department else ["general"],
        }

    return AIResponse(**obj)