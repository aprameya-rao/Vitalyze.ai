import logging
from .celery_app import celery

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Placeholder Functions (to be replaced with your logic) ---

def generate_ai_message(user_name: str, medicine_name: str, message_type: str) -> str:
    """Generates a personalized AI message. TODO: Implement your LLM logic."""
    if message_type == "daily":
        return f"Hello {user_name}! This is a friendly reminder from Vitalyze.ai to take your {medicine_name}."
    elif message_type == "refill":
        return f"Hi {user_name}, your supply of {medicine_name} is running low. Please remember to refill it soon!"
    return "This is a reminder from Vitalyze.ai."

def send_whatsapp_message(phone_number: str, message: str):
    """Sends a message using the WhatsApp Cloud API. TODO: Implement the API call."""
    logger.info(f"SIMULATING sending WhatsApp message to {phone_number}: '{message}'")
    logger.info("Message sent successfully (simulation).")
    return True

# --- Celery Tasks ---

@celery.task
def send_daily_reminder_task(user_name: str, phone_number: str, medicine_name: str):
    """Celery task to generate and send a daily medicine reminder."""
    logger.info(f"Executing daily reminder for {user_name} for medicine {medicine_name}.")
    message = generate_ai_message(user_name, medicine_name, "daily")
    send_whatsapp_message(phone_number, message)
    return f"Daily reminder sent to {user_name} for {medicine_name}."

@celery.task
def send_refill_reminder_task(user_name: str, phone_number: str, medicine_name: str):
    """Celery task to generate and send a refill reminder."""
    logger.info(f"Executing refill reminder for {user_name} for medicine {medicine_name}.")
    message = generate_ai_message(user_name, medicine_name, "refill")
    send_whatsapp_message(phone_number, message)
    return f"Refill reminder sent to {user_name} for {medicine_name}."