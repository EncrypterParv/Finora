"""Main FastAPI application entrypoint."""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.api.v1.settings import router as settings_router
from app.core.config import settings
from app.core.database import Base, engine, AsyncSessionLocal
import app.db.models.base  # Register all models
from app.db.seeder import seed_demo_data_if_empty


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle startup and shutdown handler."""
    # Supabase schema is managed only through checked-in SQL migrations.
    if settings.AUTH_PROVIDER == "local":
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        async with AsyncSessionLocal() as session:
            await seed_demo_data_if_empty(session)

    yield
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Financial Behaviour Intelligence Platform API",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

import logging

logger = logging.getLogger("finora.cors")

# CORS middleware
if not settings.BACKEND_CORS_ORIGINS:
    logger.warning("CORS: BACKEND_CORS_ORIGINS is empty; all cross-origin browser requests will be blocked.")
else:
    if "*" in settings.BACKEND_CORS_ORIGINS:
        raise ValueError("Wildcard '*' CORS origin is not permitted when credentials are enabled.")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        # Lets browser code read the pagination total, like cors({ exposedHeaders: [...] }).
        expose_headers=["X-Total-Count"],
    )

app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(settings_router, prefix="/settings", tags=["Settings"])


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "platform": settings.PROJECT_NAME,
        "version": settings.VERSION,
    }
