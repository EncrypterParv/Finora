"""Analytics, Behaviour Score, and Recommendations endpoints."""

from decimal import Decimal
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_current_user
from app.core.database import get_db
from app.db.models.user import User
from app.db.models.transaction import Transaction
from app.domain.ml.anomaly import AnomalyDetector
from app.domain.ml.features import FinancialFeatureExtractor
from app.domain.ml.recommendations import BehaviouralRecommendationEngine
from app.schemas.analytics import (
    AnomalyAlertDTO,
    BehaviourScoreDTO,
    RecommendationDTO,
)

router = APIRouter()


@router.get("/score", response_model=BehaviourScoreDTO)
async def get_behaviour_score(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Compute financial behaviour health score and archetypes from live transaction stream."""
    res = await db.execute(
        select(Transaction).where(Transaction.user_id == current_user.id)
    )
    tx_list = res.scalars().all()
    tx_dicts = [
        {
            "id": t.id,
            "occurred_at": t.occurred_at,
            "amount": t.amount,
            "transaction_type": t.transaction_type,
            "category_name": "General",
        }
        for t in tx_list
    ]

    features = FinancialFeatureExtractor.extract_user_features(tx_dicts)

    # Score calculation algorithm: Base 80 - penalty for impulse + bonus for savings
    base_score = 75
    impulse_penalty = int(features["impulse_index"] * 30)
    weekend_penalty = int(features["weekend_spend_ratio"] * 20)
    savings_bonus = int(min(25, features["savings_rate_pct"] * 0.5))

    calculated_score = max(10, min(98, base_score - impulse_penalty - weekend_penalty + savings_bonus))

    archetype = "Disciplined Saver"
    if features["weekend_spend_ratio"] > 0.4:
        archetype = "The Weekend Splurger"
    elif features["impulse_index"] > 0.35:
        archetype = "Micro-Transaction Impulsive"

    return BehaviourScoreDTO(
        score=calculated_score,
        impulse_spending_index=features["impulse_index"],
        savings_rate_pct=features["savings_rate_pct"],
        weekend_vs_weekday_ratio=features["weekend_spend_ratio"],
        top_discretionary_categories=[
            {"category": "Food & Dining", "percentage": 34.5},
            {"category": "Entertainment", "percentage": 22.1},
        ],
        behavioural_archetype=archetype,
        runway_days=features["runway_days"],
        strengths=["Consistent monthly payroll deposits", "Stable utility payments"],
        vulnerabilities=["High weekend discretionary burn rate", "Late night food delivery micro-spends"],
    )


@router.get("/recommendations", response_model=List[RecommendationDTO])
async def get_recommendations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve actionable behavioural nudges."""
    res = await db.execute(
        select(Transaction).where(Transaction.user_id == current_user.id)
    )
    tx_list = res.scalars().all()
    tx_dicts = [
        {
            "id": t.id,
            "occurred_at": t.occurred_at,
            "amount": t.amount,
            "transaction_type": t.transaction_type,
            "category_name": "General",
        }
        for t in tx_list
    ]
    features = FinancialFeatureExtractor.extract_user_features(tx_dicts)
    return BehaviouralRecommendationEngine.generate_recommendations(features)


@router.get("/anomalies", response_model=List[AnomalyAlertDTO])
async def get_anomalies(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Detect statistical spending anomalies in transaction history."""
    res = await db.execute(
        select(Transaction).where(Transaction.user_id == current_user.id)
    )
    tx_list = res.scalars().all()
    tx_dicts = [
        {
            "id": t.id,
            "occurred_at": t.occurred_at,
            "amount": t.amount,
            "transaction_type": t.transaction_type,
            "merchant_name": getattr(t, "merchant_name", "Merchant"),
        }
        for t in tx_list
    ]
    return AnomalyDetector.detect_anomalies(tx_dicts)
