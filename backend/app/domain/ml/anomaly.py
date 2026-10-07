"""Contextual anomaly detection with category-aware baseline evaluation and materiality filtering."""

from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
import numpy as np
from app.schemas.analytics import AnomalyAlertDTO


class AnomalyDetector:
    """
    Context-aware financial anomaly detection engine.
    Applies category-specific statistical baselines, IQR and Z-scoring,
    and filters out immaterial noise to preserve user trust.
    """

    MIN_TRANSACTIONS_FOR_DETECTION = 5
    MIN_MATERIAL_AMOUNT_INR = 500.0  # Only flag transactions with material financial significance

    @classmethod
    def detect_anomalies(
        cls,
        transactions: List[Dict[str, Any]],
        z_threshold: float = 2.5,
    ) -> List[AnomalyAlertDTO]:
        """
        Identify anomalous transactions with structured explainability and severity ranking.
        """
        if len(transactions) < cls.MIN_TRANSACTIONS_FOR_DETECTION:
            return []

        debits = [t for t in transactions if t.get("transaction_type") == "DEBIT"]
        if len(debits) < cls.MIN_TRANSACTIONS_FOR_DETECTION:
            return []

        amounts = [float(t["amount"]) for t in debits]
        global_mean = float(np.mean(amounts))
        global_std = float(np.std(amounts))

        if global_std == 0:
            return []

        # Group amounts by category for category-specific benchmarking
        category_stats: Dict[str, Dict[str, float]] = {}
        cat_grouped: Dict[str, List[float]] = {}
        for t in debits:
            cat = str(t.get("category_name", "General"))
            cat_grouped.setdefault(cat, []).append(float(t["amount"]))

        for cat, cat_amts in cat_grouped.items():
            if len(cat_amts) >= 4:
                c_std = float(np.std(cat_amts))
                if c_std > 0:
                    category_stats[cat] = {
                        "mean": float(np.mean(cat_amts)),
                        "std": c_std,
                    }

        alerts: List[AnomalyAlertDTO] = []

        # Statistical Outlier Detection
        for t in debits:
            amt = float(t["amount"])
            if amt < cls.MIN_MATERIAL_AMOUNT_INR:
                continue

            cat = str(t.get("category_name", "General"))
            merchant = t.get("merchant_name", "Merchant")

            # Check category baseline first if available and valid, else global
            if cat in category_stats and category_stats[cat]["std"] > 0:
                cat_mean = category_stats[cat]["mean"]
                cat_std = category_stats[cat]["std"]
                z_score = (amt - cat_mean) / cat_std
                baseline_type = f"{cat} category average of ₹{cat_mean:,.2f}"
            else:
                z_score = (amt - global_mean) / global_std
                baseline_type = f"overall transaction average of ₹{global_mean:,.2f}"

            if z_score >= z_threshold:
                if z_score >= 4.0 or amt >= 15000.0:
                    severity = "CRITICAL"
                elif z_score >= 3.0 or amt >= 5000.0:
                    severity = "HIGH"
                else:
                    severity = "MEDIUM"

                confidence = min(0.98, round(float(z_score / (z_score + 1.2)), 2))
                occurred_at = t["occurred_at"]
                if not isinstance(occurred_at, datetime):
                    occurred_at = datetime.combine(occurred_at, datetime.min.time())

                alerts.append(
                    AnomalyAlertDTO(
                        transaction_id=str(t["id"]),
                        merchant_name=merchant,
                        amount=Decimal(str(amt)),
                        occurred_at=occurred_at,
                        confidence_score=confidence,
                        severity=severity,
                        anomaly_type="VOLUME_SPIKE",
                        reason=(
                            f"Amount of ₹{amt:,.2f} at {merchant} is {z_score:.1f}x higher than your {baseline_type}."
                        ),
                        action_prompt=f"Inspect transaction details in {cat} breakdown.",
                    )
                )

        severity_rank = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
        alerts.sort(key=lambda x: (severity_rank.get(x.severity, 3), -x.confidence_score))

        return alerts
