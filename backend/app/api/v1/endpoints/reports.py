# backend/app/api/v1/endpoints/reports.py

import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from pydantic import BaseModel
from typing import List, Dict, Any
from pathlib import Path
from celery.result import AsyncResult
from app.tasks.celery_app import celery

# Import our new split Celery tasks
from app.tasks.report_processing import task_extract_data_from_pdf, task_run_ai_analysis

router = APIRouter()

UPLOAD_DIR = Path("temp_uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Define a Pydantic model for the data we expect for analysis
class AnalysisRequest(BaseModel):
    data: List[Dict[str, Any]]

@router.post("/upload", status_code=status.HTTP_202_ACCEPTED)
def upload_report(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid file type.")
    try:
        file_path = UPLOAD_DIR / file.filename
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Trigger the FIRST task (PDF to data extraction)
        task = task_extract_data_from_pdf.delay(str(file_path))
        
        return {"task_id": task.id, "message": "Report is being processed for data extraction."}
    finally:
        file.file.close()

# --- NEW ENDPOINT ---
@router.post("/analyze", status_code=status.HTTP_202_ACCEPTED)
def analyze_data(request: AnalysisRequest):
    """
    Accepts structured data and queues it for AI analysis.
    """
    # Trigger the SECOND task (AI analysis)
    task = task_run_ai_analysis.delay(request.data)
    return {"task_id": task.id, "message": "Data is being analyzed."}


@router.get("/status/{task_id}")
def get_task_status(task_id: str):
    task_result = AsyncResult(task_id, app=celery)
    if task_result.state == 'SUCCESS':
        return {"status": "SUCCESS", "data": task_result.result}
    elif task_result.state == 'FAILURE':
        return {"status": "FAILURE", "error": str(task_result.info)}
    else:
        return {"status": task_result.state}