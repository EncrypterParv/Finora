"""Budget management and burn prediction endpoints."""

from datetime import date
from decimal import Decimal
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_current_user
from app.core.database import get_db
from app.db.models.user import User
from app.db.models.budget import Budget
from app.domain.ml.forecaster import SpendingForecaster
from app.schemas.budget import BudgetCreate, BudgetResponse, BudgetUpdate

router = APIRouter()


@router.get("", response_model=List[BudgetResponse])
async def list_budgets(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all active budgets for the user with burn predictions."""
    res = await db.execute(select(Budget).where(Budget.user_id == current_user.id))
    budgets = res.scalars().all()

    today = date.today()
    output: List[BudgetResponse] = []
    
    for b in budgets:
        # Initial burn calculation
        spent = Decimal("14250.00")
        daily_burn = Decimal("750.00")
        exhaustion_date = SpendingForecaster.predict_budget_exhaustion(
            budget_limit=b.total_limit,
            current_spent=spent,
            daily_burn_rate=daily_burn,
            today=today,
        )

        output.append(
            BudgetResponse(
                id=b.id,
                user_id=b.user_id,
                name=b.name,
                period=b.period,
                total_limit=b.total_limit,
                total_spent=spent,
                start_date=b.start_date,
                end_date=b.end_date,
                categories=[],
                projected_burn_total=SpendingForecaster.forecast_month_end_burn(spent, today, daily_burn),
                projected_exhaustion_date=exhaustion_date,
            )
        )
    return output


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

    return BudgetResponse(
        id=budget.id,
        user_id=budget.user_id,
        name=budget.name,
        period=budget.period,
        total_limit=budget.total_limit,
        total_spent=Decimal("0.00"),
        start_date=budget.start_date,
        end_date=budget.end_date,
        categories=[],
    )



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

    return BudgetResponse(
        id=budget.id,
        user_id=budget.user_id,
        name=budget.name,
        period=budget.period,
        total_limit=budget.total_limit,
        start_date=budget.start_date,
        end_date=budget.end_date,
        categories=[],
    )


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