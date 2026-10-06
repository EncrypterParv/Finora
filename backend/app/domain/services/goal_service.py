"""Financial Goal projection and FIRE simulation service."""

from datetime import date, timedelta
from decimal import Decimal
import math
from typing import List, Optional, Tuple
from app.schemas.goal import GoalProjectionScenario


class FinancialGoalSimulator:
    """Calculates time-to-goal and compound investment scenarios."""

    @classmethod
    def calculate_projection(
        cls,
        target_amount: Decimal,
        current_saved: Decimal,
        monthly_contribution: Decimal,
        expected_annual_return_pct: Decimal = Decimal("8.00"),
        start_date: Optional[date] = None,
    ) -> Tuple[Optional[date], Decimal]:
        """
        Compute projected achievement date using monthly compound interest.
        Returns: (projected_date, total_interest_earned)
        """
        if start_date is None:
            start_date = date.today()

        if current_saved >= target_amount:
            return start_date, Decimal("0.00")

        if monthly_contribution <= 0 and expected_annual_return_pct <= 0:
            return None, Decimal("0.00")

        r = (expected_annual_return_pct / Decimal("100.0")) / Decimal("12.0")  # Monthly rate
        balance = current_saved
        months = 0
        total_contributions = current_saved
        max_months = 1200  # Cap at 100 years

        while balance < target_amount and months < max_months:
            months += 1
            interest = balance * r
            balance += interest + monthly_contribution
            total_contributions += monthly_contribution

        if months >= max_months:
            return None, Decimal("0.00")

        projected_date = start_date + timedelta(days=int(months * 30.4375))
        total_interest = balance - total_contributions

        return projected_date, max(Decimal("0.00"), total_interest.quantize(Decimal("0.01")))

    @classmethod
    def generate_scenarios(
        cls,
        target_amount: Decimal,
        current_saved: Decimal,
        base_monthly_contribution: Decimal,
        expected_annual_return_pct: Decimal = Decimal("8.00"),
        increments: List[Decimal] = None,
    ) -> List[GoalProjectionScenario]:
        """Simulate how saving ₹X more per month accelerates goal completion."""
        if increments is None:
            increments = [Decimal("1000.00"), Decimal("2500.00"), Decimal("5000.00"), Decimal("10000.00")]

        base_date, _ = cls.calculate_projection(
            target_amount, current_saved, base_monthly_contribution, expected_annual_return_pct
        )

        scenarios: List[GoalProjectionScenario] = []
        today = date.today()

        for delta in increments:
            new_contrib = base_monthly_contribution + delta
            proj_date, interest = cls.calculate_projection(
                target_amount, current_saved, new_contrib, expected_annual_return_pct, start_date=today
            )

            if proj_date:
                months_saved = 0
                if base_date and base_date > proj_date:
                    months_saved = int((base_date - proj_date).days / 30.4375)

                scenarios.append(
                    GoalProjectionScenario(
                        monthly_additional_savings=delta,
                        projected_completion_date=proj_date,
                        months_saved=max(0, months_saved),
                        total_interest_earned=interest,
                    )
                )

        return scenarios
