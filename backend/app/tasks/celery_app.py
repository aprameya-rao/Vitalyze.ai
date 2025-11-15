import ssl
from celery import Celery
from app.core.config import settings

# Force SSL settings for Upstash
# We use ssl.CERT_NONE to avoid "certificate verify failed" errors on local machines.
# In production, you might want to switch this to ssl.CERT_REQUIRED.
ssl_options = {
    'ssl_cert_reqs': ssl.CERT_NONE
}

celery = Celery(
    "app.tasks",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.reminder_tasks", "app.tasks.report_processing"]
)

celery.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=True,
    # Critical SSL settings for Upstash
    broker_use_ssl=ssl_options,
    redis_backend_use_ssl=ssl_options,
    # Connection retry settings
    broker_connection_retry_on_startup=True,
)