from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from typing import Optional

from app.models.user import UserCreate, UserInDB
from app.core.security import get_password_hash # <-- Import the hasher function

async def get_user_by_phone_number(db: AsyncIOMotorDatabase, phone_number: str) -> Optional[UserInDB]:
    """Get a user by their phone number."""
    user = await db["users"].find_one({"phone_number": phone_number})
    if user:
        return UserInDB(**user)
    return None

async def create_user(db: AsyncIOMotorDatabase, *, user_in: UserCreate) -> UserInDB:
    """Create a new user, hashing the password before saving."""
    user_data = user_in.model_dump()
    
    hashed_password = get_password_hash(user_in.password)
    user_data["hashed_password"] = hashed_password
    
    del user_data["password"]
    
    result = await db["users"].insert_one(user_data)
    created_user = await db["users"].find_one({"_id": result.inserted_id})
    return UserInDB(**created_user)

async def get_user_by_id(db: AsyncIOMotorDatabase, user_id: str) -> Optional[UserInDB]:
    """Get a single user by their ID."""
    if not ObjectId.is_valid(user_id):
        return None
    user = await db["users"].find_one({"_id": ObjectId(user_id)})
    if user:
        return UserInDB(**user)
    return None