"""End-to-end integration tests for FastAPI v1 endpoints."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.seeder import seed_demo_data_if_empty


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    res = await client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"


@pytest.mark.asyncio
async def test_calendar_view_endpoint(client: AsyncClient, db_session: AsyncSession):
    # Seed data
    await seed_demo_data_if_empty(db_session)

    res = await client.get("/api/v1/calendar/view?mode=month&year=2026&month=10")
    assert res.status_code == 200
    data = res.json()
    assert data["mode"] == "month"
    assert len(data["days"]) == 31
    assert float(data["total_period_debit"]) >= 0
    assert float(data["total_period_credit"]) >= 0


@pytest.mark.asyncio
async def test_transactions_list_and_detail(client: AsyncClient, db_session: AsyncSession):
    await seed_demo_data_if_empty(db_session)

    # 1. List
    res = await client.get("/api/v1/transactions?limit=20")
    assert res.status_code == 200
    txs = res.json()
    assert len(txs) > 0
    first_id = txs[0]["id"]

    # 2. Detail
    detail_res = await client.get(f"/api/v1/transactions/{first_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["id"] == first_id
    assert "monthly_budget_allocated" in detail
    assert "recommended_daily_spend" in detail


@pytest.mark.asyncio
async def test_budgets_endpoints(client: AsyncClient, db_session: AsyncSession):
    await seed_demo_data_if_empty(db_session)

    # List
    res = await client.get("/api/v1/budgets")
    assert res.status_code == 200
    budgets = res.json()
    assert len(budgets) >= 1

    # Create
    create_res = await client.post(
        "/api/v1/budgets",
        json={
            "name": "Q4 Holiday Budget",
            "period": "MONTHLY",
            "total_limit": 60000.0,
            "start_date": "2026-10-01",
            "end_date": "2026-10-31",
        },
    )
    assert create_res.status_code == 200
    created = create_res.json()
    assert created["name"] == "Q4 Holiday Budget"
    assert float(created["total_limit"]) == 60000.0


@pytest.mark.asyncio
async def test_goals_endpoints(client: AsyncClient, db_session: AsyncSession):
    await seed_demo_data_if_empty(db_session)

    # List
    res = await client.get("/api/v1/goals")
    assert res.status_code == 200
    goals = res.json()
    assert len(goals) >= 1
    assert goals[0]["title"] == "Financial Independence (FIRE)"

    # Create
    create_res = await client.post(
        "/api/v1/goals",
        json={
            "title": "Emergency Fund",
            "goal_type": "SAVINGS",
            "target_amount": 500000.0,
            "current_saved": 100000.0,
            "monthly_contribution": 20000.0,
            "target_date": "2028-12-31",
            "expected_annual_return_pct": 10.0,
        },
    )
    assert create_res.status_code == 200
    created = create_res.json()
    assert created["title"] == "Emergency Fund"


@pytest.mark.asyncio
async def test_analytics_endpoints(client: AsyncClient, db_session: AsyncSession):
    await seed_demo_data_if_empty(db_session)

    # Score
    score_res = await client.get("/api/v1/analytics/score")
    assert score_res.status_code == 200
    score = score_res.json()
    assert 0 <= score["score"] <= 100
    assert "behavioural_archetype" in score

    # Recommendations
    recs_res = await client.get("/api/v1/analytics/recommendations")
    assert recs_res.status_code == 200
    recs = recs_res.json()
    assert isinstance(recs, list)

    # Anomalies
    anom_res = await client.get("/api/v1/analytics/anomalies")
    assert anom_res.status_code == 200
    anomalies = anom_res.json()
    assert isinstance(anomalies, list)


@pytest.mark.asyncio
async def test_bank_sync_endpoint(client: AsyncClient, db_session: AsyncSession):
    await seed_demo_data_if_empty(db_session)

    res = await client.post(
        "/api/v1/bank/sync",
        json={"account_id": "acc-1", "institution_id": "hsbc_demo"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["account_id"] == "acc-1"
    assert "transactions_added" in data
    assert "new_balance" in data
