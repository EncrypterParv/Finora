"""Authenticated, non-secret runtime capability flags."""

from typing import Dict

from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.core.config import settings
from app.db.models.user import User

router = APIRouter()


@router.get("/flags", response_model=Dict[str, bool])
async def get_feature_flags(current_user: User = Depends(get_current_user)):
    """Return UI capability flags without exposing other server settings."""
    return dict(settings.FEATURE_FLAGS)
