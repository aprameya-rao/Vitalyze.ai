import logging
import re
import os
import cv2
import numpy as np
import pytesseract
import fitz  # PyMuPDF
import asyncio
from pdf2image import convert_from_path
from typing import List, Dict, Any, Union, Optional

# --- Google Cloud Imports ---
from googleapiclient.discovery import build
from google.oauth2 import service_account
import vertexai
from vertexai.generative_models import GenerativeModel

# --- Database & App Imports ---
from motor.motor_asyncio import AsyncIOMotorClient
from .celery_app import celery
from app.core.config import settings
from app.models.report import ReportCreate

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Tesseract Configuration
custom_config = r'--psm 6'

# ==========================================
# 1. OCR & Text Extraction Helpers
# ==========================================

def pdf_to_cv2_objects(pdf_path: str, dpi: int = 300) -> List[np.ndarray]:
    """
    Converts each page of a PDF file into a list of OpenCV image objects.
    Used for scanned PDFs where direct text extraction fails.
    """
    cv2_images = []
    logger.info(f"Rendering PDF pages to images at {dpi} dpi...")
    try:
        pages = convert_from_path(pdf_path, dpi=dpi)
        for page_image in pages:
            # Convert PIL image to numpy array
            page_array = np.array(page_image)
            # Convert RGB to BGR (OpenCV standard)
            cv2_image = cv2.cvtColor(page_array, cv2.COLOR_RGB2BGR)
            cv2_images.append(cv2_image)
        logger.info(f"Converted {len(pages)} pages to cv2 objects.")
    except Exception as e:
        logger.error(f"Error converting PDF to images: {e}")
        raise e
    return cv2_images

