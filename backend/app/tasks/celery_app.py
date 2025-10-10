# backend/app/tasks/celery_app.py

import ssl  # <--- IMPORT THIS MODULE
from celery import Celery
from app.core.config import settings

# Create the Celery app instance
celery = Celery(
    "tasks",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.reminder_tasks"]
)

# Update the Celery configuration
celery.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=True,
    # --- UPDATE THESE LINES ---
    broker_use_ssl={
        'ssl_cert_reqs': ssl.CERT_NONE  # Use the constant, not the string
    },
    redis_backend_use_ssl={
        'ssl_cert_reqs': ssl.CERT_NONE  # Use the constant, not the string
    }
)