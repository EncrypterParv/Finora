"""Statement file upload and historical import endpoints."""

import uuid
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from starlette.concurrency import run_in_threadpool

from app.api.deps import get_current_user
from app.core.database import get_db
from app.db.models.user import User
from app.db.models.account import BankAccount
from app.db.models.transaction import Transaction
from app.domain.statement_import.deduplicator import compute_dedup_hash
from app.domain.statement_import.document_reader import (
    MAX_FILE_BYTES,
    DocumentReaderUnavailableError,
    OCRUnavailableError,
    StatementReadError,
    read_statement,
)
from app.schemas.canonical_transaction import (
    StatementImportRequest,
    StatementImportResponse,
    StatementPreviewResponse,
    TransactionSource,
)

router = APIRouter()


@router.post("/preview", response_model=StatementPreviewResponse)
async def preview_statement(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Parse an upload in a worker thread; preview never writes to the database."""
    filename = file.filename or ""
    content = await file.read(MAX_FILE_BYTES + 1)
    await file.close()
    try:
        result = await run_in_threadpool(
            read_statement, content, filename, "pending-account"
        )
    except OCRUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except DocumentReaderUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except StatementReadError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    # Bind the preview request to the authenticated identity even though preview
    # data is transient. This dependency also rejects deleted/stale Supabase users.
    _ = current_user.id
    return StatementPreviewResponse(
        format=result.format,
        needs_review=result.needs_review,
        warnings=result.warnings,
        transactions=[
            record.model_copy(
                update={
                    "source": {
                        "csv": TransactionSource.CSV,
                        "pdf": TransactionSource.PDF,
                        "image": TransactionSource.IMAGE,
                    }[result.format]
                }
            )
            for record in result.records
        ],
    )


@router.post("/import", response_model=StatementImportResponse)
async def confirm_statement_import(
    request: StatementImportRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Persist only the normalized rows submitted after explicit review."""
    account_result = await db.execute(
        select(BankAccount).where(
            BankAccount.id == request.account_id,
            BankAccount.user_id == current_user.id,
        )
    )
    account = account_result.scalars().first()
    if not account:
        raise HTTPException(status_code=404, detail="Bank account not found")

    source_by_format = {
        "csv": TransactionSource.CSV,
        "pdf": TransactionSource.PDF,
        "image": TransactionSource.IMAGE,
    }
    source = source_by_format[request.source_format]
    added = 0
    duplicates = 0
    seen_hashes: set[str] = set()
    candidates = []

    for item in request.transactions:
        dedup_hash = compute_dedup_hash(
            account_id=account.id,
            occurred_at=item.occurred_at,
            amount=item.amount,
            reference_id=item.reference_id,
        )
        if dedup_hash in seen_hashes:
            duplicates += 1
            continue
        seen_hashes.add(dedup_hash)
        candidates.append((item, dedup_hash))

    existing_hashes: set[str] = set()
    if candidates:
        existing_result = await db.execute(
            select(Transaction.dedup_hash).where(
                Transaction.user_id == current_user.id,
                Transaction.dedup_hash.in_([dedup_hash for _, dedup_hash in candidates]),
            )
        )
        existing_hashes = set(existing_result.scalars().all())

    for item, dedup_hash in candidates:
        if dedup_hash in existing_hashes:
            duplicates += 1
            continue
        db.add(
            Transaction(
                id=str(uuid.uuid4()),
                user_id=current_user.id,
                account_id=account.id,
                occurred_at=item.occurred_at,
                amount=item.amount,
                currency=account.currency,
                transaction_type=item.transaction_type.value,
                raw_description=item.raw_description,
                balance_after=item.balance_after,
                reference_id=item.reference_id,
                source=source.value,
                dedup_hash=dedup_hash,
                metadata_={
                    **item.metadata,
                    "reviewed_merchant_name": item.merchant_name,
                    "reviewed_category_name": item.category_name,
                },
            )
        )
        added += 1

    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=409,
            detail="The import changed while it was being saved. Review the statement and try again.",
        ) from exc

    return StatementImportResponse(
        account_id=account.id,
        transactions_confirmed=len(request.transactions),
        transactions_added=added,
        duplicates_skipped=duplicates,
    )


@router.post("/upload", deprecated=True)
async def upload_statement_legacy():
    """Block the old parse-and-save endpoint that skipped user review."""
    raise HTTPException(
        status_code=410,
        detail="Use /statements/preview, review the extracted rows, then confirm with /statements/import.",
    )
