import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.security import create_access_token
from app.db.seeder import seed_demo_data_if_empty


@pytest.mark.asyncio
async def test_feature_flags_endpoint_requires_auth(client: AsyncClient, monkeypatch):
    # Ensure supabase mode enforces authentication
    monkeypatch.setattr(settings, "AUTH_PROVIDER", "supabase")
    response = await client.get("/settings/flags")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_feature_flags_endpoint_returns_flags(client: AsyncClient, db_session: AsyncSession):
    await seed_demo_data_if_empty(db_session)
    token = create_access_token("user-1")
    headers = {"Authorization": f"Bearer {token}"}

    # Authenticated request to /settings/flags
    response = await client.get("/settings/flags", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "demoMode" in data
    assert "liveMode" in data
    assert data["demoMode"] is True
    assert data["liveMode"] is False

    # Also available at /api/v1/settings/flags
    api_response = await client.get(f"{settings.API_V1_STR}/settings/flags", headers=headers)
    assert api_response.status_code == 200
    assert api_response.json() == data


def test_feature_flags_default_configuration():
    assert settings.FEATURE_FLAGS.get("demoMode") is True
    assert settings.FEATURE_FLAGS.get("liveMode") is False
