from fastapi import APIRouter
from app.api.v1.endpoints import users, reminders ,auth ,webhooks,reports,maps

api_router = APIRouter()
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(reminders.router, prefix="/reminders", tags=["reminders"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(maps.router, prefix="/maps", tags=["maps"])