def preprocessor(cv2_image: np.ndarray) -> np.ndarray:
    """
    Applies standard OpenCV techniques to clean image for Tesseract.
    """
    gray = cv2.cvtColor(cv2_image, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    # Use THRESH_OTSU to automatically find the best threshold value
    thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
    return thresh

def extract_text(processed_image: np.ndarray) -> str:
    """
    Runs Tesseract OCR on the preprocessed image.
    """
    return pytesseract.image_to_string(processed_image, lang="eng", config=custom_config)

def extract_text_from_pdf(file_path: str) -> str:
    """
    Hybrid extraction:
    1. Tries direct text extraction (PyMuPDF).
    2. If text is insufficient (scanned PDF), falls back to OCR.
    """
    text = ""
    try:
        # Attempt 1: Direct Extraction
        logger.info(f"Attempting direct text extraction for {file_path}...")
        with fitz.open(file_path) as doc:
            for page in doc:
                text += page.get_text()
        
        # Heuristic: If text is very short, it's likely a scanned image wrapped in PDF
        if len(text.strip()) < 50:
            logger.info("Text too short. Likely scanned. Switching to OCR.")
            raise ValueError("Likely Scanned PDF")
        
        logger.info("Direct text extraction successful.")

    except Exception:
        # Attempt 2: OCR Extraction
        logger.info(f"Running Tesseract OCR pipeline on {file_path}")
        full_ocr_text = []
        try:
            cv2_images = pdf_to_cv2_objects(file_path, dpi=300)
            for i, image in enumerate(cv2_images):
                processed_image = preprocessor(image)
                page_text = extract_text(processed_image)
                full_ocr_text.append(page_text)
                logger.info(f"Processed page {i+1} with Tesseract.")
            text = "\n".join(full_ocr_text)
        except Exception as e:
            logger.error(f"OCR extraction failed: {e}")
            raise e
            
    return text

def parse_indicators(text: str) -> List[Dict[str, str]]:
    """
    Simple regex parser to find standard 'Indicator: Value' patterns.
    Acts as a fallback or quick-view data source.
    """
    pattern = re.compile(r"([A-Za-z\s\(\)/-]+?)\s+([\d\.-]+)\s*([A-Za-z/dL%]+)?")
    found_data = []
    for line in text.split('\n'):
        match = pattern.search(line)
        if match and len(match.groups()) >= 2:
            indicator = match.group(1).strip()
            value = match.group(2).strip()
            if len(indicator) > 2 and len(value) > 0:
                found_data.append({"Indicator": indicator, "Value": value})
    return found_data

# ==========================================
# 2. Google Cloud Healthcare NLP Helper
# ==========================================

def analyze_healthcare_entities(text: str) -> Dict[str, Any]:
    """
    Step 1 of Analysis: Extract structured entities (Medicines, Conditions)
    using Google Cloud Healthcare API.
    """
    try:
        # --- NEW FIX: TRUNCATE TEXT ---
        # The API limit is 20,000 code units. We cut it at 15,000 to be safe.
        if len(text) > 19999:
            logger.warning(f"Text too long ({len(text)} chars). Truncating to 15000 for Healthcare API.")
            text = text[:19999]
        # ------------------------------

        if not os.path.exists(settings.GOOGLE_APPLICATION_CREDENTIALS):
            raise FileNotFoundError(f"Credential file not found at {settings.GOOGLE_APPLICATION_CREDENTIALS}")

        creds = service_account.Credentials.from_service_account_file(
            settings.GOOGLE_APPLICATION_CREDENTIALS
        )

        service = build('healthcare', 'v1', credentials=creds)
        nlp_service_path = f"projects/{settings.GCP_PROJECT_ID}/locations/{settings.GCP_LOCATION}/services/nlp"

        body = {"documentContent": text}
        logger.info("Sending text to Google Healthcare NLP API...")
        
        request = service.projects().locations().services().nlp().analyzeEntities(
            nlpService=nlp_service_path, body=body
        )
        response = request.execute()

        simplified_entities = []
        for entity in response.get('entityMentions', []):
             simplified_entities.append({
                "Description": entity.get('text', {}).get('content'),
                "Type": entity.get('type'), 
                "Confidence": f"{entity.get('confidence', 0):.2f}",
                # "LinkedCodes": [code.get('code') for code in entity.get('linkedEntities', [])]
            })
            
        logger.info(f"Google Healthcare API found {len(simplified_entities)} entities.")
        return {"entities": simplified_entities}

    except Exception as e:
        logger.error(f"Google Healthcare API failed: {e}")
        # Return empty list on failure so the process doesn't crash
        return {"entities": [], "error": str(e)}

# ==========================================
# 3. Google Vertex AI (Gemini) Helper
# ==========================================

def generate_summary_with_gemini(entities: List[Dict], full_text: str) -> str:
    """
    Step 2 of Analysis: Use GenAI (Gemini) to explain the report 
    in simple English.
    """
    try:
        creds = service_account.Credentials.from_service_account_file(
            settings.GOOGLE_APPLICATION_CREDENTIALS
        )
        
        vertexai.init(
            project=settings.GCP_PROJECT_ID, 
            location=settings.GCP_LOCATION, 
            credentials=creds
        )
        
        model = GenerativeModel("gemini-2.5-pro")
        
        prompt = f"""
        You are a helpful medical assistant for a patient using Vitalyze.ai. 
        
        Here is the raw text from their medical report:
        "{full_text[:3000]}..." (truncated if too long)

        Here are the key medical entities extracted from the report:
        {entities}

        Please write a simple, comforting summary of this report for the common person. 
        Follow these rules:
        1. Explain specific values (like "High Blood Pressure" or "Hemoglobin: 12") in plain English.
        2. If medicines are listed, briefly mention what they are commonly used for.
        3. Do not use complex medical jargon without defining it simply.
        4. Keep the tone empathetic but professional.
        5. IMPORTANT: End with a disclaimer that you are an AI and they should consult their doctor.
        """

        logger.info("Sending data to Gemini for summarization...")
        response = model.generate_content(prompt)
        return response.text

    except Exception as e:
        logger.error(f"Gemini Analysis failed: {e}")
        return "Unable to generate AI summary at this time. Please consult your doctor."

# ==========================================
# 4. Celery Tasks (The Pipeline)
# ==========================================

@celery.task(bind=True)
def task_extract_data_from_pdf(self, file_path: str) -> Dict[str, Any]:
    """
    Task 1: Extracts RAW TEXT from the PDF.
    """
    logger.info(f"Starting data extraction for: {file_path}")
    try:
        extracted_text = extract_text_from_pdf(file_path)
        
        # We clean up the file immediately after extraction to save space
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.info(f"Removed temporary file: {file_path}")
            
        return {"full_text": extracted_text}
        
    except Exception as e:
        logger.error(f"Task 1 failed: {e}")
        # Even if extraction fails, we might want to clean up
        if os.path.exists(file_path):
            os.remove(file_path)
        raise e


@celery.task(bind=True)
def task_run_ai_analysis(self, extraction_result: Union[Dict, str], user_id: str, filename: str, gcs_path: Optional[str] = None):
    """
    Task 2: Orchestrates Analysis & Saves to MongoDB.
    """
    logger.info(f"Starting AI analysis for User: {user_id}")
    
    # 1. Parse Input
    text_to_analyze = ""
    if isinstance(extraction_result, dict):
        text_to_analyze = extraction_result.get("full_text", "")
    else:
        text_to_analyze = str(extraction_result)

    if not text_to_analyze:
        logger.error("No text provided for analysis.")
        return {"error": "No text provided"}

    # 2. AI Processing
    # Step A: Healthcare API (Entities)
    extraction_data = analyze_healthcare_entities(text_to_analyze)
    entities = extraction_data.get("entities", [])

    # Step B: Gemini (Summary)
    simple_summary = generate_summary_with_gemini(entities, text_to_analyze)
    
    # 3. Save to MongoDB (Async Logic inside Sync Task)
    async def save_to_db():
        try:
            # Direct connection because dependency injection doesn't work inside Celery
            client = AsyncIOMotorClient(settings.MONGO_URI)
            db = client[settings.MONGO_DB_NAME]
            
            report_in = ReportCreate(
                user_id=user_id,
                filename=filename,
                raw_text=text_to_analyze,
                simple_summary=simple_summary,
                structured_entities=entities,
                file_storage_path=gcs_path
            )
            
            # Convert Pydantic model to dict
            report_data = report_in.model_dump(by_alias=True, exclude=["id"])
            
            await db["reports"].insert_one(report_data)
            logger.info(f"✅ Report saved to DB for user {user_id}")
            client.close()
            return True
        except Exception as db_err:
            logger.error(f"❌ Database Save Failed: {db_err}")
            return False

    # Execute the async save function
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(save_to_db())
        loop.close()
    except Exception as e:
        logger.error(f"Async Loop Failed: {e}")

    # 4. Return result (for API polling)
    return {
        "status": "COMPLETED",
        "structured_entities": entities,
        "simple_summary": simple_summary
    }