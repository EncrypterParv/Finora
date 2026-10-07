"""Spending forecasting, multi-horizon trend projection, and budget exhaustion engine."""

import calendar
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional
import numpy as np


class SpendingForecaster:
    """
    Evidence-grounded spending forecast engine supporting baseline,
    day-of-week adjusted exponential moving average, and prediction uncertainty intervals.
    """

    MODEL_VERSION = "v1.4-dow-ema-uncertainty"

    @classmethod
    def forecast_month_end_burn_with_uncertainty(
        cls,
        current_month_spent: Decimal,
        daily_historical_spends: Optional[List[float]] = None,
        daily_burn_rate: Optional[Decimal] = None,
        today: Optional[date] = None,
        dow_multipliers: Optional[Dict[int, float]] = None,
    ) -> Dict[str, Any]:
        """
        Forecast total month-end expenditure with 80% prediction uncertainty intervals.
        """
        if today is None:
            today = date.today()

        _, num_days_in_month = calendar.monthrange(today.year, today.month)
        elapsed_days = max(1, today.day)
        remaining_days = max(0, num_days_in_month - elapsed_days)

        # Baseline daily burn calculation
        if daily_burn_rate is not None and daily_burn_rate > Decimal("0.00"):
            base_daily = float(daily_burn_rate)
        else:
            base_daily = float(current_month_spent) / float(elapsed_days)

        # 1. Trajectory projection (using DOW multipliers if provided, else standard 1.0)
        projected_future_spend = 0.0
        for offset in range(1, remaining_days + 1):
            future_date = today + timedelta(days=offset)
            dow = future_date.weekday()  # 0=Monday, 6=Sunday
            multiplier = dow_multipliers.get(dow, 1.0) if dow_multipliers else 1.0
            projected_future_spend += base_daily * multiplier

        expected_total = float(current_month_spent) + projected_future_spend

        # 2. Uncertainty & Volatility Estimation
        if daily_historical_spends and len(daily_historical_spends) >= 5:
            std_daily = float(np.std(daily_historical_spends))
        else:
            std_daily = base_daily * 0.20  # Standard variance

        # Standard error of the sum of remaining days: sqrt(N) * sigma
        std_error_remaining = np.sqrt(max(1, remaining_days)) * std_daily
        
        # 80% confidence interval (Z = 1.28)
        margin = 1.28 * std_error_remaining
        lower_bound = max(float(current_month_spent), expected_total - margin)
        upper_bound = expected_total + margin

        return {
            "expected_total_burn": Decimal(f"{expected_total:.2f}"),
            "lower_bound_80": Decimal(f"{lower_bound:.2f}"),
            "upper_bound_80": Decimal(f"{upper_bound:.2f}"),
            "daily_projected_rate": Decimal(f"{base_daily:.2f}"),
            "remaining_days_in_month": remaining_days,
            "projected_remaining_spend": Decimal(f"{projected_future_spend:.2f}"),
            "methodology": "Day-of-Week Adjusted Velocity Projection" if dow_multipliers else "Baseline Moving Average Velocity",
            "model_version": cls.MODEL_VERSION,
            "confidence_level_pct": 80,
            "forecast_generated_at": datetime.now(timezone.utc).isoformat(),
        }

    @classmethod
    def forecast_month_end_burn(
        cls,
        current_month_spent: Decimal,
        today: Optional[date] = None,
        daily_burn_rate: Optional[Decimal] = None,
    ) -> Decimal:
        """Backwards-compatible wrapper returning expected month-end Decimal."""
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

    @classmethod
    def predict_budget_exhaustion(
        cls,
        budget_limit: Decimal,
        current_spent: Decimal,
        daily_burn_rate: Decimal,
        today: Optional[date] = None,
    ) -> Optional[date]:
        """Predict exact calendar date when budget limit will be breached."""
        details = cls.evaluate_budget_risk(
            budget_limit=budget_limit,
            current_spent=current_spent,
            daily_burn_rate=daily_burn_rate,
            today=today,
        )
        return details.get("exhaustion_date")

    @classmethod
    def evaluate_budget_risk(
        cls,
        budget_limit: Decimal,
        current_spent: Decimal,
        daily_burn_rate: Decimal,
        today: Optional[date] = None,
    ) -> Dict[str, Any]:
        """Comprehensive budget exhaustion analysis."""
        if today is None:
            today = date.today()

        _, num_days_in_month = calendar.monthrange(today.year, today.month)
        elapsed_days = max(1, today.day)
        remaining_days = max(0, num_days_in_month - elapsed_days)

        remaining_budget = budget_limit - current_spent

        if current_spent >= budget_limit:
            return {
                "exhaustion_date": today,
                "days_until_exhaustion": 0,
                "risk_level": "EXHAUSTED",
                "remaining_budget": remaining_budget,
                "projected_overspend": (current_spent + (daily_burn_rate * Decimal(str(remaining_days)))) - budget_limit,
                "recommended_daily_cap": Decimal("0.00"),
                "status_summary": f"Budget breached by ₹{(current_spent - budget_limit):,.2f}.",
            }

        if daily_burn_rate <= Decimal("0.00"):
            return {
                "exhaustion_date": None,
                "days_until_exhaustion": None,
                "risk_level": "SAFE",
                "remaining_budget": remaining_budget,
                "projected_overspend": Decimal("0.00"),
                "recommended_daily_cap": (remaining_budget / Decimal(str(max(1, remaining_days)))).quantize(Decimal("0.01")),
                "status_summary": "Zero spending velocity recorded. Budget is fully secure.",
            }

        days_until_exhaustion = int(remaining_budget / daily_burn_rate)
        forecast_total = current_spent + (daily_burn_rate * Decimal(str(remaining_days)))
        projected_variance = forecast_total - budget_limit

        recommended_cap = (remaining_budget / Decimal(str(max(1, remaining_days)))).quantize(Decimal("0.01")) if remaining_days > 0 else Decimal("0.00")

        if days_until_exhaustion < remaining_days:
            exhaustion_date = today + timedelta(days=days_until_exhaustion)
            if days_until_exhaustion <= 3:
                risk_level = "CRITICAL_IMMINENT"
            elif days_until_exhaustion <= 7:
                risk_level = "HIGH_RISK"
            else:
                risk_level = "MODERATE_RISK"
            
            summary = (
                f"At current velocity of ₹{daily_burn_rate:,.2f}/day, budget will be exhausted on "
                f"{exhaustion_date.strftime('%d %B')} ({days_until_exhaustion} days remaining). "
                f"Cap spending at ₹{recommended_cap:,.2f}/day to finish within budget."
            )
        else:
            exhaustion_date = None
            risk_level = "SAFE"
            summary = f"On track. Safe surplus of ₹{abs(projected_variance):,.2f} projected at month-end."

        return {
            "exhaustion_date": exhaustion_date,
            "days_until_exhaustion": days_until_exhaustion if exhaustion_date else None,
            "risk_level": risk_level,
            "remaining_budget": remaining_budget,
            "projected_overspend": max(Decimal("0.00"), projected_variance),
            "projected_surplus": max(Decimal("0.00"), -projected_variance),
            "recommended_daily_cap": recommended_cap,
            "status_summary": summary,
        }
