"""Tests for real budget spend and burn projections."""

from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal
from itertools import count

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.budgets import _compute_budget_burn
from app.db.models.account import BankAccount
from app.db.models.budget import Budget
from app.db.models.transaction import Transaction
from app.db.models.user import User

BASE = "/api/v1/budgets"
_ref = count()


# Inserts the request user (first user = caller in local auth mode), a second user, and one account each.
async def _setup_users(db: AsyncSession) -> None:
    """Create the current user, another user, and an account for each."""
    db.add_all([
        User(id="user-me", email="me@example.test", full_name="Me"),
        User(id="user-other", email="other@example.test", full_name="Other"),
    ])
    await db.flush()
    db.add_all([
        BankAccount(id="acc-me", user_id="user-me", institution_name="A", account_number_masked="XXXX-XXXX-0001"),
        BankAccount(id="acc-other", user_id="user-other", institution_name="B", account_number_masked="XXXX-XXXX-0002"),
    ])
    await db.commit()


# Adds one transaction at a given UTC moment.
def _tx(db: AsyncSession, when: datetime, amount: str, tx_type: str = "DEBIT", user: str = "me") -> None:
    """Queue a transaction for the given user."""
    n = next(_ref)
    db.add(
        Transaction(
            user_id=f"user-{user}",
            account_id=f"acc-{user}",
            occurred_at=when,
            amount=Decimal(amount),
            transaction_type=tx_type,
            raw_description=f"tx {n}",
            reference_id=f"ref-{n}",
            dedup_hash=f"hash-{n}",
        )
    )


# Midnight UTC on a date, plus an optional offset.
def _at(d: date, offset: timedelta = timedelta()) -> datetime:
    """Return a UTC datetime at the start of the date plus offset."""
    return datetime.combine(d, time.min, tzinfo=timezone.utc) + offset


# Only the user's in-range DEBITs count; projections agree across GET, POST and PATCH for an in-progress budget.
@pytest.mark.asyncio
async def test_in_progress_budget_spend_and_projection(client: AsyncClient, db_session: AsyncSession):
    await _setup_users(db_session)
    today = datetime.now(timezone.utc).date()
    start, end = today - timedelta(days=4), today + timedelta(days=5)  # 5 elapsed days, 5 remaining

    _tx(db_session, _at(start), "300.00")                                         # first instant: in
    _tx(db_session, _at(today, timedelta(hours=8)), "200.00")                      # in
    _tx(db_session, _at(end, timedelta(hours=23, minutes=59, seconds=59)), "100.00")  # last second: in
    _tx(db_session, _at(today), "5000.00", tx_type="CREDIT")                       # credit: out
    _tx(db_session, _at(start, -timedelta(seconds=1)), "999.00")                   # day before: out
    _tx(db_session, _at(end + timedelta(days=1)), "999.00")                        # day after: out
    _tx(db_session, _at(today), "777.00", user="other")                            # other user: out
    await db_session.commit()

    res = await client.post(
        BASE,
        json={"name": "Trip", "total_limit": 1000, "start_date": start.isoformat(), "end_date": end.isoformat()},
    )
    assert res.status_code == 200
    created = res.json()
    # spent 600 over 5 days -> 120/day; 600 + 120*5 = 1200; 400 left / 120 = 3.33 -> limit hit in 4 days
    assert Decimal(created["total_spent"]) == Decimal("600.00")
    assert Decimal(created["projected_burn_total"]) == Decimal("1200.00")
    assert created["projected_exhaustion_date"] == (today + timedelta(days=4)).isoformat()
    assert created["categories"] == []

    listed = next(b for b in (await client.get(BASE)).json() if b["id"] == created["id"])
    assert listed == created

    over = (await client.patch(f"{BASE}/{created['id']}", json={"total_limit": 500})).json()
    assert Decimal(over["total_spent"]) == Decimal("600.00")
    assert over["projected_exhaustion_date"] == today.isoformat()

    roomy = (await client.patch(f"{BASE}/{created['id']}", json={"total_limit": 5000})).json()
    assert Decimal(roomy["projected_burn_total"]) == Decimal("1200.00")
    assert roomy["projected_exhaustion_date"] is None


# A budget that starts in the future reports zero spend and no projection, even with DEBITs dated inside it.
@pytest.mark.asyncio
async def test_future_budget_has_no_projection(client: AsyncClient, db_session: AsyncSession):
    await _setup_users(db_session)
    start = datetime.now(timezone.utc).date() + timedelta(days=3)
    _tx(db_session, _at(start, timedelta(hours=1)), "250.00")
    await db_session.commit()

    body = (
        await client.post(
            BASE,
            json={"name": "Later", "total_limit": 1000, "start_date": start.isoformat(),
                  "end_date": (start + timedelta(days=10)).isoformat()},
        )
    ).json()
    assert Decimal(body["total_spent"]) == Decimal("0")
    assert body["projected_burn_total"] is None
    assert body["projected_exhaustion_date"] is None


# An ended budget has no remaining days: projected total equals spent, and never an exhaustion date, even if over.
@pytest.mark.asyncio
async def test_ended_budget_uses_full_window(db_session: AsyncSession):
    await _setup_users(db_session)
    _tx(db_session, _at(date(2026, 10, 10)), "310.00")
    _tx(db_session, _at(date(2026, 10, 31), timedelta(hours=12)), "310.00")
    await db_session.commit()
    budget = Budget(id="b1", user_id="user-me", name="Oct", total_limit=Decimal("1000"),
                    start_date=date(2026, 10, 1), end_date=date(2026, 10, 31))

    burn = await _compute_budget_burn(db_session, budget, "user-me", today=date(2026, 11, 22))
    assert burn.total_spent == Decimal("620.00")
    assert burn.projected_burn_total == Decimal("620.00")
    assert burn.projected_exhaustion_date is None

    budget.total_limit = Decimal("500")  # 620 spent: over the limit
    over = await _compute_budget_burn(db_session, budget, "user-me", today=date(2026, 11, 22))
    assert over.total_spent == Decimal("620.00")
    assert over.projected_exhaustion_date is None

    # On its last day the budget hasn't ended yet, so being over still reports today.
    last_day = await _compute_budget_burn(db_session, budget, "user-me", today=date(2026, 10, 31))
    assert last_day.projected_exhaustion_date == date(2026, 10, 31)
