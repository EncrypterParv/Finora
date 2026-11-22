"""Bank account management endpoints."""

import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.db.models.account import BankAccount
from app.db.models.transaction import Transaction
from app.db.models.user import User
from app.schemas.account import (
    AccountCreate,
    AccountResponse,
    AccountUpdate,
    mask_account_number,
)

router = APIRouter()


# Like findOne({ where: { id, userId } }) that 404s if missing; scoping by user blocks access to others' accounts.
async def _get_owned_account(db: AsyncSession, account_id: str, user_id: str) -> BankAccount:
    """Load an account that belongs to this user, or raise 404."""
    res = await db.execute(
        select(BankAccount).where(BankAccount.id == account_id, BankAccount.user_id == user_id)
    )
    account = res.scalars().first()
    if account is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bank account not found")
    return account


# GET /accounts — the current user's accounts, newest first.
@router.get("", response_model=List[AccountResponse])
async def list_accounts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List the user's bank accounts, most recently created first."""
    res = await db.execute(
        select(BankAccount)
        .where(BankAccount.user_id == current_user.id)
        .order_by(BankAccount.created_at.desc())
    )
    return res.scalars().all()


# POST /accounts — like router.post('/accounts', auth, ...); owner always comes from the token, never the body.
@router.post("", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
async def create_account(
    account_in: AccountCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a bank account, storing only a masked account number."""
    account = BankAccount(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        institution_name=account_in.institution_name,
        account_number_masked=mask_account_number(account_in.account_last4),
        account_type=account_in.account_type,
        current_balance=account_in.current_balance,
        currency=account_in.currency,
        adapter_type=account_in.adapter_type,
    )
    db.add(account)
    await db.commit()
    await db.refresh(account)
    return account


# GET /accounts/:id — 404 if it doesn't exist or belongs to someone else.
@router.get("/{account_id}", response_model=AccountResponse)
async def get_account(
    account_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return one of the user's bank accounts."""
    return await _get_owned_account(db, account_id, current_user.id)


# PATCH /accounts/:id — applies only the fields present in the body; a new last4 re-masks the number.
@router.patch("/{account_id}", response_model=AccountResponse)
async def update_account(
    account_id: str,
    account_in: AccountUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update only the fields sent in the request body."""
    account = await _get_owned_account(db, account_id, current_user.id)

    changes = account_in.model_dump(exclude_unset=True, exclude_none=True)
    if "account_last4" in changes:
        changes["account_number_masked"] = mask_account_number(changes.pop("account_last4"))

    for field, value in changes.items():
        setattr(account, field, value)
    await db.commit()
    await db.refresh(account)
    return account


# DELETE /accounts/:id — 409 if it still has transactions unless ?delete_transactions=true; 204 on success.
@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    account_id: str,
    delete_transactions: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete an account, refusing if it has transactions unless explicitly asked to remove them too."""
    account = await _get_owned_account(db, account_id, current_user.id)

    tx_scope = (Transaction.account_id == account.id, Transaction.user_id == current_user.id)
    tx_count = (
        await db.execute(select(func.count()).select_from(Transaction).where(*tx_scope))
    ).scalar_one()

    if tx_count and not delete_transactions:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Account has {tx_count} transaction(s). Deleting it would delete them too; "
                "retry with ?delete_transactions=true to confirm."
            ),
        )

    if tx_count:
        await db.execute(delete(Transaction).where(*tx_scope))
    await db.delete(account)
    await db.commit()
