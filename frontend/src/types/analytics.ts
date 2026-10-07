export interface DataSufficiencyDTO {
  status: "SUFFICIENT" | "PARTIAL" | "INSUFFICIENT";
  history_span_days: number;
  total_transaction_count: number;
  is_sufficient_for_basic: boolean;
  is_sufficient_for_advanced: boolean;
  guidance_message?: string | null;
}

export interface ForecastDTO {
  expected_total_burn: number;
  lower_bound_80: number;
  upper_bound_80: number;
  daily_projected_rate: number;
  remaining_days_in_month: number;
  projected_remaining_spend: number;
  budget_exhaustion_date?: string | null;
  budget_risk_level: "SAFE" | "MODERATE_RISK" | "HIGH_RISK" | "CRITICAL_IMMINENT" | "EXHAUSTED";
  status_summary: string;
  methodology: string;
  model_version: string;
  confidence_level_pct: number;
  forecast_generated_at: string;
}

export interface BehaviourShiftDTO {
  metric_name: string;
  dimension: string;
  previous_baseline: number;
  current_value: number;
  percentage_change: number;
  direction: "INCREASING" | "DECREASING" | "STABLE";
  impact_rating: "POSITIVE" | "NEUTRAL" | "CONCERNING";
  summary: string;
}

export interface BehaviourScoreDTO {
  score: number;
  impulse_spending_index: number;
  savings_rate_pct: number;
  weekend_vs_weekday_ratio: number;
  weekend_velocity_multiplier: number;
  discretionary_ratio: number;
  essential_ratio: number;
  category_concentration_hhi: number;
  top_discretionary_categories: { category: string; percentage: number; amount?: number }[];
  behavioural_archetype: string;
  runway_days: number;
  strengths: string[];
  vulnerabilities: string[];
  data_sufficiency: DataSufficiencyDTO;
}

export interface RecommendationDTO {
  id: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  title: string;
  trigger: string;
  evidence: string;
  financial_impact_monthly: number;
  suggested_action: string;
  action_type: string;
  action_label: string;
  confidence_score: number;
  relevance_window_days: number;
  created_at: string;
}

export interface AnomalyAlertDTO {
  transaction_id: string;
  merchant_name: string;
  amount: number;
  occurred_at: string;
  confidence_score: number;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  anomaly_type: string;
  reason: string;
  action_prompt: string;
}

export interface IntelligenceOverviewDTO {
  liquid_balance: number;
  monthly_inflow: number;
  month_to_date_spend: number;
  effective_savings_rate: number;
  runway_days: number;
  behaviour_profile: BehaviourScoreDTO;
  forecast: ForecastDTO;
  observed_shifts: BehaviourShiftDTO[];
  recommendations: RecommendationDTO[];
  top_anomalies: AnomalyAlertDTO[];
  data_sufficiency: DataSufficiencyDTO;
}
