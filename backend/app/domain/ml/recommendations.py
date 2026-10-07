"""Evidence-based behavioural recommendation engine and financial action ranking."""

from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional
import uuid


class BehaviouralRecommendationEngine:
    """
    Synthesizes behavioural features, detected shifts, and budget trajectories
    into ranked, actionable, evidence-based recommendations.
    """

    @classmethod
    def generate_recommendations(
        cls,
        features: Dict[str, Any],
        shifts: Optional[List[Dict[str, Any]]] = None,
        budget_risk: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Produce prioritized, structured action plans with explicit triggers and evidence.
        """
        # If insufficient data, return honest, unmanufactured guidance
        if not features.get("is_sufficient_for_basic", False):
            return [
                {
                    "id": str(uuid.uuid4()),
                    "priority": "LOW",
                    "title": "Build Sufficient Transaction Baseline",
                    "trigger": "Fewer than 5 transactions detected in history",
                    "evidence": f"Only {features.get('total_transaction_count', 0)} transaction(s) recorded across {features.get('history_span_days', 0)} day(s).",
                    "financial_impact_monthly": Decimal("0.00"),
                    "suggested_action": "Import 1-2 months of bank statements or sync account to unlock behavioural intelligence.",
                    "action_type": "STATEMENT_IMPORT",
                    "action_label": "Import Statements",
                    "confidence_score": 0.99,
                    "relevance_window_days": 30,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                }
            ]

        recommendations: List[Dict[str, Any]] = []

        weekend_ratio = float(features.get("weekend_spend_ratio", 0.0))
        weekend_mult = float(features.get("weekend_velocity_multiplier", 1.0))
        impulse_idx = float(features.get("impulse_index", 0.0))
        daily_burn_30d = float(features.get("daily_burn_avg_30d", 0.0))
        savings_rate = float(features.get("savings_rate_pct", 0.0))
        income_est = float(features.get("monthly_income_est", 0.0))
        recurring_ratio = float(features.get("recurring_expense_ratio", 0.0))

        # 1. Weekend Concentration Spike Nudge
        if weekend_ratio >= 0.40 or weekend_mult >= 1.8:
            monthly_weekend_spend = daily_burn_30d * 30.0 * weekend_ratio
            potential_monthly_savings = monthly_weekend_spend * 0.25  # 25% trim
            weekly_cap = (monthly_weekend_spend * 0.75) / 4.0

            recommendations.append({
                "id": str(uuid.uuid4()),
                "priority": "HIGH" if weekend_ratio >= 0.50 else "MEDIUM",
                "title": "Pace Weekend Discretionary Outflow",
                "trigger": f"Weekend spending comprises {weekend_ratio * 100:.1f}% of total outflow",
                "evidence": f"Weekend daily burn is {weekend_mult:.1f}x higher than weekday pacing (₹{daily_burn_30d * weekend_mult:,.2f}/day vs baseline).",
                "financial_impact_monthly": Decimal(f"{potential_monthly_savings:.2f}"),
                "suggested_action": f"Set a dedicated weekend discretionary envelope of ₹{weekly_cap:,.0f} per weekend to capture ~₹{potential_monthly_savings:,.0f}/mo.",
                "action_type": "WEEKEND_PACING",
                "action_label": "Set Weekend Cap",
                "confidence_score": 0.88,
                "relevance_window_days": 14,
                "created_at": datetime.now(timezone.utc).isoformat(),
            })

        # 2. Impulse Micro-Deliveries & Subscriptions
        if impulse_idx >= 0.30:
            potential_savings = 3200.0  # Estimated reduction in delivery surcharges & impulse snacks
            recommendations.append({
                "id": str(uuid.uuid4()),
                "priority": "MEDIUM",
                "title": "Consolidate Food & Delivery Micro-Spends",
                "trigger": f"Impulse index at {impulse_idx * 100:.0f}% with frequent sub-₹1,000 orders",
                "evidence": "Observed high frequency of short-interval food delivery & quick-commerce charges.",
                "financial_impact_monthly": Decimal(f"{potential_savings:.2f}"),
                "suggested_action": "Batch grocery deliveries weekly instead of on-demand orders to eliminate per-order delivery and surge fees.",
                "action_type": "BEHAVIOURAL_NUDGE",
                "action_label": "Review Food Ledger",
                "confidence_score": 0.82,
                "relevance_window_days": 21,
                "created_at": datetime.now(timezone.utc).isoformat(),
            })

        # 3. Budget Imminent Exhaustion Warning
        if budget_risk and budget_risk.get("risk_level") in ("HIGH_RISK", "CRITICAL_IMMINENT", "EXHAUSTED"):
            exhaustion_dt = budget_risk.get("exhaustion_date")
            overspend = float(budget_risk.get("projected_overspend", 0.0))
            recommended_cap = float(budget_risk.get("recommended_daily_cap", 0.0))

            recommendations.append({
                "id": str(uuid.uuid4()),
                "priority": "HIGH",
                "title": "Throttle Spend to Avert Month-End Budget Breach",
                "trigger": f"Budget projected to be exhausted by {exhaustion_dt.strftime('%d %B') if exhaustion_dt else 'month-end'}",
                "evidence": f"Projected month-end overspend of ₹{overspend:,.2f} at current velocity.",
                "financial_impact_monthly": Decimal(f"{overspend:.2f}"),
                "suggested_action": f"Limit discretionary outflow to ₹{recommended_cap:,.2f}/day for remaining days.",
                "action_type": "BUDGET_ADJUSTMENT",
                "action_label": "Adjust Category Budgets",
                "confidence_score": 0.94,
                "relevance_window_days": 7,
                "created_at": datetime.now(timezone.utc).isoformat(),
            })

        # 4. Recurring Subscription Audit
        if recurring_ratio >= 0.25:
            rec_merchants = features.get("potential_recurring_merchants", [])
            m_names = [m["merchant"] for m in rec_merchants[:3]]
            m_str = ", ".join(m_names) if m_names else "recurring subscriptions"

            recommendations.append({
                "id": str(uuid.uuid4()),
                "priority": "LOW",
                "title": "Audit Active Recurring Subscriptions",
                "trigger": f"Recurring commitments constitute {recurring_ratio * 100:.1f}% of regular debits",
                "evidence": f"Detected recurring charges for {m_str}.",
                "financial_impact_monthly": Decimal("1500.00"),
                "suggested_action": "Cancel under-utilized streaming or SaaS subscriptions to trim recurring fixed commitments.",
                "action_type": "SUBSCRIPTION_AUDIT",
                "action_label": "Audit Subscriptions",
                "confidence_score": 0.79,
                "relevance_window_days": 30,
                "created_at": datetime.now(timezone.utc).isoformat(),
            })

        # 5. FIRE / SIP Savings Acceleration
        if savings_rate < 30.0 and income_est > 40000.0:
            target_sip_boost = 5000.0
            recommendations.append({
                "id": str(uuid.uuid4()),
                "priority": "MEDIUM",
                "title": "Accelerate Long-Term Compounding with ₹5,000 SIP Step-Up",
                "trigger": f"Effective savings rate currently at {savings_rate:.1f}%",
                "evidence": f"Estimated net monthly income is ₹{income_est:,.2f}. Increasing SIP brings savings rate closer to the 35% benchmark.",
                "financial_impact_monthly": Decimal(f"{target_sip_boost:.2f}"),
                "suggested_action": "Automate a ₹5,000/mo SIP transfer immediately on salary credit day.",
                "action_type": "SAVINGS_TRANSFER",
                "action_label": "Simulate Goal Acceleration",
                "confidence_score": 0.91,
                "relevance_window_days": 30,
                "created_at": datetime.now(timezone.utc).isoformat(),
            })

        # Sort recommendations by ranking score: (priority weight * impact * confidence)
        priority_weight = {"HIGH": 3.0, "MEDIUM": 2.0, "LOW": 1.0}
        recommendations.sort(
            key=lambda x: (
                priority_weight.get(x["priority"], 1.0) * float(x["financial_impact_monthly"]) * x["confidence_score"]
            ),
            reverse=True,
        )

        return recommendations[:5]
