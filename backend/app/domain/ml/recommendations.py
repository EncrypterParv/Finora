"""Behavioural recommendation and financial nudge generator."""

from decimal import Decimal
from typing import Any, Dict, List
import uuid
from app.schemas.analytics import RecommendationDTO


class BehaviouralRecommendationEngine:
    """Generates personalized action points based on behavioural indicators."""

    @staticmethod
    def generate_recommendations(features: Dict[str, Any]) -> List[RecommendationDTO]:
        recommendations: List[RecommendationDTO] = []

        weekend_ratio = features.get("weekend_spend_ratio", 0.0)
        impulse_idx = features.get("impulse_index", 0.0)
        daily_burn = features.get("daily_burn_avg_30d", Decimal("0.00"))
        savings_rate = features.get("savings_rate_pct", 0.0)

        # 1. Weekend spike alert
        if weekend_ratio > 0.45:
            recommendations.append(
                RecommendationDTO(
                    id=str(uuid.uuid4()),
                    priority="HIGH",
                    title="Curb Weekend Splurge Velocity",
                    impact_amount=Decimal(str(round(float(daily_burn) * 4 * 0.3, 2))),
                    rationale=f"{weekend_ratio * 100:.1f}% of your total spending occurs on weekends. Setting a dedicated weekend entertainment cap could save you up to 30% monthly.",
                    action_type="BUDGET_ADJUSTMENT",
                )
            )

        # 2. Impulse micro-transactions
        if impulse_idx > 0.35:
            recommendations.append(
                RecommendationDTO(
                    id=str(uuid.uuid4()),
                    priority="MEDIUM",
                    title="Audit Food & Coffee Micro-Deliveries",
                    impact_amount=Decimal("3500.00"),
                    rationale="High frequency of sub-₹500 food orders detected. Batching meals or using weekly groceries could reduce recurring delivery fees.",
                    action_type="BEHAVIOURAL_NUDGE",
                )
            )

        # 3. Savings boost for FIRE
        if savings_rate < 20.0:
            recommendations.append(
                RecommendationDTO(
                    id=str(uuid.uuid4()),
                    priority="HIGH",
                    title="Boost Savings Rate to Minimum 25%",
                    impact_amount=Decimal("5000.00"),
                    rationale=f"Your current savings rate is {savings_rate:.1f}%. Increasing monthly SIP contributions by ₹5,000 can accelerate your FIRE milestone by 18 months.",
                    action_type="SAVINGS_TRANSFER",
                )
            )

        return recommendations
