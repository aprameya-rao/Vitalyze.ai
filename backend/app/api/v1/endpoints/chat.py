from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import vertexai
from vertexai.generative_models import GenerativeModel
from app.core.config import settings

router = APIRouter()

vertexai.init(project=settings.GCP_PROJECT_ID, location=settings.GCP_LOCATION)
model = GenerativeModel("gemini-1.5-flash")

class ChatRequest(BaseModel):
    message: str

@router.post("/", response_model=dict)
async def chat_with_medical_assistant(request: ChatRequest):
    """
    Feature #4: AI Chatbot for medical queries.
    """
    try:
        system_instruction = (
            "You are Vitalyze AI, a helpful and empathetic medical assistant. "
            "Answer the user's health questions in simple, easy-to-understand language. "
            "If the question is serious, advise them to see a doctor. "
            "Do not answer non-medical questions."
        )
        
        full_prompt = f"{system_instruction}\n\nUser: {request.message}\nAssistant:"
        
        response = model.generate_content(full_prompt)
        return {"response": response.text}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Service Error: {str(e)}")