"""Integration tests for /transactions filtering, manual entry, and deletion."""

from datetime import datetime, timedelta, timezone
from decimal import Decimal

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.account import BankAccount
from app.db.models.transaction import Transaction
from app.db.models.user import User

BASE = "/api/v1/transactions"

# (id, account, occurred_at UTC, amount, type, description) for the current user.
MY_TXS = [
    ("t1", "acc-me", datetime(2026, 10, 1, 9, 0), "100.00", "DEBIT", "Coffee at Blue Tokai"),
    ("t2", "acc-me", datetime(2026, 10, 5, 12, 0), "2500.00", "CREDIT", "Salary refund"),
    ("t3", "acc-me2", datetime(2026, 10, 10, 23, 59, 59), "500.00", "DEBIT", "50% OFF sale"),
    ("t4", "acc-me", datetime(2026, 10, 11, 0, 0), "750.00", "TRANSFER", "Transfer to savings"),
    ("t5", "acc-me2", datetime(2026, 10, 20, 18, 0), "50.00", "DEBIT", "COFFEE beans"),
]


# Builds one Transaction row with unique reference/dedup values.
def _tx(tx_id: str, user: str, account: str, when: datetime, amount: str, tx_type: str, desc: str) -> Transaction:
    """Return an unsaved Transaction for the given owner."""
    return Transaction(
        id=tx_id,
        user_id=user,
        account_id=account,
        occurred_at=when.replace(tzinfo=timezone.utc),
        amount=Decimal(amount),
        transaction_type=tx_type,
        raw_description=desc,
        reference_id=f"ref-{tx_id}",
        dedup_hash=f"hash-{tx_id}",
    )


# Creates the request user (first user = caller in local auth mode) with two accounts and MY_TXS,
# plus another user whose account and "Coffee" transaction must never leak.
@pytest.fixture
async def seeded(db_session: AsyncSession) -> AsyncSession:
    """Insert users, accounts and transactions for the tests in this module."""
    db_session.add_all([
        User(id="user-me", email="me@example.test", full_name="Me"),
        User(id="user-other", email="other@example.test", full_name="Other"),
    ])
    await db_session.flush()
    db_session.add_all([
        BankAccount(id="acc-me", user_id="user-me", institution_name="A",
                    account_number_masked="XXXX-XXXX-0001", current_balance=Decimal("1000.00")),
        BankAccount(id="acc-me2", user_id="user-me", institution_name="B",
                    account_number_masked="XXXX-XXXX-0002", currency="USD"),
        BankAccount(id="acc-other", user_id="user-other", institution_name="C",
                    account_number_masked="XXXX-XXXX-0003"),
    ])
    await db_session.flush()
    db_session.add_all([_tx(i, "user-me", a, w, amt, t, d) for i, a, w, amt, t, d in MY_TXS])
    db_session.add(_tx("t-other", "user-other", "acc-other", datetime(2026, 10, 5, 8), "300.00", "DEBIT", "Coffee other"))
    await db_session.commit()
    return db_session


# Each filter alone, combined, and paginated returns the expected ids (newest first) and X-Total-Count.
@pytest.mark.asyncio
@pytest.mark.parametrize(
    "params, expected_ids, expected_total",
    [
        ("", ["t5", "t4", "t3", "t2", "t1"], 5),
        ("start_date=2026-10-05", ["t5", "t4", "t3", "t2"], 4),
        ("end_date=2026-10-10", ["t3", "t2", "t1"], 3),  # 23:59:59 in, next midnight out
        ("start_date=2026-10-10&end_date=2026-10-10", ["t3"], 1),
        ("transaction_type=TRANSFER", ["t4"], 1),
        ("transaction_type=DEBIT", ["t5", "t3", "t1"], 3),
        ("account_id=acc-me2", ["t5", "t3"], 2),
        ("min_amount=500", ["t4", "t3", "t2"], 3),
        ("max_amount=100", ["t5", "t1"], 2),
        ("min_amount=100&max_amount=100", ["t1"], 1),
        ("q=coffee", ["t5", "t1"], 2),
        ("q=CoFfEe", ["t5", "t1"], 2),
        ("q=%25", ["t3"], 1),   # a literal "%" only matches "50% OFF sale"
        ("q=_", [], 0),         # "_" is literal too, not "any one character"
        ("account_id=acc-me&transaction_type=DEBIT&start_date=2026-10-01&end_date=2026-10-31&q=coffee", ["t1"], 1),
        ("limit=2&offset=1", ["t4", "t3"], 5),  # total counts matches before pagination
    ],
)
async def test_list_filters(client: AsyncClient, seeded, params: str, expected_ids, expected_total):
    res = await client.get(f"{BASE}?{params}")
    assert res.status_code == 200
    assert [t["id"] for t in res.json()] == expected_ids
    assert res.headers["X-Total-Count"] == str(expected_total)


