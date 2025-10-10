from fastapi import APIRouter
from app.api.v1.endpoints import users, reminders ,auth ,webhooks

api_router = APIRouter()
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(reminders.router, prefix="/reminders", tags=["reminders"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])