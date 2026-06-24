from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import logging

# --- IMPORT BOTH GOOGLE SDKs ---
import vertexai
from vertexai.generative_models import GenerativeModel as VertexModel
from google.oauth2 import service_account

import google.generativeai as genai
from google.generativeai import GenerativeModel as StudioModel

from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

class ChatRequest(BaseModel):
    message: str

def get_chat_model():
    """
    Helper to initialize the model. 
    Tries GCP Vertex AI first. If the JSON file is missing, falls back to AI Studio API Key.
    """
    # --- ATTEMPT 1: Enterprise Vertex AI (GCP) ---
    json_path = getattr(settings, 'GOOGLE_APPLICATION_CREDENTIALS', None)
    
    if json_path and os.path.exists(json_path):
        logger.info("Initializing Gemini via GCP Vertex AI...")
        my_credentials = service_account.Credentials.from_service_account_file(json_path)
        vertexai.init(
            project=settings.GCP_PROJECT_ID, 
            location=settings.GCP_LOCATION, 
            credentials=my_credentials
        )
        return VertexModel("gemini-2.5-flash")

    # --- ATTEMPT 2: Fallback to Google AI Studio (API Key) ---
    api_key = getattr(settings, 'GEMINI_FREE_API_KEY', None)
    
    if api_key:
        logger.info("GCP JSON missing. Falling back to Gemini via AI Studio API Key...")
        genai.configure(api_key=api_key)
        return StudioModel("gemini-2.5-flash")

    # --- FAILURE: Neither is configured ---
    raise ValueError("Server Configuration Error: Missing both GCP Credentials and GEMINI_API_KEY.")

@router.post("/", response_model=dict)
async def chat_with_medical_assistant(request: ChatRequest):
    """
    Feature #4: AI Chatbot for medical queries.
    """
    try:
        # Initialize model using the fallback logic
        model = get_chat_model()
        
        system_instruction = (
            "You are Vitalyze AI, a helpful and empathetic medical assistant. "
            "Answer the user's health questions in simple, easy-to-understand language. "
            "If the question is serious, advise them to see a doctor. "
            "Do not advise on taking any medication. If asked direct them to reach out to their doctor. "
            "If the question is regarding information about any medicine, follow the below format. "
            "Provide a structured summary for the medicine. Format the response in these 3 clear sections: "
            "1. **What it is used for:** (Simple explanation) "
            "2. **Common Side Effects:** (List format) "
            "3. **Warning/Precautions:** (When to be careful) "
            "Keep it concise and easy to read. Do not answer non-medical questions."
        )
        
        full_prompt = f"{system_instruction}\n\nUser: {request.message}\nAssistant:"
        
        response = model.generate_content(full_prompt)
        return {"response": response.text}
        
    except ValueError as ve:
        # Catches the specific error if both auth methods fail
        logger.error(f"Configuration Error: {ve}")
        raise HTTPException(status_code=503, detail=str(ve))
        
    except Exception as e:
        logger.error(f"Chat Error: {e}")
        raise HTTPException(status_code=500, detail="AI Service is currently unavailable. Please try again later.")