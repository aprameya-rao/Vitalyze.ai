from datetime import datetime, timedelta, timezone
from typing import Optional
from passlib.context import CryptContext
from jose import JWTError, jwt

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import settings
from app.crud import crud_user
from app.models.user import UserInDB


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against a hashed one."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hashes a plain password."""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Creates a new JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def authenticate_user(db: AsyncIOMotorDatabase, phone_number: str, password: str) -> Optional[UserInDB]:
    """
    Authenticates a user.
    1. Fetches user by phone number.
    2. Verifies the provided password against the stored hash.
    Returns the user object on success, None on failure.
    """
    user = await crud_user.get_user_by_phone_number(db, phone_number=phone_number)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user