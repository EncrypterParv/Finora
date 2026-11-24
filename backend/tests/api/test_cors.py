import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.config import Settings


@pytest.mark.asyncio
async def test_cors_configured_origins_honoured():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Pre-flight request from allowed origin
        response = await client.options(
            "/health",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET",
            },
        )
        assert response.status_code == 200
        assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"
        assert response.headers.get("access-control-allow-credentials") == "true"

        # Request from disallowed origin
        disallowed_response = await client.options(
            "/health",
            headers={
                "Origin": "http://unauthorized-evil-site.com",
                "Access-Control-Request-Method": "GET",
            },
        )
        assert disallowed_response.headers.get("access-control-allow-origin") is None


def test_cors_wildcard_rejected():
    with pytest.raises(ValueError, match="Wildcard '\\*' CORS origin is not permitted"):
        Settings(BACKEND_CORS_ORIGINS=["*"])

    with pytest.raises(ValueError, match="Wildcard '\\*' CORS origin is not permitted"):
        Settings(BACKEND_CORS_ORIGINS="*")


def test_cors_origins_parsing():
    s1 = Settings(BACKEND_CORS_ORIGINS="http://example.com, https://app.finora.in")
    assert s1.BACKEND_CORS_ORIGINS == ["http://example.com", "https://app.finora.in"]

    s2 = Settings(BACKEND_CORS_ORIGINS='["http://foo.com", "http://bar.com"]')
    assert s2.BACKEND_CORS_ORIGINS == ["http://foo.com", "http://bar.com"]

    s3 = Settings(BACKEND_CORS_ORIGINS="")
    assert s3.BACKEND_CORS_ORIGINS == []
