from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, *args, **kwargs):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

class UserBase(BaseModel):
    name: str
    phone_number: str = Field(..., pattern=r"^\+[1-9]\d{1,14}$")
    age: Optional[int] = Field(None, gt=0)
    gender: Optional[str] = None

class UserCreate(UserBase):
    # This model is used when creating a new user.
    pass

class UserInDB(UserBase):
    # This model represents how user data is stored in the database.
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.now)

    class Config:
        # Allows FastAPI to correctly handle and convert MongoDB's ObjectId.
        json_encoders = {ObjectId: str}
        arbitrary_types_allowed = True