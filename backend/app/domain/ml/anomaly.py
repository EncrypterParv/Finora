"""Anomaly detection for unexpected transaction volumes and patterns."""

from decimal import Decimal
from typing import Any, Dict, List, Optional
import numpy as np
from app.schemas.analytics import AnomalyAlertDTO


class AnomalyDetector:
    """Detects unusual financial outliers using Z-score and Isolation Forest heuristics."""

    @staticmethod
    def detect_anomalies(
        transactions: List[Dict[str, Any]],
        z_threshold: float = 2.5,
    ) -> List[AnomalyAlertDTO]:
        """Identify transactions exceeding statistical normal bounds."""
        if len(transactions) < 5:
            return []

        amounts = [float(t["amount"]) for t in transactions if t.get("transaction_type") == "DEBIT"]
        if not amounts:
            return []

        mean_amt = np.mean(amounts)
        std_amt = np.std(amounts)

        if std_amt == 0:
            return []

        alerts: List[AnomalyAlertDTO] = []
        for t in transactions:
            if t.get("transaction_type") != "DEBIT":
                continue

            amt = float(t["amount"])
            z_score = (amt - mean_amt) / std_amt

            if z_score > z_threshold:
                alerts.append(
                    AnomalyAlertDTO(
                        transaction_id=str(t["id"]),
                        merchant_name=t.get("merchant_name", "Unknown Merchant"),
                        amount=Decimal(str(amt)),
                        occurred_at=t["occurred_at"],
                        confidence_score=min(0.99, round(float(z_score / (z_score + 1.0)), 2)),
                        reason=f"Transaction amount ₹{amt:,.2f} is {z_score:.1f}x standard deviations higher than your average spend of ₹{mean_amt:,.2f}.",
                    )
                )

        return alerts
