"""API Dependencies for authentication and database sessions."""

from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from pydantic import ValidationError
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.core.database import get_db
from app.db.models.user import User
from app.schemas.auth import TokenData

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False,
)


async def get_current_user_optional(
    db: AsyncSession = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme),
) -> Optional[User]:
    """Resolve the request identity and scope all following SQL to that user."""
    if not token:
        # Preserve old local demo mode only; hosted Supabase mode requires a token.
        if settings.AUTH_PROVIDER == "supabase":
            return None
        result = await db.execute(select(User).limit(1))
        user = result.scalars().first()
        return user

    if settings.AUTH_PROVIDER == "supabase":
        if not settings.SUPABASE_URL or not settings.SUPABASE_PUBLISHABLE_KEY:
            raise HTTPException(status_code=503, detail="Supabase Auth is not configured")
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                response = await client.get(
                    f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/user",
                    headers={
                        "apikey": settings.SUPABASE_PUBLISHABLE_KEY,
                        "Authorization": f"Bearer {token}",
                    },
                )
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=503, detail="Supabase Auth is unavailable") from exc
        if response.status_code in (401, 403):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if response.is_error:
            raise HTTPException(status_code=503, detail="Supabase Auth request failed")
        user_id = response.json().get("id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Could not validate credentials")
    else:
        try:
            payload = jwt.decode(
                token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
            )
            user_id = payload.get("sub")
            if user_id is None:
                return None
            TokenData(user_id=user_id)
        except (jwt.PyJWTError, ValidationError):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

    # The session event applies this identity to each transaction as a local
    # PostgreSQL claim and switches from the table owner to the RLS-scoped role.
    db.info["rls_user_id"] = str(user_id)

    result = await db.execute(select(User).where(User.id == str(user_id)))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


async def get_current_user(
    current_user: Optional[User] = Depends(get_current_user_optional),
) -> User:
    """Enforce authenticated user requirement."""
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return current_user
