"""Financial Calendar schemas and DTOs."""

from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class CalendarViewMode(str, Enum):
    DAY = "day"
    WEEK = "week"
    MONTH = "month"


class CalendarEventBlock(BaseModel):
    id: str
    time_label: str  # e.g., "14:32"
    occurred_at: datetime
    amount: Decimal
    currency: str
    transaction_type: str
    merchant_name: str
    category_name: str
    category_color: str
    category_icon: str
    intensity_score: float  # 0.0 to 1.0 relative to daily average


class CalendarDaySummary(BaseModel):
    date: date
    date_label: str  # e.g., "Mon, Oct 7"
    total_debit: Decimal = Decimal("0.00")
    total_credit: Decimal = Decimal("0.00")
    net_flow: Decimal = Decimal("0.00")
    transaction_count: int = 0
    spending_intensity: float = 0.0  # 0.0 to 1.0
    is_projected: bool = False
    projected_debit: Optional[Decimal] = None
    events: List[CalendarEventBlock] = Field(default_factory=list)


class CalendarViewResponse(BaseModel):
    mode: CalendarViewMode
    start_date: date
    end_date: date
    total_period_debit: Decimal
    total_period_credit: Decimal
    average_daily_spend: Decimal
    days: List[CalendarDaySummary]
    predicted_month_end_burn: Optional[Decimal] = None
