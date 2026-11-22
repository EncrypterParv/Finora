"""Budget management and burn prediction endpoints."""

import math
import uuid
from datetime import date, datetime, time, timedelta, timezone
from decimal import ROUND_HALF_UP, Decimal
from typing import List, NamedTuple, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select

from app.api.deps import get_current_user
from app.core.database import get_db
from app.db.models.user import User
from app.db.models.budget import Budget
from app.db.models.transaction import Transaction
from app.schemas.budget import BudgetCreate, BudgetResponse, BudgetUpdate

router = APIRouter()

CENT = Decimal("0.01")


# The computed spend/projection numbers for one budget, like a small typed result object.
class BudgetBurn(NamedTuple):
    total_spent: Decimal
    projected_burn_total: Optional[Decimal]
    projected_exhaustion_date: Optional[date]


# Sums the user's DEBITs inside the budget window in SQL, then projects the burn linearly to end_date.
async def _compute_budget_burn(
    db: AsyncSession, budget: Budget, user_id: str, today: Optional[date] = None
) -> BudgetBurn:
    """Compute total spent, projected total and projected exhaustion date for a budget."""
    today = today or datetime.now(timezone.utc).date()
    if today < budget.start_date:
        return BudgetBurn(Decimal("0.00"), None, None)

    window_start = datetime.combine(budget.start_date, time.min, tzinfo=timezone.utc)
    window_end = datetime.combine(budget.end_date + timedelta(days=1), time.min, tzinfo=timezone.utc)
    spent_raw = (
        await db.execute(
            select(func.coalesce(func.sum(Transaction.amount), 0)).where(
                Transaction.user_id == user_id,
                Transaction.transaction_type == "DEBIT",
                Transaction.occurred_at >= window_start,
                Transaction.occurred_at < window_end,
            )
        )
    ).scalar_one()
    total_spent = Decimal(str(spent_raw)).quantize(CENT, ROUND_HALF_UP)

    elapsed_days = max(1, (min(today, budget.end_date) - budget.start_date).days + 1)
    remaining_days = max(0, (budget.end_date - today).days)
    daily_burn = total_spent / elapsed_days
    projected_total = (total_spent + daily_burn * remaining_days).quantize(CENT, ROUND_HALF_UP)

    limit = Decimal(str(budget.total_limit))
    if today > budget.end_date:
        exhaustion: Optional[date] = None
    elif total_spent >= limit:
        exhaustion = today
    elif daily_burn > 0:
        exhaustion = today + timedelta(days=math.ceil((limit - total_spent) / daily_burn))
        if exhaustion > budget.end_date:
            exhaustion = None
    else:
        exhaustion = None

    return BudgetBurn(total_spent, projected_total, exhaustion)


# Serializes a budget with live burn numbers so GET, POST and PATCH all return identical figures.
async def _budget_response(db: AsyncSession, budget: Budget, user_id: str) -> BudgetResponse:
    """Build the API response for a budget, including computed spending."""
    burn = await _compute_budget_burn(db, budget, user_id)
    return BudgetResponse(
        id=budget.id,
        user_id=budget.user_id,
        name=budget.name,
        period=budget.period,
        total_limit=budget.total_limit,
        total_spent=burn.total_spent,
        start_date=budget.start_date,
        end_date=budget.end_date,
        categories=[],
        projected_burn_total=burn.projected_burn_total,
        projected_exhaustion_date=burn.projected_exhaustion_date,
    )


@router.get("", response_model=List[BudgetResponse])
async def list_budgets(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all budgets for the user with real spend and burn projections."""
    res = await db.execute(select(Budget).where(Budget.user_id == current_user.id))
    return [await _budget_response(db, b, current_user.id) for b in res.scalars().all()]


@router.post("", response_model=BudgetResponse)
async def create_budget(
    budget_in: BudgetCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new budget tracking limit."""
    budget = Budget(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        name=budget_in.name,
        period=budget_in.period,
        total_limit=budget_in.total_limit,
        start_date=budget_in.start_date,
        end_date=budget_in.end_date,
    )
    db.add(budget)
    await db.commit()
    await db.refresh(budget)
    return await _budget_response(db, budget, current_user.id)


# Like findOne({ where: { id, userId } }) that 404s if missing; scoping by user blocks access to others' budgets.
async def _get_owned_budget(db: AsyncSession, budget_id: str, user_id: str) -> Budget:
    """Load a budget that belongs to this user, or raise 404."""
    res = await db.execute(
        select(Budget).where(Budget.id == budget_id, Budget.user_id == user_id)
    )
    budget = res.scalars().first()
    if budget is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")
    return budget


# PATCH /budgets/:id — applies only the fields present in the body; rejects end_date < start_date with 422.
@router.patch("/{budget_id}", response_model=BudgetResponse)
async def update_budget(
    budget_id: str,
    budget_in: BudgetUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update only the fields sent in the request body."""
    budget = await _get_owned_budget(db, budget_id, current_user.id)

    changes = budget_in.model_dump(exclude_unset=True, exclude_none=True)
    new_start = changes.get("start_date", budget.start_date)
    new_end = changes.get("end_date", budget.end_date)
    if new_end < new_start:
        raise HTTPException(
            status_code=422,
            detail="end_date cannot be before start_date",
        )

    for field, value in changes.items():
        setattr(budget, field, value)
    await db.commit()
    await db.refresh(budget)
    return await _budget_response(db, budget, current_user.id)


# DELETE /budgets/:id — responds 204 No Content, like res.status(204).end().
@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_budget(
    budget_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a budget (its category allocations are deleted with it)."""
    budget = await _get_owned_budget(db, budget_id, current_user.id)
    await db.delete(budget)
    await db.commit()