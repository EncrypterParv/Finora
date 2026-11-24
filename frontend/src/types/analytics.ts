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


export interface BootstrapSamplingDTO {
  iterations: number;
  median_daily_spend: number;
  ci_lower_80: number;
  ci_upper_80: number;
  ci_lower_95: number;
  ci_upper_95: number;
  bootstrap_method?: string;
}

export interface YearlyTrajectoryDTO {
  year: number;
  total_spend: number;
  total_inflow: number;
  net_savings: number;
  savings_rate_pct: number;
}

export interface HistoricalMetricsDTO {
  total_inflow: number;
  total_outflow: number;
  net_savings: number;
  lifetime_savings_rate_pct: number;
  average_monthly_spend: number;
  average_monthly_inflow: number;
  yoy_spend_growth_pct: number;
  financial_resilience_score: number;
}

export interface PrivacyCertificateDTO {
  policy_id: string;
  security_tier: string;
  air_gapped: boolean;
  cloud_ai_leakage_prevented: boolean;
  egress_allowed: boolean;
  model_architecture: string;
  model_name: string;
  kiteworks_boundary_status: string;
  kiteworks_gateway_hook: string;
  data_retention: string;
  audit_hash: string;
  verified_at: string;
}

export interface HistoricalSamplingDTO {
  horizon: "30d" | "1y" | "5y" | "10y" | "all";
  total_transactions: number;
  sampled_debit_count: number;
  sampled_credit_count: number;
  date_range_start: string;
  date_range_end: string;
  history_span_days: number;
  active_months_count: number;
  privacy_certificate: PrivacyCertificateDTO;
  metrics: HistoricalMetricsDTO;
  bootstrap_sampling: BootstrapSamplingDTO;
  yearly_trajectory: YearlyTrajectoryDTO[];
  category_distribution: { category: string; amount: number; percentage: number }[];
  seasonality_index: Record<string, number>;
  forward_projection_12m: {
    month_offset: number;
    month_name: string;
    projected_spend: number;
    lower_bound: number;
    upper_bound: number;
  }[];
  model_metadata: {
    algorithm: string;
    non_llm: boolean;
    zero_cloud_leakage: boolean;
    execution_mode: string;
    sample_iterations?: number;
  };
}
