import sys
import os

# 1. SETUP PATH
sys.path.append(os.getcwd())

# 2. IMPORT THE TASK
# Make sure this path matches where your task is located
from app.tasks.reminder_tasks import send_daily_reminder_task

def trigger_celery_task_manual():
    print("--- ⚡ Trigger Celery Task Manually ---")
    
    # 3. GET INPUTS
    target_phone = input("Enter target phone (e.g., 919876543210): ").strip()
    user_name = input("Enter Patient Name: ").strip()
    medicine_name = input("Enter Medicine Name: ").strip()

    if not target_phone or not user_name:
        print("❌ Error: Phone and Name are required.")
        return

    print(f"\n🚀 Queuing task for {user_name}...")

    # 4. TRIGGER THE TASK
    # We use .delay() to send this to the Celery worker.
    # The arguments must match your function signature:
    # def send_daily_reminder_task(user_name, phone_number, medicine_name)
    
    task_result = send_daily_reminder_task.delay(
        user_name=user_name,
        phone_number=target_phone,
        medicine_name=medicine_name
    )

    # 5. CONFIRMATION
    # Since this is async, we only get a Task ID back, not the final success/fail result yet.
    print(f"✅ Task Queued successfully!")
    print(f"🆔 Task ID: {task_result.id}")
    print("👉 Check your running 'celery worker' terminal to see the execution logs.")

if __name__ == "__main__":
    trigger_celery_task_manual()