from celery import Celery
from app.core.config import settings

# Create the Celery app instance using the cloud Redis URL
celery = Celery(
    "tasks",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.reminder_tasks"]
)

celery.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata", # Set to your timezone
    enable_utc=True,
)