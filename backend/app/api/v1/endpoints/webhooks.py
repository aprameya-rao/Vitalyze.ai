# backend/app/api/v1/endpoints/webhooks.py

from fastapi import APIRouter, Request, Query, HTTPException, status
import logging
from app.core.config import settings
from app.tasks.reminder_tasks import send_daily_reminder_task # <-- Add this import

router = APIRouter()
logger = logging.getLogger(__name__)

WEBHOOK_VERIFY_TOKEN = settings.WHATSAPP_VERIFY_TOKEN

@router.get("/whatsapp")
def verify_webhook(
    request: Request,
    mode: str = Query(..., alias="hub.mode"),
    challenge: int = Query(..., alias="hub.challenge"),
    token: str = Query(..., alias="hub.verify_token"),
):
    # ... (code for verify_webhook) ...
    if mode == "subscribe" and token == WEBHOOK_VERIFY_TOKEN:
        return challenge
    else:
        raise HTTPException(status_code=403, detail="Verification failed")

@router.post("/whatsapp")
async def receive_webhook(request: Request):
    # ... (code for receive_webhook) ...
    data = await request.json()
    logger.info(f"Received webhook data: {data}")
    return {"status": "ok"}

# --- ENSURE THIS FUNCTION IS HERE AND SAVED ---
@router.post("/test-whatsapp")
def test_whatsapp_message(phone_number: str):
    """
    A temporary endpoint to test sending a WhatsApp message.
    """
    logger.info(f"Triggering test WhatsApp message to {phone_number}")
    send_daily_reminder_task.delay(
        user_name="Test User",
        phone_number=phone_number,
        medicine_name="Vitamin C"
    )
    return {"message": "Test message task has been queued."}