from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional

from app.db.mongodb import get_database
from app.crud import crud_user
from app.models.user import UserInDB

router = APIRouter()

@router.get("/{user_id}", response_model=UserInDB)
async def read_user_by_id(
    user_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Retrieve a user by their ID.
    """
    user = await crud_user.get_user_by_id(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
