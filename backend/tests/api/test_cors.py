import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from app.core.config import Settings
from app.main import configure_cors


@pytest.mark.asyncio
async def test_configured_cors_origin_is_honored():
    origins = Settings(
        BACKEND_CORS_ORIGINS="https://app.finora.example, https://admin.finora.example"
    ).BACKEND_CORS_ORIGINS
    app = FastAPI()
    configure_cors(app, origins)

    @app.get("/")
    async def read_root():
        return {"ok": True}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.options(
            "/",
            headers={
                "Origin": "https://app.finora.example",
                "Access-Control-Request-Method": "GET",
            },
        )

    assert response.headers["access-control-allow-origin"] == "https://app.finora.example"


def test_wildcard_cors_origin_is_rejected_with_credentials():
    with pytest.raises(ValueError, match="Wildcard CORS origins"):
        Settings(BACKEND_CORS_ORIGINS=["*"])
