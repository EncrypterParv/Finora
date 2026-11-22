"""Database session management and declarative base."""

from typing import AsyncGenerator
from sqlalchemy import event, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base
from app.core.config import settings

# Engine configuration
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()


@event.listens_for(AsyncSession.sync_session_class, "after_begin")
def _apply_rls_context(session, _transaction, connection) -> None:
    """Set transaction-local identity and a non-owner role for Supabase RLS."""
    user_id = session.info.get("rls_user_id")
    if connection.dialect.name == "postgresql" and user_id:
        connection.execute(text("SET LOCAL ROLE finora_app"))
        connection.execute(
            text("SELECT set_config('request.jwt.claim.sub', :user_id, true)"),
            {"user_id": str(user_id)},
        )


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for acquiring async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
