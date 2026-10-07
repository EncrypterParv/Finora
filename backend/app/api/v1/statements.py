"""Statement file upload and historical import endpoints."""

from decimal import Decimal
import uuid
from typing import List
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_current_user
from app.core.database import get_db
from app.db.models.user import User
from app.db.models.account import BankAccount
from app.db.models.transaction import Transaction
from app.domain.statement_import.deduplicator import compute_dedup_hash
from app.domain.statement_import.parser import StatementParser

router = APIRouter()


@router.post("/upload")
async def upload_statement(
    account_id: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Ingest CSV/XLSX bank statements, normalize into Canonical Transactions,
    and persist with idempotent deduplication.
    """
    # Verify account
    acc_res = await db.execute(
        select(BankAccount).where(
            BankAccount.id == account_id,
            BankAccount.user_id == current_user.id,
        )
    )
    account = acc_res.scalars().first()
    if not account:
        raise HTTPException(status_code=404, detail="Bank account not found")

    content = await file.read()
    filename = file.filename.lower()

    if filename.endswith(".csv"):
        canonical_in_list = StatementParser.parse_csv(content, account_id)
    else:
        raise HTTPException(status_code=400, detail="Currently supporting CSV statements in foundation pass")

    added = 0
    duplicates = 0

    for item in canonical_in_list:
        dedup_hash = compute_dedup_hash(
            account_id=account.id,
            occurred_at=item.occurred_at,
            amount=item.amount,
            reference_id=item.reference_id,
        )

        existing_res = await db.execute(
            select(Transaction).where(Transaction.dedup_hash == dedup_hash)
        )
        if existing_res.scalars().first():
            duplicates += 1
            continue

        tx = Transaction(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            account_id=account.id,
            occurred_at=item.occurred_at,
            amount=item.amount,
            currency=item.currency,
            transaction_type=item.transaction_type.value,
            raw_description=item.raw_description,
            balance_after=item.balance_after,
            reference_id=item.reference_id,
            source=item.source.value,
            dedup_hash=dedup_hash,
            metadata_=item.metadata,
        )
        db.add(tx)
        added += 1

    await db.commit()

    return {
        "filename": file.filename,
        "transactions_parsed": len(canonical_in_list),
        "transactions_added": added,
        "duplicates_skipped": duplicates,
    }
