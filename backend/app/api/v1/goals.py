"""Financial Goals and FIRE projection endpoints."""

from decimal import Decimal
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_current_user
from app.core.database import get_db
from app.db.models.user import User
from app.db.models.goal import FinancialGoal
from app.domain.services.goal_service import FinancialGoalSimulator
from app.schemas.goal import GoalCreate, GoalResponse, GoalUpdate

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



# Like findOne({ where: { id, userId } }) that 404s if missing; scoping by user blocks access to others' goals.
async def _get_owned_goal(db: AsyncSession, goal_id: str, user_id: str) -> FinancialGoal:
    """Load a goal that belongs to this user, or raise 404."""
    res = await db.execute(
        select(FinancialGoal).where(FinancialGoal.id == goal_id, FinancialGoal.user_id == user_id)
    )
    goal = res.scalars().first()
    if goal is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
    return goal


# PATCH /goals/:id — applies only the fields present in the body, then recalculates the projected finish date.
@router.patch("/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: str,
    goal_in: GoalUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update only the fields sent in the request body, then re-run the projection."""
    goal = await _get_owned_goal(db, goal_id, current_user.id)

    for field, value in goal_in.model_dump(exclude_unset=True, exclude_none=True).items():
        setattr(goal, field, value)
    await db.commit()
    await db.refresh(goal)

    proj_date, _ = FinancialGoalSimulator.calculate_projection(
        target_amount=goal.target_amount,
        current_saved=goal.current_saved,
        monthly_contribution=goal.monthly_contribution,
        expected_annual_return_pct=goal.expected_annual_return_pct,
    )
    progress = (goal.current_saved / goal.target_amount * 100).quantize(Decimal("0.1"))

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
        progress_percentage=progress,
        projected_completion_date=proj_date,
        is_on_track=proj_date <= goal.target_date if proj_date else False,
    )


# DELETE /goals/:id — responds 204 No Content; milestones are removed by the model's cascade.
@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_goal(
    goal_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a goal (its milestones are deleted with it)."""
    goal = await _get_owned_goal(db, goal_id, current_user.id)
    await db.delete(goal)
    await db.commit()