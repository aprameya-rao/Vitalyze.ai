from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime
from .user import PyObjectId

class ReportBase(BaseModel):
    filename: str
    upload_date: datetime = Field(default_factory=datetime.now)

class ReportCreate(ReportBase):
    user_id: PyObjectId
    raw_text: str 
    simple_summary: str 
    structured_entities: List[Any] 
    file_storage_path: Optional[str] = None

class ReportInDB(ReportCreate):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")

    class Config:
        json_encoders = {PyObjectId: str}
        arbitrary_types_allowed = True