# backend/manual_trigger.py
import sys
import os

# Add project root to python path so we can import 'app'
sys.path.append(os.getcwd())

from app.tasks.reminder_tasks import send_daily_reminder_task
from app.services.whatsapp_service import send_template_message

def trigger_hello_world_test():
    # REPLACE WITH YOUR VERIFIED SANDBOX NUMBER
    # Format: Country Code + Number (e.g., 919019267983)
    target_phone = "919019267983" 
    
    print(f"🚀 Sending 'hello_world' to {target_phone}...")

    # --- THE SIMPLIFIED PAYLOAD ---
    template_name = "hello_world"
    params = [] # "hello_world" accepts NO parameters
    
    # We call the service directly to skip Celery for this specific test
    # (This gives us instant feedback in the terminal)
    success = send_template_message(target_phone, template_name, params)

    if success:
        print("✅ Success! Message sent to Meta.")
        print("👉 IF YOU DON'T RECEIVE IT: Open WhatsApp on your phone and reply 'Hello' to the test number.")
    else:
        print("❌ Failed. Check your .env credentials.")

if __name__ == "__main__":
    trigger_hello_world_test()