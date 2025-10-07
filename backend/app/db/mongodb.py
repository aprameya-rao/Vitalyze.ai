from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
import logging

class MongoDB:
    client: AsyncIOMotorClient = None

db = MongoDB()

async def connect_to_mongo():
    """Connects to MongoDB on application startup."""
    logging.info("Connecting to MongoDB...")
    db.client = AsyncIOMotorClient(settings.MONGO_URI)
    logging.info("Successfully connected to MongoDB.")

async def close_mongo_connection():
    """Closes MongoDB connection on application shutdown."""
    logging.info("Closing MongoDB connection...")
    db.client.close()
    logging.info("MongoDB connection closed.")

def get_database():
    """Returns the database instance for dependency injection."""
    return db.client[settings.MONGO_DB_NAME]