# Invalid filter combinations and values are rejected with 422.
@pytest.mark.asyncio
@pytest.mark.parametrize(
    "params",
    [
        "min_amount=500&max_amount=100",
        "start_date=2026-10-10&end_date=2026-10-01",
        "min_amount=-1",
        "transaction_type=REFUND",
        "start_date=10-01-2026",
        "q=" + "x" * 101,
    ],
)
async def test_list_filter_validation(client: AsyncClient, seeded, params: str):
    assert (await client.get(f"{BASE}?{params}")).status_code == 422


# Filtering by an account that isn't the user's (or doesn't exist) is a 404, not an empty list.
@pytest.mark.asyncio
async def test_list_foreign_account_404(client: AsyncClient, seeded):
    assert (await client.get(f"{BASE}?account_id=acc-other")).status_code == 404
    assert (await client.get(f"{BASE}?account_id=missing")).status_code == 404


@pytest.mark.asyncio
async def test_monthly_summary_scopes_amounts_by_user_month_and_currency(client: AsyncClient, seeded):
    usd = _tx("usd", "user-me", "acc-me2", datetime(2026, 10, 5), "20.30", "DEBIT", "USB adapter")
    usd.currency = "USD"
    seeded.add_all([
        usd,
        _tx("same-day", "user-me", "acc-me2", datetime(2026, 10, 1, 23, 59), "25.50", "DEBIT", "Dinner"),
        _tx("next-month", "user-me", "acc-me", datetime(2026, 11, 1), "900.00", "DEBIT", "November bill"),
    ])
    await seeded.commit()

    result = await client.get(f"{BASE}/summary?month=2026-10-01")
    assert result.status_code == 200
    payload = result.json()
    assert payload["month"] == "2026-10-01"
    inr, usd = payload["currencies"]
    assert inr["currency"] == "INR"
    assert inr["transaction_count"] == 6  # Includes the transfer in the record count.
    assert [(day["day"], Decimal(day["inflow"]), Decimal(day["spending"])) for day in inr["days"]] == [
        ("2026-10-01", Decimal("0"), Decimal("125.50")),
        ("2026-10-05", Decimal("2500"), Decimal("0")),
        ("2026-10-10", Decimal("0"), Decimal("500")),
        ("2026-10-20", Decimal("0"), Decimal("50")),
    ]
    assert {key: Decimal(value) for key, value in inr["spending_by_account"].items()} == {
        "acc-me": Decimal("100"), "acc-me2": Decimal("575.50"),
    }
    assert usd["currency"] == "USD"
    assert Decimal(usd["days"][0]["spending"]) == Decimal("20.30")

    empty = await client.get(f"{BASE}/summary?month=2026-09-01")
    assert empty.json() == {"month": "2026-09-01", "currencies": []}
    assert (await client.get(f"{BASE}/summary?month=2026-10-02")).status_code == 422


# Manual entry: 201, MANUAL source and reference, currency defaults to the account's, balance untouched,
# visible in list/detail, and counted in a budget covering its date.
@pytest.mark.asyncio
async def test_create_manual_transaction(client: AsyncClient, seeded):
    db = seeded
    now = datetime.now(timezone.utc)
    res = await client.post(
        BASE,
        json={
            "account_id": "acc-me2",
            "occurred_at": (now - timedelta(hours=1)).isoformat(),
            "amount": "199.99",
            "transaction_type": "DEBIT",
            "description": "Cash lunch",
        },
    )
    assert res.status_code == 201
    created = res.json()
    assert created["user_id"] == "user-me"
    assert created["source"] == "MANUAL"
    assert created["raw_description"] == "Cash lunch"
    assert created["reference_id"].startswith("MANUAL-")
    assert created["currency"] == "USD"
    assert Decimal(created["amount"]) == Decimal("199.99")
    assert len(created["dedup_hash"]) == 64

    assert (await client.get(f"{BASE}/{created['id']}")).status_code == 200
    assert created["id"] in [t["id"] for t in (await client.get(BASE)).json()]

    account = await db.get(BankAccount, "acc-me2")
    await db.refresh(account)
    assert Decimal(account.current_balance) == Decimal("0")

    today = now.date()
    budget = (
        await client.post(
            "/api/v1/budgets",
            json={"name": "Now", "total_limit": 1000,
                  "start_date": (today - timedelta(days=1)).isoformat(),
                  "end_date": (today + timedelta(days=1)).isoformat()},
        )
    ).json()
    assert Decimal(budget["total_spent"]) == Decimal("199.99")


