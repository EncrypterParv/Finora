"""Application configuration settings."""

import json
from typing import Any, Dict, List, Literal
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Finora"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    AUTH_PROVIDER: Literal["local", "supabase"] = "local"
    SUPABASE_URL: str = ""
    SUPABASE_PUBLISHABLE_KEY: str = ""
    
    # Security & JWT
    SECRET_KEY: str = "super-secret-key-change-in-production-0987654321-financialcall"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day for dev convenience
    ALGORITHM: str = "HS256"
    
    # Database
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "financialcall_db"
    POSTGRES_PORT: int = 5432
    DATABASE_URL: str = "sqlite+aiosqlite:///./financialcall.db"  # Defaults to async sqlite for immediate local dev/testing

    # Capability flags are descriptive and never grant authorization.
    FEATURE_FLAGS: Dict[str, bool] = {"demoMode": True, "liveMode": False}

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: Any) -> List[str]:
        if isinstance(value, str):
            value = value.strip()
            if not value:
                return []
            if value.startswith("["):
                value = json.loads(value)
            else:
                value = value.split(",")
        if not isinstance(value, (list, tuple, set)):
            raise ValueError("BACKEND_CORS_ORIGINS must be a list or comma-separated string")
        origins = [str(origin).strip().rstrip("/") for origin in value if str(origin).strip()]
        if "*" in origins:
            raise ValueError("Wildcard CORS origins are not allowed with credentials")
        return origins

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow",
    )


settings = Settings()
