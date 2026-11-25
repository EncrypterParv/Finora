import pytest

from app.core.config import Settings


@pytest.mark.parametrize("provider", ["local", "supabase"])
def test_feature_flag_defaults_are_provider_independent(provider):
    configured = Settings(AUTH_PROVIDER=provider)

    assert configured.FEATURE_FLAGS == {"demoMode": True, "liveMode": False}


@pytest.mark.asyncio
async def test_feature_flags_require_authentication(client):
    response = await client.get("/api/v1/settings/flags")

    assert response.status_code == 401
