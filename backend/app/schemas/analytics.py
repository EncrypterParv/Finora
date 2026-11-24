"""Analytics, Behavioural Intelligence, Forecasting, and Anomaly schemas."""

from datetime import date, datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class DataSufficiencyDTO(BaseModel):
    status: str = Field(..., description="SUFFICIENT | PARTIAL | INSUFFICIENT")
    history_span_days: int
    total_transaction_count: int
    is_sufficient_for_basic: bool
    is_sufficient_for_advanced: bool
    guidance_message: Optional[str] = None


class ForecastDTO(BaseModel):
    expected_total_burn: Decimal
    lower_bound_80: Decimal
    upper_bound_80: Decimal
    daily_projected_rate: Decimal
    remaining_days_in_month: int
    projected_remaining_spend: Decimal
    budget_exhaustion_date: Optional[date] = None
    budget_risk_level: str = "SAFE"  # SAFE | MODERATE_RISK | HIGH_RISK | CRITICAL_IMMINENT | EXHAUSTED
    status_summary: str
    methodology: str
    model_version: str
    confidence_level_pct: int = 80
    forecast_generated_at: str


class BehaviourShiftDTO(BaseModel):
    metric_name: str
    dimension: str
    previous_baseline: Decimal
    current_value: Decimal
    percentage_change: float
    direction: str  # INCREASING | DECREASING | STABLE
    impact_rating: str  # POSITIVE | NEUTRAL | CONCERNING
    summary: str


class BehaviourScoreDTO(BaseModel):
    score: int = Field(..., ge=0, le=100, description="Overall financial health score (0-100)")
    impulse_spending_index: float  # 0.0 to 1.0
    savings_rate_pct: float
    weekend_vs_weekday_ratio: float
    weekend_velocity_multiplier: float
    discretionary_ratio: float
    essential_ratio: float
    category_concentration_hhi: float
    top_discretionary_categories: List[Dict[str, Any]]
    behavioural_archetype: str
    runway_days: int
    strengths: List[str]
    vulnerabilities: List[str]
    data_sufficiency: DataSufficiencyDTO


class RecommendationDTO(BaseModel):
    id: str
    priority: str  # HIGH | MEDIUM | LOW
    title: str
    trigger: str
    evidence: str
    financial_impact_monthly: Decimal
    suggested_action: str
    action_type: str
    action_label: str
    confidence_score: float
    relevance_window_days: int
    created_at: str


class AnomalyAlertDTO(BaseModel):
    transaction_id: str
    merchant_name: str
    amount: Decimal
    occurred_at: datetime
    confidence_score: float
    severity: str  # CRITICAL | HIGH | MEDIUM | LOW
    anomaly_type: str
    reason: str
    action_prompt: str


class IntelligenceOverviewDTO(BaseModel):
    liquid_balance: Decimal
    monthly_inflow: Decimal
    month_to_date_spend: Decimal
    effective_savings_rate: float
    runway_days: int
    behaviour_profile: BehaviourScoreDTO
    forecast: ForecastDTO
    observed_shifts: List[BehaviourShiftDTO]
    recommendations: List[RecommendationDTO]
    top_anomalies: List[AnomalyAlertDTO]
    data_sufficiency: DataSufficiencyDTO


class BootstrapSamplingDTO(BaseModel):
    iterations: int
    median_daily_spend: Decimal
    ci_lower_80: Decimal
    ci_upper_80: Decimal
    ci_lower_95: Decimal
    ci_upper_95: Decimal
    bootstrap_method: Optional[str] = None


class YearlyTrajectoryDTO(BaseModel):
    year: int
    total_spend: Decimal
    total_inflow: Decimal
    net_savings: Decimal
    savings_rate_pct: float


class HistoricalMetricsDTO(BaseModel):
    total_inflow: Decimal
    total_outflow: Decimal
    net_savings: Decimal
    lifetime_savings_rate_pct: float
    average_monthly_spend: Decimal
    average_monthly_inflow: Decimal
    yoy_spend_growth_pct: float
    financial_resilience_score: int


class HistoricalSamplingDTO(BaseModel):
    horizon: str
    total_transactions: int
    sampled_debit_count: int
    sampled_credit_count: int
    date_range_start: str
    date_range_end: str
    history_span_days: int
    active_months_count: int
    privacy_certificate: Dict[str, Any]
    metrics: HistoricalMetricsDTO
    bootstrap_sampling: BootstrapSamplingDTO
    yearly_trajectory: List[YearlyTrajectoryDTO]
    category_distribution: List[Dict[str, Any]]
    seasonality_index: Dict[str, float]
    forward_projection_12m: List[Dict[str, Any]]
    model_metadata: Dict[str, Any]
