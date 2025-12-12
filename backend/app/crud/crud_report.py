from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.report import ReportCreate, ReportInDB

async def create_report(db: AsyncIOMotorDatabase, report_in: ReportCreate) -> ReportInDB:
    """
    Saves a processed report to the 'reports' collection.
    """
    # Convert Pydantic model to dict
    report_data = report_in.model_dump(by_alias=True, exclude=["id"])
    
    # Insert into MongoDB
    result = await db["reports"].insert_one(report_data)
    
    # Return the created object with the new _id
    created_report = await db["reports"].find_one({"_id": result.inserted_id})
    return ReportInDB(**created_report)