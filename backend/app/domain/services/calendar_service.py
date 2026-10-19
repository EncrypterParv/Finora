"""Financial Calendar domain service."""

from collections import defaultdict
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional
from app.schemas.calendar import (
    CalendarDaySummary,
    CalendarEventBlock,
    CalendarViewMode,
    CalendarViewResponse,
)


class FinancialCalendarService:
    """Processes canonical transaction streams into temporal calendar presentations."""

    CATEGORY_COLORS = {
        "Food & Dining": "#F59E0B",
        "Entertainment": "#8B5CF6",
        "Transportation": "#3B82F6",
        "Shopping": "#EC4899",
        "Bills & Utilities": "#EF4444",
        "Income": "#10B981",
        "Investments": "#06B6D4",
        "General": "#6B7280",
    }

    CATEGORY_ICONS = {
        "Food & Dining": "Utensils",
        "Entertainment": "Film",
        "Transportation": "Car",
        "Shopping": "ShoppingBag",
        "Bills & Utilities": "Zap",
        "Income": "ArrowDownLeft",
        "Investments": "TrendingUp",
        "General": "Tag",
    }

    @classmethod
    def build_calendar_view(
        cls,
        transactions: List[Dict[str, Any]],
        start_date: date,
        end_date: date,
        mode: CalendarViewMode = CalendarViewMode.MONTH,
        predicted_daily_burn: Optional[Decimal] = None,
    ) -> CalendarViewResponse:
        """Aggregate transactions into chronological calendar days and time-axis event blocks."""
        day_buckets: Dict[date, List[Dict[str, Any]]] = defaultdict(list)
        total_period_debit = Decimal("0.00")
        total_period_credit = Decimal("0.00")

        for tx in transactions:
            occurred_at: datetime = tx["occurred_at"]
            tx_date = occurred_at.date() if isinstance(occurred_at, datetime) else occurred_at
            
            if start_date <= tx_date <= end_date:
                day_buckets[tx_date].append(tx)
                amount = Decimal(str(tx["amount"]))
                if tx.get("transaction_type") == "DEBIT":
                    total_period_debit += amount
                elif tx.get("transaction_type") == "CREDIT":
                    total_period_credit += amount

        num_days = max(1, (end_date - start_date).days + 1)
        avg_daily_spend = (total_period_debit / Decimal(str(num_days))).quantize(Decimal("0.01"))

        # Build daily summaries
        days: List[CalendarDaySummary] = []
        curr = start_date
        today = date.today()

        while curr <= end_date:
            tx_list = day_buckets.get(curr, [])
            day_debit = Decimal("0.00")
            day_credit = Decimal("0.00")
            event_blocks: List[CalendarEventBlock] = []

            for tx in tx_list:
                amount = Decimal(str(tx["amount"]))
                tx_type = tx.get("transaction_type", "DEBIT")
                if tx_type == "DEBIT":
                    day_debit += amount
                elif tx_type == "CREDIT":
                    day_credit += amount

                cat_name = tx.get("category_name", "General")
                occurred_at = tx["occurred_at"]
                
                # Intensity score relative to transaction size
                intensity = min(1.0, float(amount / Decimal("5000.00")))

                event_blocks.append(
                    CalendarEventBlock(
                        id=str(tx["id"]),
                        time_label=occurred_at.strftime("%H:%M"),
                        occurred_at=occurred_at,
                        amount=amount,
                        currency=tx.get("currency", "INR"),
                        transaction_type=tx_type,
                        merchant_name=tx.get("merchant_name", "Merchant"),
                        category_name=cat_name,
                        category_color=cls.CATEGORY_COLORS.get(cat_name, "#6366F1"),
                        category_icon=cls.CATEGORY_ICONS.get(cat_name, "Tag"),
                        intensity_score=round(intensity, 2),
                    )
                )

            # Sort event blocks by time
            event_blocks.sort(key=lambda x: x.occurred_at)

            # Intensity of day compared to average
            day_intensity = min(1.0, float(day_debit / max(Decimal("1.00"), avg_daily_spend * Decimal("2.0"))))
            is_future = curr > today

            days.append(
                CalendarDaySummary(
                    date=curr,
                    date_label=curr.strftime("%a, %b %d"),
                    total_debit=day_debit,
                    total_credit=day_credit,
                    net_flow=day_credit - day_debit,
                    transaction_count=len(tx_list),
                    spending_intensity=round(day_intensity, 2),
                    is_projected=is_future,
                    projected_debit=predicted_daily_burn if is_future else None,
                    events=event_blocks,
                )
            )

            curr += timedelta(days=1)

        predicted_burn = total_period_debit + (predicted_daily_burn or avg_daily_spend) * Decimal(str(max(0, (end_date - today).days))) if end_date > today else total_period_debit

        return CalendarViewResponse(
            mode=mode,
            start_date=start_date,
            end_date=end_date,
            total_period_debit=total_period_debit,
            total_period_credit=total_period_credit,
            average_daily_spend=avg_daily_spend,
            days=days,
            predicted_month_end_burn=predicted_burn.quantize(Decimal("0.01")),
        )
