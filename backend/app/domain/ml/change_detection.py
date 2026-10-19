"""Behavioural change detection engine comparing rolling active windows against historical baselines."""

from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional
import pandas as pd


class BehaviourChangeDetector:
    """
    Detects statistically sound shifts in user financial behaviour
    by comparing active window (e.g., past 30 days) with historical baseline (prior 60 days).
    """

    @classmethod
    def detect_behavioural_shifts(
        cls,
        transactions: List[Dict[str, Any]],
        active_window_days: int = 30,
        baseline_window_days: int = 60,
        current_date: Optional[datetime] = None,
    ) -> List[Dict[str, Any]]:
        """
        Compare active period metrics against baseline period metrics.
        Returns a list of structured, human-explainable shifts.
        """
        if current_date is None:
            current_date = datetime.now(timezone.utc)
        elif current_date.tzinfo is None:
            current_date = current_date.replace(tzinfo=timezone.utc)

        if len(transactions) < 10:
            return []

        df = pd.DataFrame(transactions)
        df["occurred_at"] = pd.to_datetime(df["occurred_at"], utc=True)
        df["amount"] = df["amount"].astype(float)
        if "category_name" not in df.columns:
            df["category_name"] = "General"
        df["category_name"] = df["category_name"].fillna("General")

        # Partition data into Active Window (0 - 30d ago) and Baseline Window (30d - 90d ago)
        active_cutoff = current_date - timedelta(days=active_window_days)
        baseline_cutoff = current_date - timedelta(days=active_window_days + baseline_window_days)

        df_active = df[(df["occurred_at"] >= pd.Timestamp(active_cutoff))]
        df_baseline = df[(df["occurred_at"] >= pd.Timestamp(baseline_cutoff)) & (df["occurred_at"] < pd.Timestamp(active_cutoff))]

        # If baseline has too few transactions, we cannot make an honest comparative shift calculation
        if len(df_active) < 5 or len(df_baseline) < 5:
            return []

        debits_active = df_active[df_active["transaction_type"] == "DEBIT"]
        debits_baseline = df_baseline[df_baseline["transaction_type"] == "DEBIT"]

        shifts: List[Dict[str, Any]] = []

        # 1. Total Daily Velocity Shift
        active_daily = float(debits_active["amount"].sum()) / float(active_window_days) if not debits_active.empty else 0.0
        baseline_daily = float(debits_baseline["amount"].sum()) / float(baseline_window_days) if not debits_baseline.empty else 0.0

        if baseline_daily > 0:
            velocity_pct_change = ((active_daily - baseline_daily) / baseline_daily) * 100.0
            if abs(velocity_pct_change) >= 15.0:
                is_increase = velocity_pct_change > 0
                shifts.append({
                    "metric_name": "Daily Spending Velocity",
                    "dimension": "VELOCITY",
                    "previous_baseline": Decimal(f"{baseline_daily:.2f}"),
                    "current_value": Decimal(f"{active_daily:.2f}"),
                    "percentage_change": round(velocity_pct_change, 1),
                    "direction": "INCREASING" if is_increase else "DECREASING",
                    "impact_rating": "CONCERNING" if is_increase else "POSITIVE",
                    "summary": (
                        f"Daily burn rate changed by {abs(velocity_pct_change):.1f}% "
                        f"(₹{active_daily:,.2f}/day active vs ₹{baseline_daily:,.2f}/day baseline)."
                    ),
                })

        # 2. Weekend Splurge Shift
        if not debits_active.empty and not debits_baseline.empty:
            active_wknd_sum = float(debits_active[debits_active["occurred_at"].dt.dayofweek.isin([5, 6])]["amount"].sum())
            active_tot = float(debits_active["amount"].sum())
            active_wknd_ratio = (active_wknd_sum / active_tot) if active_tot > 0 else 0.0

            base_wknd_sum = float(debits_baseline[debits_baseline["occurred_at"].dt.dayofweek.isin([5, 6])]["amount"].sum())
            base_tot = float(debits_baseline["amount"].sum())
            base_wknd_ratio = (base_wknd_sum / base_tot) if base_tot > 0 else 0.0

            wknd_delta = (active_wknd_ratio - base_wknd_ratio) * 100.0
            if abs(wknd_delta) >= 8.0:
                is_increase = wknd_delta > 0
                shifts.append({
                    "metric_name": "Weekend Spending Concentration",
                    "dimension": "WEEKEND_HABIT",
                    "previous_baseline": Decimal(f"{base_wknd_ratio * 100:.1f}"),
                    "current_value": Decimal(f"{active_wknd_ratio * 100:.1f}"),
                    "percentage_change": round(wknd_delta, 1),
                    "direction": "INCREASING" if is_increase else "DECREASING",
                    "impact_rating": "CONCERNING" if is_increase else "POSITIVE",
                    "summary": (
                        f"Weekend spend concentration shifted from {base_wknd_ratio * 100:.1f}% to {active_wknd_ratio * 100:.1f}% of total outflow."
                    ),
                })

        # 3. Category Level Shifts (e.g. Dining, Shopping, Travel)
        active_cats = debits_active.groupby("category_name")["amount"].sum() if not debits_active.empty else pd.Series()
        base_cats = debits_baseline.groupby("category_name")["amount"].sum() if not debits_baseline.empty else pd.Series()

        for cat in set(active_cats.index).union(set(base_cats.index)):
            cat_str = str(cat)
            # Normalized to 30-day pace
            act_spend_30d = float(active_cats.get(cat, 0.0)) * (30.0 / active_window_days)
            base_spend_30d = float(base_cats.get(cat, 0.0)) * (30.0 / baseline_window_days)

            if base_spend_30d >= 1000.0 or act_spend_30d >= 1000.0:
                if base_spend_30d > 0:
                    cat_pct = ((act_spend_30d - base_spend_30d) / base_spend_30d) * 100.0
                else:
                    cat_pct = 100.0

                if abs(cat_pct) >= 25.0:
                    is_inc = cat_pct > 0
                    is_discretionary = cat_str in {"Food & Dining", "Dining", "Entertainment", "Shopping", "Personal"}
                    shifts.append({
                        "metric_name": f"{cat_str} Outflow",
                        "dimension": "CATEGORY_SHIFT",
                        "previous_baseline": Decimal(f"{base_spend_30d:.2f}"),
                        "current_value": Decimal(f"{act_spend_30d:.2f}"),
                        "percentage_change": round(cat_pct, 1),
                        "direction": "INCREASING" if is_inc else "DECREASING",
                        "impact_rating": ("CONCERNING" if (is_inc and is_discretionary) else "POSITIVE" if not is_inc else "NEUTRAL"),
                        "summary": (
                            f"{cat_str} 30-day pace is {'up' if is_inc else 'down'} {abs(cat_pct):.1f}% "
                            f"(₹{act_spend_30d:,.2f} vs ₹{base_spend_30d:,.2f} baseline)."
                        ),
                    })

        return shifts
