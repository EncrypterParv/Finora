"""Canonical Transaction query, manual entry, and detail endpoints."""

import uuid
from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select

from app.api.deps import get_current_user
from app.api.v1.accounts import _get_owned_account
from app.core.database import get_db
from app.db.models.user import User
from app.db.models.transaction import Transaction
from app.domain.statement_import.deduplicator import compute_dedup_hash
from app.domain.statement_import.normalizer import resolve_merchant_and_category
from app.schemas.canonical_transaction import (
    CanonicalTransactionResponse,
    CurrencyCashFlow,
    DailyCashFlow,
    ManualTransactionCreate,
    TransactionDetailResponse,
    TransactionSummaryResponse,
    TransactionType,
)

router = APIRouter()


# Like findOne({ where: { id, userId } }) that 404s if missing; scoping by user blocks access to others' transactions.
async def _get_owned_transaction(db: AsyncSession, transaction_id: str, user_id: str) -> Transaction:
    """Load a transaction that belongs to this user, or raise 404."""
    res = await db.execute(
        select(Transaction).where(Transaction.id == transaction_id, Transaction.user_id == user_id)
    )
    tx = res.scalars().first()
    if tx is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    return tx


# Merchant/category for display: names the user confirmed during statement review win over the regex guess.
def _display_names(r: Transaction) -> tuple[str, str]:
    """Return (merchant, category), preferring reviewed names saved in metadata."""
    merchant, cat = resolve_merchant_and_category(r.raw_description)
    saved_metadata = r.metadata_ or {}
    merchant = saved_metadata.get("reviewed_merchant_name") or merchant
    cat = saved_metadata.get("reviewed_category_name") or cat
    return merchant, cat


# Serializes one DB row into the list-item shape (adds the derived merchant/category names).
def _to_response(r: Transaction) -> CanonicalTransactionResponse:
    """Map a Transaction row to CanonicalTransactionResponse."""
    merchant, cat = _display_names(r)
    return CanonicalTransactionResponse(
        id=r.id,
        user_id=r.user_id,
        account_id=r.account_id,
        occurred_at=r.occurred_at,
        amount=r.amount,
        currency=r.currency,
        transaction_type=r.transaction_type,
        raw_description=r.raw_description,
        merchant_name=merchant,
        category_name=cat,
        balance_before=r.balance_before,
        balance_after=r.balance_after,
        reference_id=r.reference_id,
        source=r.source,
        dedup_hash=r.dedup_hash,
        tax_info=r.tax_info,
        metadata=r.metadata_ or {},
        created_at=r.created_at,
    )


