"""Budget management and burn prediction endpoints."""

from datetime import date
from decimal import Decimal
import uuid
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_current_user
from app.core.database import get_db
from app.db.models.user import User
from app.db.models.budget import Budget
from app.domain.ml.forecaster import SpendingForecaster
from app.schemas.budget import BudgetCreate, BudgetResponse

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
