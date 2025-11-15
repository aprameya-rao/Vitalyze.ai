import asyncio
import redis
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
import sys

print("--- Vitalyze.ai Connection Doctor ---")

# 1. Test Redis (Upstash)
print(f"\nTesting Redis Connection to: {settings.REDIS_URL.split('@')[-1]}...")
try:
    # SIMPLE CONNECTION: We let Redis handle SSL automatically from the 'rediss://' prefix
    r = redis.from_url(settings.REDIS_URL)
    r.ping()
    print("✅ Redis Connection SUCCESSFUL!")
except Exception as e:
    print("❌ Redis Connection FAILED.")
    print(f"   Error: {e}")

# 2. Test MongoDB (No changes needed here since it passed)
async def check_mongo():
    print(f"\nTesting MongoDB Connection to: {settings.MONGO_DB_NAME}...")
    try:
        client = AsyncIOMotorClient(settings.MONGO_URI)
        await client.server_info()
        print("✅ MongoDB Connection SUCCESSFUL!")
    except Exception as e:
        print("❌ MongoDB Connection FAILED.")
        print(f"   Error: {e}")

if __name__ == "__main__":
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(check_mongo())
    print("\n-----------------------------------")