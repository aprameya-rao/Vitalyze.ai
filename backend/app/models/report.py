from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime
from .user import PyObjectId

class ReportBase(BaseModel):
    # We store the raw filename for reference
    filename: str
    upload_date: datetime = Field(default_factory=datetime.now)

class ReportCreate(ReportBase):
    user_id: PyObjectId
    # The raw text extracted from PDF
    raw_text: str 
    # The "Explain Like I'm 5" summary from Gemini
    simple_summary: str 
    # The structured facts (e.g., {"Hemoglobin": "13.5"}) from Healthcare API
    structured_entities: List[Any] 
    file_storage_path: Optional[str] = None

class ReportInDB(ReportCreate):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")

    class Config:
        json_encoders = {PyObjectId: str}
        arbitrary_types_allowed = True