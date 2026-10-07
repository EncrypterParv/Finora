"""Comprehensive test suite for Phase 4 Financial Behaviour Intelligence pipeline."""

from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.seeder import seed_demo_data_if_empty
from app.domain.ml.anomaly import AnomalyDetector
from app.domain.ml.change_detection import BehaviourChangeDetector
from app.domain.ml.features import FinancialFeatureExtractor
from app.domain.ml.forecaster import SpendingForecaster
from app.domain.ml.recommendations import BehaviouralRecommendationEngine


def test_feature_extractor_data_sufficiency():
    # 0 transactions -> INSUFFICIENT
    empty_features = FinancialFeatureExtractor.extract_user_features([])
    assert empty_features["is_sufficient_for_basic"] is False
    assert empty_features["data_sufficiency_status"] == "INSUFFICIENT"
    assert empty_features["daily_burn_avg_30d"] == Decimal("0.00")

    # 2 transactions -> INSUFFICIENT
    sparse_txs = [
        {"id": "1", "occurred_at": datetime(2026, 10, 1, tzinfo=timezone.utc), "amount": Decimal("100.00"), "transaction_type": "DEBIT"},
        {"id": "2", "occurred_at": datetime(2026, 10, 2, tzinfo=timezone.utc), "amount": Decimal("200.00"), "transaction_type": "DEBIT"},
    ]
    sparse_features = FinancialFeatureExtractor.extract_user_features(sparse_txs)
    assert sparse_features["is_sufficient_for_basic"] is False


def test_feature_extractor_multi_window_and_ratios():
    now = datetime(2026, 10, 20, 12, 0, 0, tzinfo=timezone.utc)
    sample_txs = []
    
    # 1. Add monthly salary
    sample_txs.append({
        "id": "salary",
        "occurred_at": datetime(2026, 10, 1, 10, 0, 0, tzinfo=timezone.utc),
        "amount": Decimal("85000.00"),
        "transaction_type": "CREDIT",
        "category_name": "Income",
        "merchant_name": "Employer Inc",
    })

    # 2. Add weekday essential debits (Groceries)
    for day in range(1, 15):
        sample_txs.append({
            "id": f"groceries-{day}",
            "occurred_at": datetime(2026, 10, day, 14, 0, 0, tzinfo=timezone.utc),
            "amount": Decimal("500.00"),
            "transaction_type": "DEBIT",
            "category_name": "Groceries",
            "merchant_name": "Supermarket",
        })

    # 3. Add weekend splurge debits (Dining & Entertainment on Saturdays/Sundays)
    # Oct 3, 4, 10, 11, 17, 18 are weekends in Oct 2026
    for weekend_day in [3, 4, 10, 11, 17, 18]:
        sample_txs.append({
            "id": f"dining-{weekend_day}",
            "occurred_at": datetime(2026, 10, weekend_day, 20, 0, 0, tzinfo=timezone.utc),
            "amount": Decimal("2500.00"),
            "transaction_type": "DEBIT",
            "category_name": "Food & Dining",
            "merchant_name": "Bistro",
        })

    features = FinancialFeatureExtractor.extract_user_features(
        sample_txs,
        lookback_days=30,
        current_date=now,
    )

    assert features["is_sufficient_for_basic"] is True
    assert features["total_transaction_count"] >= 20
    assert float(features["daily_burn_avg_30d"]) > 0
    assert float(features["savings_rate_pct"]) > 0
    assert features["weekend_spend_ratio"] > 0.5  # Weekend spend should be majority
    assert features["weekend_velocity_multiplier"] > 1.5
    assert len(features["top_discretionary_categories"]) > 0
    assert features["category_concentration_hhi"] > 0.0


def test_spending_forecaster_uncertainty():
    today = date(2026, 10, 15)
    current_spent = Decimal("15000.00")
    daily_burn = Decimal("1000.00")

    result = SpendingForecaster.forecast_month_end_burn_with_uncertainty(
        current_month_spent=current_spent,
        daily_burn_rate=daily_burn,
        today=today,
    )

    assert result["expected_total_burn"] == Decimal("31000.00")
    assert result["lower_bound_80"] < result["expected_total_burn"]
    assert result["upper_bound_80"] > result["expected_total_burn"]
    assert result["confidence_level_pct"] == 80
    assert result["model_version"] == "v1.4-dow-ema-uncertainty"


