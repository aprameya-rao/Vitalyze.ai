from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import timedelta

from app.db.mongodb import get_database
from app.crud import crud_user
from app.models.user import UserCreate, UserInDB, Token
from app.core import security
from app.core.config import settings

router = APIRouter()

@router.post("/register", response_model=UserInDB, status_code=201)
async def register_new_user(
    *,
    db: AsyncIOMotorDatabase = Depends(get_database),
    user_in: UserCreate
):
    """
    Register a new user.
    """
    user = await crud_user.get_user_by_phone_number(db, phone_number=user_in.phone_number)
    if user:
        raise HTTPException(
            status_code=400,
            detail="A user with this phone number already exists.",
        )
    new_user = await crud_user.create_user(db, user_in=user_in)
    return new_user

@router.post("/login", response_model=Token)
async def login_for_access_token(
    db: AsyncIOMotorDatabase = Depends(get_database),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    Login user to get an access token.
    FastAPI expects the phone number in the 'username' field of the form.
    """
    user = await security.authenticate_user(
        db, phone_number=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect phone number or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.phone_number}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}