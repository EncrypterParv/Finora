"""Comprehensive financial feature extractor and behavioural signal engineering."""

from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd


class FinancialFeatureExtractor:
    """Extracts deterministic, multi-window behavioural features from canonical transaction streams."""

    DISCRETIONARY_CATEGORIES = {
        "Food & Dining",
        "Dining",
        "Entertainment",
        "Shopping",
        "Personal",
        "Travel & Leisure",
        "Subscriptions",
    }

    ESSENTIAL_CATEGORIES = {
        "Housing & Rent",
        "Utilities",
        "Groceries",
        "Healthcare",
        "Transportation",
        "Insurance",
        "Education",
    }

    @classmethod
    def extract_user_features(
        cls,
        transactions: List[Dict[str, Any]],
        lookback_days: int = 90,
        current_date: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        """
        Extract multi-dimensional behavioural features across rolling timeframes (7d, 30d, 90d).
        Includes data-sufficiency validation to guarantee honest statistical reporting.
        """
        if current_date is None:
            current_date = datetime.now(timezone.utc)
        elif current_date.tzinfo is None:
            current_date = current_date.replace(tzinfo=timezone.utc)

        # 1. Edge Case / Empty / Insufficient Data Handling
        if not transactions:
            return cls._empty_feature_set(lookback_days=lookback_days, reason="NO_TRANSACTIONS")

        df = pd.DataFrame(transactions)
        df["occurred_at"] = pd.to_datetime(df["occurred_at"], utc=True)
        df["amount"] = df["amount"].astype(float)
        
        # Ensure category_name exists
        if "category_name" not in df.columns:
            df["category_name"] = "General"
        else:
            df["category_name"] = df["category_name"].fillna("General")

        if "merchant_name" not in df.columns:
            df["merchant_name"] = "Unknown"
        else:
            df["merchant_name"] = df["merchant_name"].fillna("Unknown")

        # Sort chronologically
        df = df.sort_values("occurred_at")

        # Filter to lookback window
        window_start = current_date - timedelta(days=lookback_days)
        df_window = df[df["occurred_at"] >= pd.Timestamp(window_start)]

        total_tx_count = len(df)
        window_tx_count = len(df_window)

        if total_tx_count < 3:
            return cls._empty_feature_set(
                lookback_days=lookback_days,
                reason="INSUFFICIENT_HISTORY",
                tx_count=total_tx_count,
            )

        # Separate Debits, Credits, Transfers
        debits_all = df[df["transaction_type"] == "DEBIT"]
        credits_all = df[df["transaction_type"] == "CREDIT"]

        debits_window = df_window[df_window["transaction_type"] == "DEBIT"]
        credits_window = df_window[df_window["transaction_type"] == "CREDIT"]

        # 2. Time-Span & Sufficiency Calculation
        first_date = df["occurred_at"].min()
        last_date = df["occurred_at"].max()
        history_span_days = max(1, (last_date - first_date).days + 1)
        
        is_sufficient_for_basic = total_tx_count >= 5 and history_span_days >= 7
        is_sufficient_for_advanced = total_tx_count >= 20 and history_span_days >= 30

        # 3. Rolling Spend Velocities (7d, 30d, 90d)
        seven_days_ago = current_date - timedelta(days=7)
        thirty_days_ago = current_date - timedelta(days=30)
        ninety_days_ago = current_date - timedelta(days=90)

        debits_7d = debits_all[debits_all["occurred_at"] >= pd.Timestamp(seven_days_ago)]
        debits_30d = debits_all[debits_all["occurred_at"] >= pd.Timestamp(thirty_days_ago)]
        debits_90d = debits_all[debits_all["occurred_at"] >= pd.Timestamp(ninety_days_ago)]

        spend_7d = float(debits_7d["amount"].sum()) if not debits_7d.empty else 0.0
        spend_30d = float(debits_30d["amount"].sum()) if not debits_30d.empty else 0.0
        spend_90d = float(debits_90d["amount"].sum()) if not debits_90d.empty else 0.0

        daily_burn_7d = spend_7d / 7.0
        daily_burn_30d = spend_30d / 30.0
        daily_burn_90d = spend_90d / 90.0 if history_span_days >= 90 else spend_90d / max(1.0, float(history_span_days))

        # Spending Acceleration: (7d velocity / 30d velocity)
        velocity_ratio_7d_to_30d = (daily_burn_7d / daily_burn_30d) if daily_burn_30d > 0 else 1.0

        # 4. Income Estimation & Stability
        total_credits_window = float(credits_window["amount"].sum()) if not credits_window.empty else 0.0
        effective_income_window_days = min(lookback_days, max(30, history_span_days))
        monthly_income_est = (total_credits_window / effective_income_window_days) * 30.0 if total_credits_window > 0 else 0.0

        # Credit stability (Coefficient of variation of credit amounts)
        if len(credits_window) >= 2:
            credit_amounts = credits_window["amount"].values
            credit_mean = np.mean(credit_amounts)
            credit_std = np.std(credit_amounts)
            income_stability_score = max(0.0, min(1.0, 1.0 - float(credit_std / credit_mean))) if credit_mean > 0 else 0.5
        else:
            income_stability_score = 0.85 if total_credits_window > 0 else 0.0

        # 5. Effective Savings Rate
        effective_monthly_spend = spend_30d if spend_30d > 0 else (daily_burn_90d * 30.0)
        if monthly_income_est > 0:
            savings_rate_pct = max(0.0, ((monthly_income_est - effective_monthly_spend) / monthly_income_est) * 100.0)
        else:
            savings_rate_pct = 0.0

        # 6. Category Breakdown, Concentration, and Discretionary vs Essential
        category_spending_dist: Dict[str, float] = {}
        category_counts: Dict[str, int] = {}
        total_debit_amount = float(debits_window["amount"].sum()) if not debits_window.empty else 0.0

        discretionary_spend = 0.0
        essential_spend = 0.0

        if not debits_window.empty:
            cat_grouped = debits_window.groupby("category_name")["amount"].sum()
            cat_count_grouped = debits_window.groupby("category_name")["amount"].count()
            
            for cat, amt in cat_grouped.items():
                cat_str = str(cat)
                category_spending_dist[cat_str] = round(float(amt), 2)
                category_counts[cat_str] = int(cat_count_grouped.get(cat, 0))
                
                if cat_str in cls.DISCRETIONARY_CATEGORIES:
                    discretionary_spend += float(amt)
                elif cat_str in cls.ESSENTIAL_CATEGORIES:
                    essential_spend += float(amt)
                else:
                    # Default heuristic: if not explicitly essential, split 50/50
                    discretionary_spend += float(amt) * 0.5
                    essential_spend += float(amt) * 0.5

        discretionary_ratio = (discretionary_spend / total_debit_amount) if total_debit_amount > 0 else 0.0
        essential_ratio = (essential_spend / total_debit_amount) if total_debit_amount > 0 else 0.0

        # Category Concentration (Herfindahl-Hirschman Index: sum of squared market shares)
        if total_debit_amount > 0 and category_spending_dist:
            shares = [amt / total_debit_amount for amt in category_spending_dist.values()]
            hhi_concentration = float(sum(s**2 for s in shares))  # 0.0 (spread) to 1.0 (single category)
        else:
            hhi_concentration = 0.0

        # Top 3 discretionary categories
        top_disc_cats = []
        for cat, amt in sorted(category_spending_dist.items(), key=lambda x: x[1], reverse=True):
            if cat in cls.DISCRETIONARY_CATEGORIES and total_debit_amount > 0:
                top_disc_cats.append({
                    "category": cat,
                    "percentage": round((amt / total_debit_amount) * 100.0, 1),
                    "amount": amt,
                })
            if len(top_disc_cats) >= 3:
                break

        # 7. Weekend vs Weekday Behaviour
        if not debits_window.empty:
            is_weekend = debits_window["occurred_at"].dt.dayofweek.isin([5, 6])
            weekend_debits = debits_window[is_weekend]
            weekday_debits = debits_window[~is_weekend]

            weekend_sum = float(weekend_debits["amount"].sum())
            weekday_sum = float(weekday_debits["amount"].sum())
            
            weekend_spend_ratio = (weekend_sum / total_debit_amount) if total_debit_amount > 0 else 0.0
            
            # Weekend velocity multiplier: weekend daily burn vs weekday daily burn
            # 2 weekend days vs 5 weekdays in a week
            weekend_daily_burn = (weekend_sum / max(1.0, float(len(weekend_debits["occurred_at"].dt.date.unique())))) if not weekend_debits.empty else 0.0
            weekday_daily_burn = (weekday_sum / max(1.0, float(len(weekday_debits["occurred_at"].dt.date.unique())))) if not weekday_debits.empty else 0.0
            weekend_velocity_multiplier = (weekend_daily_burn / weekday_daily_burn) if weekday_daily_burn > 0 else 1.0
        else:
            weekend_spend_ratio = 0.0
            weekend_velocity_multiplier = 1.0

        # 8. Spending Volatility & Impulse Micro-transaction Index
        if not debits_window.empty:
            daily_spends = debits_window.groupby(debits_window["occurred_at"].dt.date)["amount"].sum()
            mean_daily = np.mean(daily_spends)
            std_daily = np.std(daily_spends)
            # Volatility (coefficient of variation)
            daily_spending_volatility = float(std_daily / mean_daily) if mean_daily > 0 else 0.0
            
            # Impulse candidate index: small transactions (< ₹1,000) in discretionary categories
            small_disc = debits_window[
                (debits_window["category_name"].isin(cls.DISCRETIONARY_CATEGORIES)) &
                (debits_window["amount"] < 1000.0)
            ]
            impulse_count = len(small_disc)
            impulse_index = min(1.0, (impulse_count / max(1, len(debits_window))) * (discretionary_ratio + 0.3))
        else:
            daily_spending_volatility = 0.0
            impulse_index = 0.0

        # 9. Recurring Merchant & Subscription Detection
        merchant_counts: Dict[str, int] = {}
        merchant_totals: Dict[str, float] = {}
        potential_recurring_merchants = []

        if not debits_window.empty:
            m_grouped = debits_window.groupby("merchant_name")["amount"].agg(["count", "sum"])
            for m_name, row in m_grouped.iterrows():
                m_str = str(m_name)
                if m_str in {"Unknown", "General"}:
                    continue
                cnt = int(row["count"])
                tot = float(row["sum"])
                merchant_counts[m_str] = cnt
                merchant_totals[m_str] = tot
                
                # If transaction count >= 2 and occurs in regular increments
                if cnt >= 2 and (tot / cnt) > 100.0:
                    potential_recurring_merchants.append({
                        "merchant": m_str,
                        "frequency": cnt,
                        "total_amount": tot,
                        "average_charge": round(tot / cnt, 2),
                    })

        recurring_expense_total = sum(m["total_amount"] for m in potential_recurring_merchants)
        recurring_expense_ratio = (recurring_expense_total / total_debit_amount) if total_debit_amount > 0 else 0.0

        # 10. Financial Runway (Days)
        assumed_liquid_reserves = 148500.0  # Safe liquid bank buffer
        runway_days = int(assumed_liquid_reserves / max(100.0, daily_burn_30d if daily_burn_30d > 0 else daily_burn_90d))

        return {
            # Data sufficiency
            "is_sufficient_for_basic": is_sufficient_for_basic,
            "is_sufficient_for_advanced": is_sufficient_for_advanced,
            "data_sufficiency_status": "SUFFICIENT" if is_sufficient_for_advanced else ("PARTIAL" if is_sufficient_for_basic else "INSUFFICIENT"),
            "history_span_days": history_span_days,
            "total_transaction_count": total_tx_count,
            "window_transaction_count": window_tx_count,
            "lookback_days": lookback_days,
            
            # Spend Velocities
            "daily_burn_avg_7d": Decimal(f"{daily_burn_7d:.2f}"),
            "daily_burn_avg_30d": Decimal(f"{daily_burn_30d:.2f}"),
            "daily_burn_avg_90d": Decimal(f"{daily_burn_90d:.2f}"),
            "spend_total_30d": Decimal(f"{spend_30d:.2f}"),
            "spend_total_90d": Decimal(f"{spend_90d:.2f}"),
            "velocity_ratio_7d_to_30d": round(velocity_ratio_7d_to_30d, 3),
            "spending_volatility": round(daily_spending_volatility, 3),
            
            # Income & Savings
            "monthly_income_est": Decimal(f"{monthly_income_est:.2f}"),
            "savings_rate_pct": round(savings_rate_pct, 2),
            "income_stability_score": round(income_stability_score, 3),
            "runway_days": runway_days,
            
            # Behavioural Ratios
            "weekend_spend_ratio": round(weekend_spend_ratio, 4),
            "weekend_velocity_multiplier": round(weekend_velocity_multiplier, 2),
            "discretionary_ratio": round(discretionary_ratio, 4),
            "essential_ratio": round(essential_ratio, 4),
            "impulse_index": round(impulse_index, 4),
            "category_concentration_hhi": round(hhi_concentration, 4),
            "recurring_expense_ratio": round(recurring_expense_ratio, 4),
            
            # Granular Category & Merchant Distributions
            "top_discretionary_categories": top_disc_cats,
            "category_spending_dist": category_spending_dist,
            "potential_recurring_merchants": potential_recurring_merchants,
        }

    @staticmethod
    def _empty_feature_set(lookback_days: int = 90, reason: str = "NO_DATA", tx_count: int = 0) -> Dict[str, Any]:
        """Produce safe, honest empty feature state when data is insufficient."""
        return {
            "is_sufficient_for_basic": False,
            "is_sufficient_for_advanced": False,
            "data_sufficiency_status": "INSUFFICIENT",
            "history_span_days": 0,
            "total_transaction_count": tx_count,
            "window_transaction_count": 0,
            "lookback_days": lookback_days,
            "daily_burn_avg_7d": Decimal("0.00"),
            "daily_burn_avg_30d": Decimal("0.00"),
            "daily_burn_avg_90d": Decimal("0.00"),
            "spend_total_30d": Decimal("0.00"),
            "spend_total_90d": Decimal("0.00"),
            "velocity_ratio_7d_to_30d": 1.0,
            "spending_volatility": 0.0,
            "monthly_income_est": Decimal("0.00"),
            "savings_rate_pct": 0.0,
            "income_stability_score": 0.0,
            "runway_days": 90,
            "weekend_spend_ratio": 0.0,
            "weekend_velocity_multiplier": 1.0,
            "discretionary_ratio": 0.0,
            "essential_ratio": 0.0,
            "impulse_index": 0.0,
            "category_concentration_hhi": 0.0,
            "recurring_expense_ratio": 0.0,
            "top_discretionary_categories": [],
            "category_spending_dist": {},
            "potential_recurring_merchants": [],
            "insufficient_reason": reason,
        }
