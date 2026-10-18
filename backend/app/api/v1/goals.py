"""Financial Goals and FIRE projection endpoints."""

from decimal import Decimal
import uuid
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_current_user
from app.core.database import get_db
from app.db.models.user import User
from app.db.models.goal import FinancialGoal
from app.domain.services.goal_service import FinancialGoalSimulator
from app.schemas.goal import GoalCreate, GoalResponse

router = APIRouter()


@router.get("", response_model=List[GoalResponse])
async def list_goals(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve financial goals with dynamic scenario simulations."""
    res = await db.execute(select(FinancialGoal).where(FinancialGoal.user_id == current_user.id))
    goals = res.scalars().all()

    output: List[GoalResponse] = []
    for g in goals:
        proj_date, _ = FinancialGoalSimulator.calculate_projection(
            target_amount=g.target_amount,
            current_saved=g.current_saved,
            monthly_contribution=g.monthly_contribution,
            expected_annual_return_pct=g.expected_annual_return_pct,
        )
        scenarios = FinancialGoalSimulator.generate_scenarios(
            target_amount=g.target_amount,
            current_saved=g.current_saved,
            base_monthly_contribution=g.monthly_contribution,
            expected_annual_return_pct=g.expected_annual_return_pct,
        )
        progress = (g.current_saved / g.target_amount * 100).quantize(Decimal("0.1")) if g.target_amount > 0 else Decimal("0.0")

        output.append(
            GoalResponse(
                id=g.id,
                user_id=g.user_id,
                title=g.title,
                goal_type=g.goal_type,
                target_amount=g.target_amount,
                current_saved=g.current_saved,
                monthly_contribution=g.monthly_contribution,
                target_date=g.target_date,
                expected_annual_return_pct=g.expected_annual_return_pct,
                status=g.status,
                progress_percentage=progress,
                projected_completion_date=proj_date,
                is_on_track=proj_date <= g.target_date if proj_date else False,
                scenarios=scenarios,
                milestones=[],
            )
        )
    return output


@router.post("", response_model=GoalResponse)
async def create_goal(
    goal_in: GoalCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new financial goal."""
    goal = FinancialGoal(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        title=goal_in.title,
        goal_type=goal_in.goal_type,
        target_amount=goal_in.target_amount,
        current_saved=goal_in.current_saved,
        monthly_contribution=goal_in.monthly_contribution,
        target_date=goal_in.target_date,
        expected_annual_return_pct=goal_in.expected_annual_return_pct,
        status="IN_PROGRESS",
    )
    db.add(goal)
    await db.commit()
    await db.refresh(goal)

    proj_date, _ = FinancialGoalSimulator.calculate_projection(
        target_amount=goal.target_amount,
        current_saved=goal.current_saved,
        monthly_contribution=goal.monthly_contribution,
        expected_annual_return_pct=goal.expected_annual_return_pct,
    )

    return GoalResponse(
        id=goal.id,
        user_id=goal.user_id,
        title=goal.title,
        goal_type=goal.goal_type,
        target_amount=goal.target_amount,
        current_saved=goal.current_saved,
        monthly_contribution=goal.monthly_contribution,
        target_date=goal.target_date,
        expected_annual_return_pct=goal.expected_annual_return_pct,
        status=goal.status,
        progress_percentage=Decimal("0.0"),
        projected_completion_date=proj_date,
        is_on_track=True,
        scenarios=[],
        milestones=[],
    )
