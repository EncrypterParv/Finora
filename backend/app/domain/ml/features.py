"""Feature engineering for financial transactions."""

from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Any, Dict, List
import pandas as pd
import numpy as np


class FinancialFeatureExtractor:
    """Extracts behavioural signals from canonical transaction records."""

    @staticmethod
    def extract_user_features(transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Compute rolling behavioural vectors from transaction dictionary list."""
        if not transactions:
            return {
                "daily_burn_avg_30d": Decimal("0.00"),
                "weekend_spend_ratio": 0.0,
                "discretionary_ratio": 0.0,
                "impulse_index": 0.0,
                "monthly_income_est": Decimal("0.00"),
                "savings_rate_pct": 0.0,
                "runway_days": 90,
                "transaction_count": 0,
            }

        df = pd.DataFrame(transactions)
        df["occurred_at"] = pd.to_datetime(df["occurred_at"])
        df["amount"] = df["amount"].astype(float)
        
        now = datetime.now(timezone.utc)
        thirty_days_ago = now - timedelta(days=30)
        
        # Debits vs Credits
        debits = df[df["transaction_type"] == "DEBIT"]
        credits = df[df["transaction_type"] == "CREDIT"]

        # 30-day window
        df_30d = debits[debits["occurred_at"] >= pd.Timestamp(thirty_days_ago)]
        total_debit_30d = df_30d["amount"].sum() if not df_30d.empty else 0.0
        daily_burn_30d = total_debit_30d / 30.0

        # Weekend vs Weekday analysis
        if not debits.empty:
            debits_weekend = debits[debits["occurred_at"].dt.dayofweek.isin([5, 6])]
            weekend_ratio = (debits_weekend["amount"].sum() / debits["amount"].sum()) if debits["amount"].sum() > 0 else 0.0
        else:
            weekend_ratio = 0.0

        # Discretionary vs Essential category tagging
        discretionary_cats = {"Food & Dining", "Entertainment", "Shopping", "Personal"}
        if not debits.empty and "category_name" in debits.columns:
            discretionary_spend = debits[debits["category_name"].isin(discretionary_cats)]["amount"].sum()
            total_spend = debits["amount"].sum()
            discretionary_ratio = (discretionary_spend / total_spend) if total_spend > 0 else 0.0
        else:
            discretionary_ratio = 0.0

        # Impulse index: high frequency small-to-medium transactions in discretionary categories
        impulse_candidates = df_30d[(df_30d["category_name"].isin(discretionary_cats)) & (df_30d["amount"] < 2500)] if not df_30d.empty else pd.DataFrame()
        impulse_index = min(1.0, (len(impulse_candidates) / max(1, len(df_30d))) * (discretionary_ratio + 0.2)) if not df_30d.empty else 0.2

        # Monthly income estimation from recurring credits
        monthly_income = credits["amount"].sum() if not credits.empty else 0.0
        if len(df["occurred_at"]) > 1:
            date_range_days = max(1, (df["occurred_at"].max() - df["occurred_at"].min()).days)
            monthly_income = (monthly_income / date_range_days) * 30.0

        savings_rate = ((monthly_income - total_debit_30d) / monthly_income * 100.0) if monthly_income > 0 else 0.0

        return {
            "daily_burn_avg_30d": Decimal(f"{daily_burn_30d:.2f}"),
            "weekend_spend_ratio": round(float(weekend_ratio), 4),
            "discretionary_ratio": round(float(discretionary_ratio), 4),
            "impulse_index": round(float(impulse_index), 4),
            "monthly_income_est": Decimal(f"{monthly_income:.2f}"),
            "savings_rate_pct": round(float(savings_rate), 2),
            "runway_days": int(150000 / max(1.0, daily_burn_30d)),
            "transaction_count": len(df),
        }
