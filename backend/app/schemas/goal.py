"""Financial Goal and FIRE projection schemas."""

from datetime import date, datetime
from decimal import Decimal
from typing import List, Literal, Optional
from pydantic import BaseModel, Field


class GoalMilestoneResponse(BaseModel):
    id: str
    title: str
    target_amount: Decimal
    target_date: date
    is_achieved: bool
    achieved_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class GoalCreate(BaseModel):
    title: str
    goal_type: str = "EMERGENCY_FUND"  # EMERGENCY_FUND, EDUCATION, CAR, HOUSE, TRAVEL, RETIREMENT, FIRE, CUSTOM
    target_amount: Decimal = Field(..., gt=0)
    current_saved: Decimal = Field(default=Decimal("0.00"), ge=0)
    monthly_contribution: Decimal = Field(default=Decimal("0.00"), ge=0)
    target_date: date
    expected_annual_return_pct: Decimal = Decimal("8.00")

# PATCH body schema, like z.object({...}).partial(); Literal restricts status like z.enum().
class GoalUpdate(BaseModel):
    title: Optional[str] = None
    goal_type: Optional[str] = None
    target_amount: Optional[Decimal] = Field(default=None, gt=0)
    current_saved: Optional[Decimal] = Field(default=None, ge=0)
    monthly_contribution: Optional[Decimal] = Field(default=None, ge=0)
    target_date: Optional[date] = None
    expected_annual_return_pct: Optional[Decimal] = None
    status: Optional[Literal["IN_PROGRESS", "COMPLETED", "PAUSED"]] = None

class GoalProjectionScenario(BaseModel):
    monthly_additional_savings: Decimal
    projected_completion_date: date
    months_saved: int
    total_interest_earned: Decimal


class GoalResponse(BaseModel):
    id: str
    user_id: str
    title: str
    goal_type: str
    target_amount: Decimal
    current_saved: Decimal
    monthly_contribution: Decimal
    target_date: date
    expected_annual_return_pct: Decimal
    status: str
    progress_percentage: Decimal
    projected_completion_date: Optional[date] = None
    is_on_track: bool = True
    scenarios: List[GoalProjectionScenario] = Field(default_factory=list)
    milestones: List[GoalMilestoneResponse] = Field(default_factory=list)

    model_config = {"from_attributes": True}
