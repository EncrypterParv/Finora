"""Tests for the /calendar/view date handling."""

from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.account import BankAccount
from app.db.models.transaction import Transaction
from app.db.models.user import User

BASE = "/api/v1/calendar/view"


# Creates the request user with one DEBIT on 2026-10-15 (Thu) and one on 2026-10-19 (the next Monday).
async def _setup(db: AsyncSession) -> None:
    """Insert the current user, an account, and two dated transactions."""
    db.add(User(id="user-me", email="me@example.test", full_name="Me"))
    await db.flush()
    db.add(BankAccount(id="acc-me", user_id="user-me", institution_name="A", account_number_masked="XXXX-XXXX-0001"))
    await db.flush()
    for n, day in enumerate((date(2026, 10, 15), date(2026, 10, 19))):
        db.add(
            Transaction(
                user_id="user-me",
                account_id="acc-me",
                occurred_at=datetime(day.year, day.month, day.day, 12, tzinfo=timezone.utc),
                amount=Decimal("100.00"),
                transaction_type="DEBIT",
                raw_description="Coffee",
                reference_id=f"ref-{n}",
                dedup_hash=f"hash-{n}",
            )
        )
    await db.commit()


# Week view returns the Monday-Sunday containing ?date, including when ?date is itself a Monday or Sunday.
@pytest.mark.asyncio
@pytest.mark.parametrize("anchor", ["2026-10-12", "2026-10-15", "2026-10-18"])
async def test_week_view_uses_given_date(client: AsyncClient, db_session: AsyncSession, anchor: str):
    await _setup(db_session)
    res = await client.get(f"{BASE}?mode=week&date={anchor}")
    assert res.status_code == 200
    body = res.json()
    assert body["start_date"] == "2026-10-12"
    assert body["end_date"] == "2026-10-18"
    assert [d["date"] for d in body["days"]] == [f"2026-10-{n}" for n in range(12, 19)]
    assert Decimal(body["total_period_debit"]) == Decimal("100.00")  # 10-19 is next week


# Day view returns only ?date and its transactions.
@pytest.mark.asyncio
async def test_day_view_uses_given_date(client: AsyncClient, db_session: AsyncSession):
    await _setup(db_session)
    body = (await client.get(f"{BASE}?mode=day&date=2026-10-19")).json()
    assert body["start_date"] == body["end_date"] == "2026-10-19"
    assert len(body["days"]) == 1
    assert body["days"][0]["transaction_count"] == 1


# Month view: explicit year/month win; missing ones fall back to ?date.
@pytest.mark.asyncio
async def test_month_view_falls_back_to_date(client: AsyncClient, db_session: AsyncSession):
    await _setup(db_session)
    feb = (await client.get(f"{BASE}?mode=month&date=2026-02-10")).json()
    assert (feb["start_date"], feb["end_date"]) == ("2026-02-01", "2026-02-28")

    oct_ = (await client.get(f"{BASE}?mode=month&year=2026&month=10&date=2026-02-10")).json()
    assert (oct_["start_date"], oct_["end_date"]) == ("2026-10-01", "2026-10-31")

    year_only = (await client.get(f"{BASE}?mode=month&year=2025&date=2026-02-10")).json()
    assert year_only["start_date"] == "2025-02-01"


# Without ?date, week and day still default to today (backward compatible); bad input is a 422.
@pytest.mark.asyncio
async def test_defaults_and_validation(client: AsyncClient, db_session: AsyncSession):
    await _setup(db_session)
    today = date.today()
    week = (await client.get(f"{BASE}?mode=week")).json()
    assert week["start_date"] == (today - timedelta(days=today.weekday())).isoformat()
    day = (await client.get(f"{BASE}?mode=day")).json()
    assert day["start_date"] == today.isoformat()

    assert (await client.get(f"{BASE}?mode=week&date=2026-13-01")).status_code == 422
    assert (await client.get(f"{BASE}?mode=week&date=15-10-2026")).status_code == 422
    assert (await client.get(f"{BASE}?mode=month&year=2026&month=13")).status_code == 422
