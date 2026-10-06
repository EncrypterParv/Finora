"""Budget and category allocation schemas."""

from datetime import date
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field


class BudgetCategoryCreate(BaseModel):
    category_id: str
    allocated_amount: Decimal = Field(..., gt=0)
    alert_threshold_percentage: Decimal = Decimal("80.0")


class BudgetCategoryResponse(BaseModel):
    id: str
    category_id: str
    category_name: Optional[str] = None
    allocated_amount: Decimal
    spent_amount: Decimal = Decimal("0.00")
    utilization_percentage: Decimal = Decimal("0.00")
    alert_threshold_percentage: Decimal

    model_config = {"from_attributes": True}


class BudgetCreate(BaseModel):
    name: str
    period: str = "MONTHLY"
    total_limit: Decimal = Field(..., gt=0)
    start_date: date
    end_date: date
    categories: List[BudgetCategoryCreate] = Field(default_factory=list)


class BudgetResponse(BaseModel):
    id: str
    user_id: str
    name: str
    period: str
    total_limit: Decimal
    total_spent: Decimal = Decimal("0.00")
    start_date: date
    end_date: date
    categories: List[BudgetCategoryResponse] = Field(default_factory=list)
    projected_burn_total: Optional[Decimal] = None
    projected_exhaustion_date: Optional[date] = None

    model_config = {"from_attributes": True}
