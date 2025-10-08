from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.models.user import DailyReminder, RefillReminder

async def add_daily_reminder_to_user(db: AsyncIOMotorDatabase, user_id: str, reminder: DailyReminder):
    """
    Adds a daily reminder object to a user's document.
    """
    await db["users"].update_one(
        {"_id": ObjectId(user_id)},
        {"$push": {"daily_reminders": reminder.model_dump(by_alias=True)}}
    )

async def add_refill_reminder_to_user(db: AsyncIOMotorDatabase, user_id: str, reminder: RefillReminder):
    """
    Adds a refill reminder object to a user's document.
    """
    await db["users"].update_one(
        {"_id": ObjectId(user_id)},
        {"$push": {"refill_reminders": reminder.model_dump(by_alias=True)}}
    )