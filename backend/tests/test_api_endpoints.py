"""End-to-end integration tests for FastAPI v1 endpoints."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.seeder import seed_demo_data_if_empty
from app.db.models.transaction import Transaction


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


@pytest.mark.asyncio
async def test_statement_import_requires_review_and_persists_user_edits(
    client: AsyncClient, db_session: AsyncSession
):
    await seed_demo_data_if_empty(db_session)

    created = await client.post(
        "/api/v1/accounts",
        json={
            "institution_name": "Example Bank",
            "account_type": "SAVINGS",
            "account_last4": "1234",
            "adapter_type": "STATEMENT_IMPORT",
        },
    )
    assert created.status_code == 201
    account = created.json()
    assert account["account_number_masked"].endswith("1234")

    without_last_four = await client.post(
        "/api/v1/accounts",
        json={
            "institution_name": "Other Example Bank",
            "account_type": "CURRENT",
            "adapter_type": "STATEMENT_IMPORT",
        },
    )
    assert without_last_four.status_code == 201
    assert without_last_four.json()["account_number_masked"] == "XXXX-XXXX"

    before = await db_session.scalar(select(func.count()).select_from(Transaction))
    preview = await client.post(
        "/api/v1/statements/preview",
        files={
            "file": (
                "statement.csv",
                b"Date,Description,Debit,Credit,Balance\n2026-10-01,COFFEE SHOP,80,,920\n",
                "text/csv",
            )
        },
    )
    assert preview.status_code == 200
    draft = preview.json()
    assert draft["needs_review"] is True
    assert len(draft["transactions"]) == 1
    after_preview = await db_session.scalar(select(func.count()).select_from(Transaction))
    assert after_preview == before

    transaction = draft["transactions"][0]
    transaction["category_name"] = "Reviewed category"
    import_payload = {
        "account_id": account["id"],
        "source_format": "csv",
        "transactions": [transaction],
    }
    imported = await client.post("/api/v1/statements/import", json=import_payload)
    assert imported.status_code == 200
    assert imported.json()["transactions_added"] == 1

    saved = await client.get("/api/v1/transactions")
    row = next(item for item in saved.json() if item["account_id"] == account["id"])
    assert row["category_name"] == "Reviewed category"

    repeated = await client.post("/api/v1/statements/import", json=import_payload)
    assert repeated.status_code == 200
    assert repeated.json()["transactions_added"] == 0
    assert repeated.json()["duplicates_skipped"] == 1



# Covers budget PATCH (partial update, 422 validation) and DELETE (204, then 404 on repeat).
@pytest.mark.asyncio
async def test_budget_update_and_delete(client: AsyncClient, db_session: AsyncSession):
    await seed_demo_data_if_empty(db_session)
    created = (
        await client.post(
            "/api/v1/budgets",
            json={
                "name": "Travel",
                "total_limit": 20000.0,
                "start_date": "2026-11-01",
                "end_date": "2026-11-30",
            },
        )
    ).json()
    budget_id = created["id"]

    res = await client.patch(f"/api/v1/budgets/{budget_id}", json={"total_limit": 25000.0})
    assert res.status_code == 200
    assert float(res.json()["total_limit"]) == 25000.0
    assert res.json()["name"] == "Travel"

    res = await client.patch(f"/api/v1/budgets/{budget_id}", json={"end_date": "2026-10-01"})
    assert res.status_code == 422

    res = await client.patch(f"/api/v1/budgets/{budget_id}", json={"total_limit": 0})
    assert res.status_code == 422

    res = await client.delete(f"/api/v1/budgets/{budget_id}")
    assert res.status_code == 204
    ids = [b["id"] for b in (await client.get("/api/v1/budgets")).json()]
    assert budget_id not in ids

    assert (await client.delete(f"/api/v1/budgets/{budget_id}")).status_code == 404
    assert (await client.patch(f"/api/v1/budgets/{budget_id}", json={"name": "x"})).status_code == 404


# Covers goal PATCH (partial update, status enum validation) and DELETE (204, then 404 on repeat).
@pytest.mark.asyncio
async def test_goal_update_and_delete(client: AsyncClient, db_session: AsyncSession):
    await seed_demo_data_if_empty(db_session)
    goal_id = (await client.get("/api/v1/goals")).json()[0]["id"]

    res = await client.patch(
        f"/api/v1/goals/{goal_id}",
        json={"current_saved": 150000.0, "status": "PAUSED"},
    )
    assert res.status_code == 200
    body = res.json()
    assert float(body["current_saved"]) == 150000.0
    assert body["status"] == "PAUSED"

    res = await client.patch(f"/api/v1/goals/{goal_id}", json={"status": "DONE"})
    assert res.status_code == 422

    res = await client.delete(f"/api/v1/goals/{goal_id}")
    assert res.status_code == 204
    ids = [g["id"] for g in (await client.get("/api/v1/goals")).json()]
    assert goal_id not in ids
    assert (await client.delete(f"/api/v1/goals/{goal_id}")).status_code == 404
