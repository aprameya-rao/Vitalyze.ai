from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.user import UserCreate, UserInDB
from bson import ObjectId
from typing import Optional

async def create_user(db: AsyncIOMotorDatabase, *, user_in: UserCreate) -> UserInDB:
    """
    Create a new user in the database.
    """
    user_data = user_in.model_dump()
    result = await db["users"].insert_one(user_data)
    created_user = await db["users"].find_one({"_id": result.inserted_id})
    return UserInDB(**created_user)

async def get_user_by_id(db: AsyncIOMotorDatabase, user_id: str) -> Optional[UserInDB]:
    """
    Get a single user by their ID.
    """
    if not ObjectId.is_valid(user_id):
        return None
    user = await db["users"].find_one({"_id": ObjectId(user_id)})
    if user:
        return UserInDB(**user)
    return None