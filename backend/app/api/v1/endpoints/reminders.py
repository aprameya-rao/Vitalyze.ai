from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field # <-- CORRECT: BaseModel and Field are from pydantic
from typing import List, Literal
from motor.motor_asyncio import AsyncIOMotorDatabase
from celery.schedules import crontab
from datetime import datetime, timedelta

from app.db.mongodb import get_database
from app.crud import crud_user, crud_reminder
from app.models.user import DailyReminder, RefillReminder
from app.tasks.reminder_tasks import send_daily_reminder_task, send_refill_reminder_task
from app.tasks.celery_app import celery

router = APIRouter()

# --- Pydantic models for request bodies ---
class DailyReminderCreate(BaseModel):
    medicine_name: str
    timings: List[Literal["morning", "afternoon", "evening"]]

class RefillReminderCreate(BaseModel):
    medicine_name: str
    initial_quantity: int = Field(..., gt=0)
    frequency_per_day: int = Field(..., gt=0)

# --- Time mapping for daily reminders ---
TIMING_TO_CRONTAB = {
    "morning": crontab(hour=8, minute=0),
    "afternoon": crontab(hour=13, minute=0),
    "evening": crontab(hour=20, minute=0),
}

@router.post("/daily/{user_id}", status_code=201)
async def schedule_daily_reminder(
    user_id: str,
    reminder_in: DailyReminderCreate,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Sets up a recurring daily reminder for a user.
    """
    user = await crud_user.get_user_by_id(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    for timing in reminder_in.timings:
        task_name = f"daily-reminder-{user_id}-{reminder_in.medicine_name}-{timing}"
        celery.add_periodic_task(
            TIMING_TO_CRONTAB[timing],
            send_daily_reminder_task.s(user.name, user.phone_number, reminder_in.medicine_name),
            name=task_name
        )
    
    reminder_db = DailyReminder(**reminder_in.model_dump())
    await crud_reminder.add_daily_reminder_to_user(db, user_id=user_id, reminder=reminder_db)
    
    return {"message": "Daily reminders scheduled successfully."}


@router.post("/refill/{user_id}", status_code=201)
async def schedule_refill_reminder(
    user_id: str,
    reminder_in: RefillReminderCreate,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Schedules a one-time refill reminder for a user.
    """
    user = await crud_user.get_user_by_id(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    days_of_supply = reminder_in.initial_quantity / reminder_in.frequency_per_day
    reminder_delay_days = max(0, days_of_supply - 3)
    refill_date = datetime.utcnow() + timedelta(days=reminder_delay_days)

    task = send_refill_reminder_task.apply_async(
        args=[user.name, user.phone_number, reminder_in.medicine_name],
        eta=refill_date
    )

    reminder_db = RefillReminder(
        **reminder_in.model_dump(),
        refill_date=refill_date,
        celery_task_id=task.id
    )
    await crud_reminder.add_refill_reminder_to_user(db, user_id=user_id, reminder=reminder_db)

    return {
        "message": "Refill reminder scheduled successfully",
        "refill_date": refill_date.isoformat(),
        "celery_task_id": task.id
    }