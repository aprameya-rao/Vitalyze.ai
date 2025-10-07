from fastapi import FastAPI
from contextlib import asynccontextmanager
import logging

from app.db.mongodb import connect_to_mongo, close_mongo_connection
from app.api.v1.api import api_router

# Configure logging to see server events
logging.basicConfig(level=logging.INFO)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Code to run on application startup
    await connect_to_mongo()
    yield
    # Code to run on application shutdown
    await close_mongo_connection()

app = FastAPI(
    title="Vitalyze.ai",
    description="API for simplifying medical reports and managing health.",
    version="1.0.0",
    lifespan=lifespan
)

# Include the main API router with a prefix
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"message": "Welcome to the Vitalyze.ai API"}