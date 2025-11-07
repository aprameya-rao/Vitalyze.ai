# backend/app/tasks/report_processing.py

import logging
import re
import os
import fitz  # PyMuPDF
import easyocr
from .celery_app import celery

logger = logging.getLogger(__name__)

# We keep the helper functions from before
reader = easyocr.Reader(['en'])

def extract_text_from_pdf(file_path: str) -> str:
    # ... (this helper function's code remains exactly the same) ...
    text = ""
    try:
        with fitz.open(file_path) as doc:
            for page in doc:
                text += page.get_text()
        if len(text.strip()) < 100:
            text = ""
            raise ValueError("Likely a scanned PDF")
    except Exception:
        logger.info(f"Performing OCR on {file_path}")
        full_ocr_text = []
        doc = fitz.open(file_path)
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            pix = page.get_pixmap(dpi=300)
            img_bytes = pix.tobytes("png")
            ocr_results = reader.readtext(img_bytes)
            page_text = " ".join([res[1] for res in ocr_results])
            full_ocr_text.append(page_text)
        text = "\n".join(full_ocr_text)
    return text

def parse_indicators(text: str) -> list:
    # ... (this helper function's code remains exactly the same) ...
    pattern = re.compile(r"([A-Za-z\s\(\)/-]+?)\s+([\d\.-]+)\s*([A-Za-z/dL%]+)?")
    found_data = []
    for line in text.split('\n'):
        match = pattern.search(line)
        if match and len(match.groups()) >= 2:
            indicator = match.group(1).strip()
            value = match.group(2).strip()
            if any(char.isalpha() for char in indicator) and len(indicator) > 2:
                found_data.append({"Indicator": indicator, "Value": value})
    return found_data


# --- NEW SPLIT TASKS ---

@celery.task(bind=True)
def task_extract_data_from_pdf(self, file_path: str):
    """
    Task 1: Processes the PDF to extract structured data.
    """
    logger.info(f"Starting data extraction for: {file_path}")
    try:
        extracted_text = extract_text_from_pdf(file_path)
        data = parse_indicators(extracted_text)
        if not data:
            logger.warning(f"Could not parse any indicators from {file_path}")
        return data  # Return the structured data
    except Exception as e:
        self.update_state(state='FAILURE', meta={'exc_type': type(e).__name__, 'exc_message': str(e)})
        raise e
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.info(f"Removed temporary file: {file_path}")

@celery.task(bind=True)
def task_run_ai_analysis(self, data: list):
    """
    Task 2: Takes structured data and runs AI analysis (placeholder).
    """
    logger.info(f"Starting AI analysis for data: {data}")
    # TODO: Implement actual AI analysis logic here
    import time
    time.sleep(5) # Simulate AI work
    result = {
        "summary": "This is a placeholder AI summary.",
        "recommendations": "Based on the data, we recommend consulting a doctor."
    }
    return result