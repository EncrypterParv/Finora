"""Spending forecasting and budget burn predictor."""

from datetime import date, datetime, timedelta, timezone
import calendar
from decimal import Decimal
from typing import Any, Dict, List, Optional, Tuple
import numpy as np


class SpendingForecaster:
    """Deterministic and statistical forecast engine."""

    @staticmethod
    def forecast_month_end_burn(
        current_month_spent: Decimal,
        today: Optional[date] = None,
        daily_burn_rate: Optional[Decimal] = None,
    ) -> Decimal:
        """
        Forecast total month-end expenditure using current progress and daily velocity.
        Formula: current_spent + (remaining_days * daily_burn_rate)
        """
        if today is None:
            today = date.today()

        _, num_days_in_month = calendar.monthrange(today.year, today.month)
        elapsed_days = max(1, today.day)
        remaining_days = max(0, num_days_in_month - elapsed_days)

        if daily_burn_rate is None or daily_burn_rate <= 0:
            effective_daily = current_month_spent / Decimal(str(elapsed_days))
        else:
            effective_daily = daily_burn_rate

        projected_total = current_month_spent + (effective_daily * Decimal(str(remaining_days)))
        return projected_total.quantize(Decimal("0.01"))

    @staticmethod
    def predict_budget_exhaustion(
        budget_limit: Decimal,
        current_spent: Decimal,
        daily_burn_rate: Decimal,
        today: Optional[date] = None,
    ) -> Optional[date]:
        """
        Predict exact calendar date when budget limit will be breached.
        Returns None if budget is sufficient for the entire month.
        """
        if today is None:
            today = date.today()

        if current_spent >= budget_limit:
            return today

        if daily_burn_rate <= Decimal("0.00"):
            return None

        remaining_budget = budget_limit - current_spent
        days_until_exhaustion = int(remaining_budget / daily_burn_rate)
        
        _, num_days_in_month = calendar.monthrange(today.year, today.month)
        days_left_in_month = num_days_in_month - today.day

        if days_until_exhaustion < days_left_in_month:
            return today + timedelta(days=days_until_exhaustion)
        
        return None