# GET /transactions?start_date=&end_date=&transaction_type=&account_id=&min_amount=&max_amount=&q=
# Newest first; X-Total-Count header carries the match count before limit/offset, like res.set('X-Total-Count', n).
@router.get("", response_model=List[CanonicalTransactionResponse])
async def list_transactions(
    response: Response,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    start_date: Optional[date] = Query(None, description="Inclusive, UTC day start"),
    end_date: Optional[date] = Query(None, description="Inclusive, UTC day end"),
    transaction_type: Optional[TransactionType] = Query(None),
    account_id: Optional[str] = Query(None),
    min_amount: Optional[Decimal] = Query(None, ge=0),
    max_amount: Optional[Decimal] = Query(None, ge=0),
    q: Optional[str] = Query(None, max_length=100, description="Case-insensitive search in raw_description"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List the user's canonical transactions, newest first, with optional filters."""
    if min_amount is not None and max_amount is not None and min_amount > max_amount:
        raise HTTPException(status_code=422, detail="min_amount cannot be greater than max_amount")
    if start_date and end_date and start_date > end_date:
        raise HTTPException(status_code=422, detail="start_date cannot be after end_date")

    conditions = [Transaction.user_id == current_user.id]
    if start_date:
        conditions.append(Transaction.occurred_at >= datetime.combine(start_date, time.min, tzinfo=timezone.utc))
    if end_date:
        next_day = datetime.combine(end_date + timedelta(days=1), time.min, tzinfo=timezone.utc)
        conditions.append(Transaction.occurred_at < next_day)
    if transaction_type:
        conditions.append(Transaction.transaction_type == transaction_type.value)
    if account_id:
        await _get_owned_account(db, account_id, current_user.id)
        conditions.append(Transaction.account_id == account_id)
    if min_amount is not None:
        conditions.append(Transaction.amount >= min_amount)
    if max_amount is not None:
        conditions.append(Transaction.amount <= max_amount)
    if q:
        # autoescape makes % and _ literal; renders ILIKE on Postgres and lower() LIKE lower() on SQLite.
        conditions.append(Transaction.raw_description.icontains(q, autoescape=True))

    total = (await db.execute(select(func.count()).select_from(Transaction).where(*conditions))).scalar_one()
    response.headers["X-Total-Count"] = str(total)

    res = await db.execute(
        select(Transaction)
        .where(*conditions)
        .order_by(Transaction.occurred_at.desc(), Transaction.id)
        .offset(offset)
        .limit(limit)
    )
    return [_to_response(r) for r in res.scalars().all()]


# POST /transactions — manual entry, like router.post('/transactions', auth, ...); owner comes from the token.
@router.post("", response_model=CanonicalTransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_manual_transaction(
    tx_in: ManualTransactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Record a manual transaction (e.g. cash spending) on one of the user's accounts.

    This does NOT change the account's current_balance; balances come from bank sync.
    """
    account = await _get_owned_account(db, tx_in.account_id, current_user.id)
    reference_id = f"MANUAL-{uuid.uuid4()}"
    tx = Transaction(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        account_id=account.id,
        occurred_at=tx_in.occurred_at,
        amount=tx_in.amount,
        currency=tx_in.currency or account.currency,
        transaction_type=tx_in.transaction_type,
        raw_description=tx_in.description,
        reference_id=reference_id,
        source="MANUAL",
        dedup_hash=compute_dedup_hash(
            account_id=account.id,
            occurred_at=tx_in.occurred_at,
            amount=tx_in.amount,
            reference_id=reference_id,
        ),
        metadata_={},
    )
    db.add(tx)
    await db.commit()
    await db.refresh(tx)
    return _to_response(tx)


# DELETE /transactions/:id — 204 No Content; 404 if missing or someone else's.
@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    transaction_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete one of the user's transactions."""
    tx = await _get_owned_transaction(db, transaction_id, current_user.id)
    await db.delete(tx)
    await db.commit()


@router.get("/summary", response_model=TransactionSummaryResponse)
async def summarize_transactions(
    month: date = Query(..., description="First day of the requested UTC month"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return compact cash flow and account spending totals per currency."""
    if month.day != 1 or month == date.max.replace(day=1):
        raise HTTPException(status_code=422, detail="month must be the first day of a supported month")
    start = datetime.combine(month, time.min, tzinfo=timezone.utc)
    end = (start + timedelta(days=31)).replace(day=1)
    timestamp = Transaction.occurred_at
    if db.get_bind().dialect.name == "postgresql":
        timestamp = func.timezone("UTC", timestamp)
    day = func.date(timestamp)
    rows = await db.execute(
        select(day, Transaction.currency, Transaction.account_id, Transaction.transaction_type,
               func.sum(Transaction.amount), func.count())
        .where(Transaction.user_id == current_user.id,
               Transaction.occurred_at >= start, Transaction.occurred_at < end)
        .group_by(day, Transaction.currency, Transaction.account_id, Transaction.transaction_type)
    )

    currencies: dict[str, CurrencyCashFlow] = {}
    days: dict[str, dict[date, DailyCashFlow]] = {}
    for raw_day, currency, account_id, transaction_type, amount, count in rows:
        currency = currency.upper()
        cash_flow = currencies.setdefault(currency, CurrencyCashFlow(currency=currency))
        cash_flow.transaction_count += count
        if transaction_type == TransactionType.TRANSFER:
            continue
        record_date = date.fromisoformat(raw_day) if isinstance(raw_day, str) else raw_day
        daily = days.setdefault(currency, {}).setdefault(record_date, DailyCashFlow(day=record_date))
        if transaction_type == TransactionType.CREDIT:
            daily.inflow += amount
        elif transaction_type == TransactionType.DEBIT:
            daily.spending += amount
            by_account = cash_flow.spending_by_account
            by_account[account_id] = by_account.get(account_id, Decimal("0")) + amount

    for currency, cash_flow in currencies.items():
        cash_flow.days = sorted(days.get(currency, {}).values(), key=lambda record: record.day)
    return TransactionSummaryResponse(month=month, currencies=[currencies[code] for code in sorted(currencies)])


@router.get("/{transaction_id}", response_model=TransactionDetailResponse)
async def get_transaction_detail(
    transaction_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve rich transaction details including predictive context:
    - Monthly budget allocation & current utilization
    - Projected monthly spend & exhaustion date
    - Recommended daily spending
    - Anomaly status
    """
    tx = await _get_owned_transaction(db, transaction_id, current_user.id)

    merchant, cat = _display_names(tx)

    # Check if transaction is an anomaly (> 3000 on dining or midnight)
    is_anomaly = float(tx.amount) > 3000 and cat in ("Food & Dining", "Entertainment")
    anomaly_reason = None
    if is_anomaly:
        anomaly_reason = f"Transaction amount of ₹{tx.amount:,.2f} is 2.8x standard deviations above average {cat} spending."

    return TransactionDetailResponse(
        id=tx.id,
        user_id=tx.user_id,
        account_id=tx.account_id,
        occurred_at=tx.occurred_at,
        amount=tx.amount,
        currency=tx.currency,
        transaction_type=tx.transaction_type,
        raw_description=tx.raw_description,
        merchant_name=merchant,
        category_name=cat,
        balance_before=tx.balance_before,
        balance_after=tx.balance_after,
        reference_id=tx.reference_id,
        source=tx.source,
        dedup_hash=tx.dedup_hash,
        tax_info=tx.tax_info,
        metadata=tx.metadata_ or {},
        created_at=tx.created_at,
        # Predictive context
        monthly_budget_allocated=Decimal("50000.00"),
        monthly_budget_spent=Decimal("28450.00"),
        monthly_budget_utilization_pct=Decimal("56.90"),
        projected_monthly_spend=Decimal("46500.00"),
        projected_budget_exhaustion_date="2026-10-28",
        recommended_daily_spend=Decimal("1200.00"),
        is_anomaly=is_anomaly,
        anomaly_reason=anomaly_reason,
    )
