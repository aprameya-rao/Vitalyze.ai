import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from pydantic import BaseModel
from typing import List, Dict, Any
from pathlib import Path
from celery.result import AsyncResult
from celery import chain # <--- IMPORT THIS

from app.tasks.celery_app import celery
from app.tasks.report_processing import task_extract_data_from_pdf, task_run_ai_analysis

router = APIRouter()

UPLOAD_DIR = Path("temp_uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

class AnalysisRequest(BaseModel):
    data: Any # Changed to Any to accept string or dict

@router.post("/upload", status_code=status.HTTP_202_ACCEPTED)
def upload_report(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid file type.")
    try:
        file_path = UPLOAD_DIR / file.filename
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # --- THE CHANGE: Create a Chain ---
        # 1. Run Extraction (s() means signature/subtask)
        # 2. Pass result to AI Analysis
        workflow = chain(
            task_extract_data_from_pdf.s(str(file_path)),
            task_run_ai_analysis.s()
        )
        
        # Execute the chain
        task = workflow.apply_async()
        
        return {
            "task_id": task.id, 
            "message": "Report uploaded. Extraction and AI Analysis started automatically."
        }
    finally:
        file.file.close()

@router.get("/status/{task_id}")
def get_task_status(task_id: str):
    """
    Check the status of the chain. 
    Note: In a chain, the task_id returned above is for the *last* task in the chain.
    """
    task_result = AsyncResult(task_id, app=celery)
    
    if task_result.state == 'SUCCESS':
        return {"status": "SUCCESS", "result": task_result.result}
    elif task_result.state == 'FAILURE':
        return {"status": "FAILURE", "error": str(task_result.info)}
    else:
        # PENDING or PROCESSING
        return {"status": task_result.state}