"""Application configuration settings."""

from typing import Any, List, Literal, Union
import json
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
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            v = v.strip()
            if not v:
                return []
            if v.startswith("[") and v.endswith("]"):
                try:
                    parsed = json.loads(v)
                    if isinstance(parsed, list):
                        return [str(item).strip() for item in parsed if str(item).strip()]
                except Exception:
                    pass
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        elif isinstance(v, (list, tuple, set)):
            return [str(origin).strip() for origin in v if str(origin).strip()]
        return []

    @field_validator("BACKEND_CORS_ORIGINS")
    @classmethod
    def validate_cors_origins(cls, v: List[str]) -> List[str]:
        for origin in v:
            if origin == "*":
                raise ValueError("Wildcard '*' CORS origin is not permitted when credentials are enabled.")
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow",
    )


settings = Settings()
