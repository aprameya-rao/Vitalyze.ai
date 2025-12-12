from fastapi import APIRouter, HTTPException
import vertexai
from vertexai.generative_models import GenerativeModel
from app.core.config import settings

router = APIRouter()

vertexai.init(project=settings.GCP_PROJECT_ID, location=settings.GCP_LOCATION)
model = GenerativeModel("gemini-1.5-flash")

@router.get("/{name}")
async def get_medicine_details(name: str):
    """
    Feature #5: Get details (side effects, usage) for a specific medicine.
    """
    try:
        prompt = f"""
        Provide a structured summary for the medicine: {name}.
        Format the response in these 3 clear sections:
        1. **What it is used for:** (Simple explanation)
        2. **Common Side Effects:** (List format)
        3. **Warning/Precautions:** (When to be careful)
        
        Keep it concise and easy to read.
        """
        
        response = model.generate_content(prompt)
        return {"name": name, "details": response.text}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))