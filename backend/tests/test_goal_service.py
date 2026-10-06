"""Tests for Financial Goal and FIRE projection service."""

from datetime import date
from decimal import Decimal
import pytest
from app.domain.services.goal_service import FinancialGoalSimulator


def test_goal_projection_calculation():
    # Target ₹1,000,000, current ₹100,000, monthly ₹25,000 at 10% return
    target = Decimal("1000000.00")
    saved = Decimal("100000.00")
    monthly = Decimal("25000.00")
    return_pct = Decimal("10.00")

    proj_date, interest = FinancialGoalSimulator.calculate_projection(
        target_amount=target,
        current_saved=saved,
        monthly_contribution=monthly,
        expected_annual_return_pct=return_pct,
        start_date=date(2026, 1, 1),
    )

    assert proj_date is not None
    assert proj_date > date(2026, 1, 1)
    assert interest > Decimal("0.00")


def test_goal_scenarios_generation():
    target = Decimal("5000000.00")
    saved = Decimal("500000.00")
    base_monthly = Decimal("50000.00")

    scenarios = FinancialGoalSimulator.generate_scenarios(
        target_amount=target,
        current_saved=saved,
        base_monthly_contribution=base_monthly,
        expected_annual_return_pct=Decimal("12.00"),
    )

    assert len(scenarios) == 4
    # Ensure larger additional contributions save more months
    assert scenarios[3].months_saved > scenarios[0].months_saved
