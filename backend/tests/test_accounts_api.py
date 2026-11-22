"""Integration tests for the /accounts endpoints."""

from datetime import datetime, timezone
from decimal import Decimal

import pytest
from httpx import AsyncClient
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.account import BankAccount
from app.db.models.transaction import Transaction
from app.db.models.user import User

BASE = "/api/v1/accounts"


# Creates the request user; in local auth mode with no token, the first user row is the caller.
async def _make_current_user(db: AsyncSession) -> User:
    """Insert the user that unauthenticated local-mode requests resolve to."""
    user = User(id="user-me", email="me@example.test", full_name="Test User")
    db.add(user)
    await db.commit()
    return user


# A valid POST body, overridable per test.
def _payload(**overrides) -> dict:
    """Return a valid account-creation body."""
    body = {
        "institution_name": "Demo Bank",
        "account_last4": "0042",
        "account_type": "SAVINGS",
    }
    body.update(overrides)
    return body


# Covers POST defaults/masking, list ordering, GET, PATCH (incl. re-masking) and DELETE.
@pytest.mark.asyncio
async def test_account_crud(client: AsyncClient, db_session: AsyncSession):
    await _make_current_user(db_session)

    res = await client.post(BASE, json=_payload())
    assert res.status_code == 201
    first = res.json()
    assert first["user_id"] == "user-me"
    assert first["account_number_masked"] == "XXXX-XXXX-0042"
    assert Decimal(first["current_balance"]) == Decimal("0")
    assert first["currency"] == "INR"
    assert first["adapter_type"] == "HSBC_DEMO"
    assert "account_last4" not in first

    second = (
        await client.post(
            BASE,
            json=_payload(institution_name="Card Co", account_last4="9999", account_type="CREDIT",
                          current_balance="-1500.50", adapter_type="hsbc_demo"),
        )
    ).json()
    assert second["adapter_type"] == "HSBC_DEMO"

    listed = (await client.get(BASE)).json()
    assert [a["id"] for a in listed] == [second["id"], first["id"]]

    res = await client.get(f"{BASE}/{first['id']}")
    assert res.status_code == 200
    assert res.json()["institution_name"] == "Demo Bank"

    res = await client.patch(f"{BASE}/{first['id']}", json={"account_last4": "1234", "current_balance": "500.00"})
    assert res.status_code == 200
    body = res.json()
    assert body["account_number_masked"] == "XXXX-XXXX-1234"
    assert Decimal(body["current_balance"]) == Decimal("500.00")
    assert body["institution_name"] == "Demo Bank"

    assert (await client.delete(f"{BASE}/{first['id']}")).status_code == 204
    assert (await client.get(f"{BASE}/{first['id']}")).status_code == 404


# Bad last4, account_type, currency, adapter, or forbidden extra fields are rejected before touching the DB.
@pytest.mark.asyncio
@pytest.mark.parametrize(
    "overrides",
    [
        {"account_last4": "123"},
        {"account_last4": "12345"},
        {"account_last4": "12a4"},
        {"account_last4": 1234},
        {"account_type": "BROKERAGE"},
        {"currency": "inr"},
        {"adapter_type": "REAL_BANK"},
        {"institution_name": ""},
        {"account_number": "1234567890120042"},
        {"user_id": "someone-else"},
    ],
)
async def test_account_create_validation(client: AsyncClient, db_session: AsyncSession, overrides):
    await _make_current_user(db_session)
    assert (await client.post(BASE, json=_payload(**overrides))).status_code == 422
    assert (await client.get(BASE)).json() == []


# PATCH uses the same rules as POST.
@pytest.mark.asyncio
async def test_account_update_validation(client: AsyncClient, db_session: AsyncSession):
    await _make_current_user(db_session)
    account_id = (await client.post(BASE, json=_payload())).json()["id"]
    assert (await client.patch(f"{BASE}/{account_id}", json={"account_last4": "12"})).status_code == 422
    assert (await client.patch(f"{BASE}/{account_id}", json={"account_type": "LOAN"})).status_code == 422


# Unknown ids 404 on every by-id route.
@pytest.mark.asyncio
async def test_account_unknown_id_404(client: AsyncClient, db_session: AsyncSession):
    await _make_current_user(db_session)
    assert (await client.get(f"{BASE}/missing")).status_code == 404
    assert (await client.patch(f"{BASE}/missing", json={"institution_name": "x"})).status_code == 404
    assert (await client.delete(f"{BASE}/missing")).status_code == 404


# DELETE refuses (409) while transactions exist, then removes account and its transactions with the flag.
@pytest.mark.asyncio
async def test_account_delete_with_transactions(client: AsyncClient, db_session: AsyncSession):
    await _make_current_user(db_session)
    account_id = (await client.post(BASE, json=_payload())).json()["id"]
    db_session.add(
        Transaction(
            user_id="user-me",
            account_id=account_id,
            occurred_at=datetime(2026, 11, 1, tzinfo=timezone.utc),
            amount=Decimal("250.00"),
            transaction_type="DEBIT",
            raw_description="Coffee",
            reference_id="ref-1",
            dedup_hash="hash-1",
        )
    )
    await db_session.commit()

    res = await client.delete(f"{BASE}/{account_id}")
    assert res.status_code == 409
    assert "delete_transactions=true" in res.json()["detail"]
    assert (await client.get(f"{BASE}/{account_id}")).status_code == 200

    assert (await client.delete(f"{BASE}/{account_id}?delete_transactions=true")).status_code == 204
    assert (await client.get(f"{BASE}/{account_id}")).status_code == 404
    remaining = await db_session.execute(
        select(func.count()).select_from(Transaction).where(Transaction.account_id == account_id)
    )
    assert remaining.scalar_one() == 0


# Another user's account is invisible: not listed, and GET/PATCH/DELETE all 404 without changing it.
@pytest.mark.asyncio
async def test_other_users_account_is_hidden(client: AsyncClient, db_session: AsyncSession):
    await _make_current_user(db_session)
    db_session.add(User(id="user-other", email="other@example.test", full_name="Other User"))
    other_account = BankAccount(
        id="acc-other",
        user_id="user-other",
        institution_name="Other Bank",
        account_number_masked="XXXX-XXXX-7777",
    )
    db_session.add(other_account)
    await db_session.commit()

    assert (await client.get(BASE)).json() == []
    assert (await client.get(f"{BASE}/acc-other")).status_code == 404
    assert (await client.patch(f"{BASE}/acc-other", json={"institution_name": "Hijacked"})).status_code == 404
    assert (await client.delete(f"{BASE}/acc-other")).status_code == 404

    await db_session.refresh(other_account)
    assert other_account.institution_name == "Other Bank"
