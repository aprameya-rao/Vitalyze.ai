
import requests
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

def send_template_message(
    phone_number: str, 
    template_name: str, 
    template_params: list
):
    """
    Sends a pre-approved template message using the WhatsApp Cloud API.
    """
    api_url = (
        f"https://graph.facebook.com/{settings.WHATSAPP_API_VERSION}/"
        f"{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
    )
    
    headers = {
        "Authorization": f"Bearer {settings.WHATSAPP_ACCESS_TOKEN}",
        "Content-Type": "application/json",
    }
    
    # 1. Basic Payload (Always required)
    payload = {
        "messaging_product": "whatsapp",
        "to": phone_number,
        "type": "template",
        "template": {
            "name": template_name,
            "language": {"code": "en_US"},
        },
    }

    if template_params:
        payload["template"]["components"] = [
            {
                "type": "body",
                "parameters": [
                    {"type": "text", "text": param} for param in template_params
                ],
            }
        ]

    try:
        response = requests.post(api_url, headers=headers, json=payload)
        response.raise_for_status()
        
        logger.info(f"WhatsApp message sent to {phone_number}. Response: {response.json()}")
        return True
    except requests.exceptions.RequestException as e:
        # Log the response text to see the exact error from Meta
        error_msg = response.text if response else str(e)
        logger.error(f"Failed to send WhatsApp message to {phone_number}: {e}")
        logger.error(f"Meta API Error Details: {error_msg}")
        return False