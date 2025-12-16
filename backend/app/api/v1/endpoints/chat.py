from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import vertexai
from vertexai.generative_models import GenerativeModel
from google.oauth2 import service_account  # <--- IMPORT THIS
from app.core.config import settings
import os

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

def get_chat_model():
    """
    Helper to initialize the model with explicit credentials.
    """
    # 1. Check if file exists to give a clear error if missing
    if not os.path.exists(settings.GOOGLE_APPLICATION_CREDENTIALS):
        raise FileNotFoundError(f"Credential file not found at: {settings.GOOGLE_APPLICATION_CREDENTIALS}")

    # 2. Load the credentials from the JSON file
    my_credentials = service_account.Credentials.from_service_account_file(
        settings.GOOGLE_APPLICATION_CREDENTIALS
    )

    # 3. Initialize Vertex AI with these credentials
    vertexai.init(
        project=settings.GCP_PROJECT_ID, 
        location=settings.GCP_LOCATION, 
        credentials=my_credentials
    )
    
    return GenerativeModel("gemini-2.5-pro")

@router.post("/", response_model=dict)
async def chat_with_medical_assistant(request: ChatRequest):
    """
    Feature #4: AI Chatbot for medical queries.
    """
    try:
        # Initialize model inside the request to ensure creds are loaded
        model = get_chat_model()
        
        system_instruction = (
            "You are Vitalyze AI, a helpful and empathetic medical assistant. "
            "Answer the user's health questions in simple, easy-to-understand language. "
            "If the question is serious, advise them to see a doctor. "
            "Do not answer non-medical questions."
        )
        
        full_prompt = f"{system_instruction}\n\nUser: {request.message}\nAssistant:"
        
        response = model.generate_content(full_prompt)
        return {"response": response.text}
        
    except FileNotFoundError as fnf:
        # Specific error if JSON is missing
        print(f"Error: {fnf}")
        raise HTTPException(status_code=500, detail="Server Configuration Error: GCP Credentials file missing.")
        
    except Exception as e:
        print(f"Chat Error: {e}") # Print to console for debugging
        raise HTTPException(status_code=500, detail=f"AI Service Error: {str(e)}")