def test_budget_exhaustion_evaluation_edge_cases():
    today = date(2026, 10, 10)

    # Edge Case 1: Already exhausted
    res_exhausted = SpendingForecaster.evaluate_budget_risk(
        budget_limit=Decimal("20000.00"),
        current_spent=Decimal("21500.00"),
        daily_burn_rate=Decimal("500.00"),
        today=today,
    )
    assert res_exhausted["risk_level"] == "EXHAUSTED"
    assert res_exhausted["exhaustion_date"] == today
    assert res_exhausted["recommended_daily_cap"] == Decimal("0.00")

    # Edge Case 2: Zero burn rate
    res_zero = SpendingForecaster.evaluate_budget_risk(
        budget_limit=Decimal("50000.00"),
        current_spent=Decimal("10000.00"),
        daily_burn_rate=Decimal("0.00"),
        today=today,
    )
    assert res_zero["risk_level"] == "SAFE"
    assert res_zero["exhaustion_date"] is None

    # Edge Case 3: High risk impending breach
    # Limit = 30,000, Spent = 24,000, Burn = 2,000/day -> Remaining 6,000 / 2,000 = 3 days -> Oct 13
    res_high_risk = SpendingForecaster.evaluate_budget_risk(
        budget_limit=Decimal("30000.00"),
        current_spent=Decimal("24000.00"),
        daily_burn_rate=Decimal("2000.00"),
        today=today,
    )
    assert res_high_risk["risk_level"] == "CRITICAL_IMMINENT"
    assert res_high_risk["exhaustion_date"] == date(2026, 10, 13)
    assert res_high_risk["projected_overspend"] > Decimal("0.00")


def test_behaviour_change_detection():
    now = datetime(2026, 10, 20, 12, 0, 0, tzinfo=timezone.utc)
    txs = []

    # Historical baseline (30 to 90 days ago): Low spend (₹200/day)
    for day_offset in range(35, 85):
        txs.append({
            "id": f"base-{day_offset}",
            "occurred_at": now - timedelta(days=day_offset),
            "amount": Decimal("200.00"),
            "transaction_type": "DEBIT",
            "category_name": "Food & Dining",
            "merchant_name": "Cafeteria",
        })

    # Active window (0 to 30 days ago): Elevated spend (₹1,500/day)
    for day_offset in range(1, 25):
        txs.append({
            "id": f"active-{day_offset}",
            "occurred_at": now - timedelta(days=day_offset),
            "amount": Decimal("1500.00"),
            "transaction_type": "DEBIT",
            "category_name": "Food & Dining",
            "merchant_name": "Bistro Dining",
        })

    shifts = BehaviourChangeDetector.detect_behavioural_shifts(
        transactions=txs,
        active_window_days=30,
        baseline_window_days=60,
        current_date=now,
    )

    assert len(shifts) > 0
    velocity_shift = next((s for s in shifts if s["dimension"] == "VELOCITY"), None)
    assert velocity_shift is not None
    assert velocity_shift["direction"] == "INCREASING"
    assert velocity_shift["impact_rating"] == "CONCERNING"


def test_recommendation_ranking_and_evidence():
    features = {
        "is_sufficient_for_basic": True,
        "weekend_spend_ratio": 0.58,
        "weekend_velocity_multiplier": 2.6,
        "impulse_index": 0.42,
        "daily_burn_avg_30d": Decimal("1800.00"),
        "savings_rate_pct": 18.0,
        "monthly_income_est": Decimal("75000.00"),
        "recurring_expense_ratio": 0.30,
        "potential_recurring_merchants": [{"merchant": "Netflix", "frequency": 3, "total_amount": 1999.0}],
    }

    recs = BehaviouralRecommendationEngine.generate_recommendations(features=features)
    assert len(recs) >= 2

    top_rec = recs[0]
    assert "trigger" in top_rec
    assert "evidence" in top_rec
    assert "suggested_action" in top_rec
    assert top_rec["confidence_score"] > 0.75
    assert float(top_rec["financial_impact_monthly"]) > 0


@pytest.mark.asyncio
async def test_analytics_overview_endpoint_integration(client: AsyncClient, db_session: AsyncSession):
    await seed_demo_data_if_empty(db_session)

    overview_resp = await client.get("/api/v1/analytics/overview")
    assert overview_resp.status_code == 200
    data = overview_resp.json()

    assert "liquid_balance" in data
    assert "behaviour_profile" in data
    assert "forecast" in data
    assert "observed_shifts" in data
    assert "recommendations" in data
    assert "data_sufficiency" in data

    # Validate Forecast Uncertainty
    forecast = data["forecast"]
    assert float(forecast["expected_total_burn"]) > 0
    assert float(forecast["lower_bound_80"]) <= float(forecast["expected_total_burn"])
    assert float(forecast["upper_bound_80"]) >= float(forecast["expected_total_burn"])
    assert forecast["methodology"] != ""
    assert forecast["confidence_level_pct"] == 80

    # Validate Recommendations
    recs = data["recommendations"]
    assert len(recs) > 0
    for r in recs:
        assert r["trigger"] != ""
        assert r["evidence"] != ""
        assert r["suggested_action"] != ""
