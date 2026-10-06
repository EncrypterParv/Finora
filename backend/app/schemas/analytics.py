"""Analytics, behavioural score, and ML output schemas."""

from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class BehaviourScoreDTO(BaseModel):
    score: int = Field(..., ge=0, le=100, description="Overall financial behaviour health score")
    impulse_spending_index: float  # 0.0 to 1.0
    savings_rate_pct: float
    weekend_vs_weekday_ratio: float
    top_discretionary_categories: List[Dict[str, Any]]
    behavioural_archetype: str  # e.g., "The Weekend Splurger", "Disciplined Saver", "Impulse Shopper"
    runway_days: int
    strengths: List[str]
    vulnerabilities: List[str]


class RecommendationDTO(BaseModel):
    id: str
    priority: str  # HIGH, MEDIUM, LOW
    title: str
    impact_amount: Optional[Decimal] = None
    rationale: str
    action_type: str  # e.g., "BUDGET_ADJUSTMENT", "SUBSCRIPTION_AUDIT", "SAVINGS_TRANSFER"


class AnomalyAlertDTO(BaseModel):
    transaction_id: str
    merchant_name: str
    amount: Decimal
    occurred_at: datetime
    confidence_score: float
    reason: str
