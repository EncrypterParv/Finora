"""Bank integration and simulated sync endpoints."""

from datetime import datetime, timezone
from decimal import Decimal
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_current_user
from app.core.database import get_db
from app.db.models.user import User
from app.db.models.account import BankAccount
from app.db.models.transaction import Transaction
from app.domain.bank_adapters.factory import BankAdapterFactory
from app.domain.statement_import.deduplicator import compute_dedup_hash
from app.domain.statement_import.normalizer import normalize_raw_bank_transaction
from app.schemas.bank import (
    BankSyncRequest,
    BankSyncResponse,
    InstitutionMetadata,
)

router = APIRouter()


@router.get("/institutions", response_model=List[InstitutionMetadata])
async def list_supported_institutions():
    """List available banking adapters and simulated providers."""
    return BankAdapterFactory.list_supported_institutions()


@router.post("/sync", response_model=BankSyncResponse)
async def sync_bank_account(
    sync_req: BankSyncRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Simulate syncing bank transactions using the registered BankAdapter.
    Normalizes every raw bank record to the Canonical Transaction model.
    """
    # Fetch bank account
    acc_res = await db.execute(
        select(BankAccount).where(
            BankAccount.id == sync_req.account_id,
            BankAccount.user_id == current_user.id,
        )
    )
    account = acc_res.scalars().first()
    if not account:
        raise HTTPException(status_code=404, detail="Bank account not found")

    adapter = BankAdapterFactory.get_adapter(sync_req.institution_id)
    raw_txs = await adapter.get_transactions(
        account_id=account.id,
        since=account.last_synced_at,
        seed=sync_req.simulated_seed or current_user.id,
    )

    added_count = 0
    updated_count = 0

    for raw in raw_txs:
        canonical_in = normalize_raw_bank_transaction(raw, account.id)
        dedup_hash = compute_dedup_hash(
            account_id=account.id,
            occurred_at=canonical_in.occurred_at,
            amount=canonical_in.amount,
            reference_id=canonical_in.reference_id,
        )

        # Check existing transaction
        existing_res = await db.execute(
            select(Transaction).where(Transaction.dedup_hash == dedup_hash)
        )
        existing = existing_res.scalars().first()

        if existing:
            updated_count += 1
        else:
            tx = Transaction(
                id=str(uuid.uuid4()),
                user_id=current_user.id,
                account_id=account.id,
                occurred_at=canonical_in.occurred_at,
                amount=canonical_in.amount,
                currency=canonical_in.currency,
                transaction_type=canonical_in.transaction_type.value,
                raw_description=canonical_in.raw_description,
                balance_after=canonical_in.balance_after,
                reference_id=canonical_in.reference_id,
                source=canonical_in.source.value,
                dedup_hash=dedup_hash,
                metadata_=canonical_in.metadata,
            )
            db.add(tx)
            added_count += 1

    # Update account balance and sync time
    new_balance = await adapter.get_balance(account.id)
    account.current_balance = new_balance
    account.last_synced_at = datetime.now(timezone.utc)
    
    await db.commit()

    return BankSyncResponse(
        account_id=account.id,
        institution_name=adapter.institution_name,
        synced_at=account.last_synced_at,
        transactions_added=added_count,
        transactions_updated=updated_count,
        new_balance=new_balance,
        currency=account.currency,
    )
