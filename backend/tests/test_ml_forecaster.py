"""Tests for spending forecast and ML components."""

from datetime import date
from decimal import Decimal
import pytest
from app.domain.ml.forecaster import SpendingForecaster
from app.domain.ml.anomaly import AnomalyDetector
from app.domain.ml.features import FinancialFeatureExtractor


def test_spending_forecaster_month_end():
    # If today is Oct 10th and spent is 10,000
    today = date(2026, 10, 10)
    current_spent = Decimal("10000.00")
    
    # 10,000 / 10 days = 1,000 / day. Month has 31 days. Remaining = 21 days * 1000 = 21,000. Total = 31,000
    forecast = SpendingForecaster.forecast_month_end_burn(
        current_month_spent=current_spent,
        today=today,
    )
    assert forecast == Decimal("31000.00")


def test_predict_budget_exhaustion():
    today = date(2026, 10, 10)
    budget = Decimal("30000.00")
    current_spent = Decimal("20000.00")
    daily_burn = Decimal("2000.00")  # Remaining 10,000 / 2,000 = 5 days -> Oct 15

    exhaustion_date = SpendingForecaster.predict_budget_exhaustion(
        budget_limit=budget,
        current_spent=current_spent,
        daily_burn_rate=daily_burn,
        today=today,
    )
    assert exhaustion_date == date(2026, 10, 15)


def test_anomaly_detection():
    sample_txs = [
        {"id": f"t-{i}", "amount": Decimal("500.00"), "transaction_type": "DEBIT", "occurred_at": date.today(), "merchant_name": "Lunch"}
        for i in range(20)
    ]
    # Add an outlier
    sample_txs.append(
        {"id": "t-outlier", "amount": Decimal("45000.00"), "transaction_type": "DEBIT", "occurred_at": date.today(), "merchant_name": "Luxury Watch"}
    )

    anomalies = AnomalyDetector.detect_anomalies(sample_txs)
    assert len(anomalies) == 1
    assert anomalies[0].transaction_id == "t-outlier"
    assert anomalies[0].amount == Decimal("45000.00")
