from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from jose import jwt, JWTError
from motor.motor_asyncio import AsyncIOMotorDatabase

# --- Internal Imports ---
from app.db.mongodb import get_database
from app.crud import crud_user
from app.models.user import UserCreate, UserInDB, Token, TokenData
from app.core import security
from app.core.config import settings

router = APIRouter()

# --- 1. Security Scheme ---
# This tells FastAPI that the token comes from the /login endpoint.
# It creates the "Lock" button in Swagger UI.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


# --- 2. Authentication Dependencies ---

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> UserInDB:
    """
    Decodes the JWT token to get the current user.
    Used as a dependency in other endpoints to secure them.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Decode the token using your SECRET_KEY
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        phone_number: str = payload.get("sub")
        
        if phone_number is None:
            raise credentials_exception
            
        token_data = TokenData(phone_number=phone_number)
        
    except JWTError:
        raise credentials_exception
    
    # Check if user exists in DB
    user = await crud_user.get_user_by_phone_number(db, phone_number=token_data.phone_number)
    if user is None:
        raise credentials_exception
        
    return user


async def get_current_active_user(
    current_user: UserInDB = Depends(get_current_user),
) -> UserInDB:
    """
    Ensures the user is active. 
    (This is the specific function 'reports.py' was trying to import)
    """
    # If you implement user banning later, add the check here:
    # if not current_user.is_active:
    #     raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


# --- 3. API Endpoints ---

@router.post("/register", response_model=UserInDB, status_code=201)
async def register_new_user(
    *,
    db: AsyncIOMotorDatabase = Depends(get_database),
    user_in: UserCreate
):
    """
    Register a new user.
    """
    # Check if user already exists
    user = await crud_user.get_user_by_phone_number(db, phone_number=user_in.phone_number)
    if user:
        raise HTTPException(
            status_code=400,
            detail="A user with this phone number already exists.",
        )
    
    # Create new user
    new_user = await crud_user.create_user(db, user_in=user_in)
    return new_user


@router.post("/login", response_model=Token)
async def login_for_access_token(
    db: AsyncIOMotorDatabase = Depends(get_database),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    Login user to get an access token.
    FastAPI's OAuth2PasswordRequestForm expects:
    - username (which we map to phone_number)
    - password
    """
    # Authenticate user (check password hash)
    user = await security.authenticate_user(
        db, phone_number=form_data.username, password=form_data.password
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect phone number or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # Generate JWT Token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.phone_number}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}