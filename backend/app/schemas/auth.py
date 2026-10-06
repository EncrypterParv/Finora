"""Authentication and User schemas."""

from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    currency: str = "INR"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    currency: str
    preferences: Dict[str, Any]
    created_at: datetime

    model_config = {"from_attributes": True}