# Explicit currency wins over the account's; a timestamp without timezone is treated as UTC.
@pytest.mark.asyncio
async def test_create_manual_transaction_currency_and_naive_time(client: AsyncClient, seeded):
    res = await client.post(
        BASE,
        json={"account_id": "acc-me", "occurred_at": "2026-10-15T10:30:00", "amount": 20,
              "transaction_type": "CREDIT", "description": "Cash gift", "currency": "EUR"},
    )
    assert res.status_code == 201
    body = res.json()
    assert body["currency"] == "EUR"
    assert body["occurred_at"].startswith("2026-10-15T10:30:00")


# Body validation: future dates beyond 1 day, bad amounts/types/descriptions, and unknown fields -> 422.
@pytest.mark.asyncio
@pytest.mark.parametrize(
    "overrides",
    [
        {"occurred_at": "FUTURE"},
        {"amount": 0},
        {"amount": "-5"},
        {"amount": "1.234"},
        {"transaction_type": "TRANSFER"},
        {"description": ""},
        {"description": "x" * 501},
        {"currency": "usd"},
        {"user_id": "user-other"},
        {"source": "BANK_API"},
    ],
)
async def test_create_manual_transaction_validation(client: AsyncClient, seeded, overrides):
    body = {"account_id": "acc-me", "occurred_at": "2026-10-15T10:30:00Z", "amount": "10.00",
            "transaction_type": "DEBIT", "description": "Cash"}
    body.update(overrides)
    if body["occurred_at"] == "FUTURE":
        body["occurred_at"] = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
    assert (await client.post(BASE, json=body)).status_code == 422


# Up to 1 day ahead is allowed (timezone slack).
@pytest.mark.asyncio
async def test_create_manual_transaction_allows_near_future(client: AsyncClient, seeded):
    soon = (datetime.now(timezone.utc) + timedelta(hours=12)).isoformat()
    res = await client.post(
        BASE,
        json={"account_id": "acc-me", "occurred_at": soon, "amount": "1.00",
              "transaction_type": "DEBIT", "description": "Cash"},
    )
    assert res.status_code == 201


# Posting to someone else's account, or a missing one, is a 404 and creates nothing.
@pytest.mark.asyncio
@pytest.mark.parametrize("account_id", ["acc-other", "missing"])
async def test_create_manual_transaction_foreign_account(client: AsyncClient, seeded, account_id: str):
    res = await client.post(
        BASE,
        json={"account_id": account_id, "occurred_at": "2026-10-15T10:30:00Z", "amount": "10.00",
              "transaction_type": "DEBIT", "description": "Cash"},
    )
    assert res.status_code == 404
    assert (await client.get(BASE)).headers["X-Total-Count"] == "5"


# DELETE returns 204, after which detail and a repeat delete both 404.
@pytest.mark.asyncio
async def test_delete_transaction(client: AsyncClient, seeded):
    assert (await client.delete(f"{BASE}/t1")).status_code == 204
    assert (await client.get(f"{BASE}/t1")).status_code == 404
    assert (await client.delete(f"{BASE}/t1")).status_code == 404
    assert (await client.get(BASE)).headers["X-Total-Count"] == "4"


# Another user's transaction can't be read, matched by a search, or deleted.
@pytest.mark.asyncio
async def test_other_users_transaction_is_hidden(client: AsyncClient, seeded):
    db = seeded
    assert (await client.get(f"{BASE}/t-other")).status_code == 404
    assert "t-other" not in [t["id"] for t in (await client.get(f"{BASE}?q=other")).json()]
    assert (await client.get(f"{BASE}?q=other")).headers["X-Total-Count"] == "0"
    assert (await client.delete(f"{BASE}/t-other")).status_code == 404
    assert await db.get(Transaction, "t-other") is not None
