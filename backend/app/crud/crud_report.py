from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.report import ReportCreate, ReportInDB

async def create_report(db: AsyncIOMotorDatabase, report_in: ReportCreate) -> ReportInDB:
    """
    Saves a processed report to the 'reports' collection.
    """
    report_data = report_in.model_dump(by_alias=True, exclude=["id"])
    
    result = await db["reports"].insert_one(report_data)
    
    created_report = await db["reports"].find_one({"_id": result.inserted_id})
    return ReportInDB(**created_report)