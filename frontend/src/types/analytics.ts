export interface BehaviourScoreDTO {
  score: number;
  impulse_spending_index: number;
  savings_rate_pct: number;
  weekend_vs_weekday_ratio: number;
  top_discretionary_categories: { category: string; percentage: number }[];
  behavioural_archetype: string;
  runway_days: number;
  strengths: string[];
  vulnerabilities: string[];
}

export interface RecommendationDTO {
  id: string;
  title: string;
  nudge_type: string;
  description: string;
  potential_monthly_savings: number;
  priority: string;
  impact_summary?: string;
  action_label?: string;
}

export interface AnomalyAlertDTO {
  id: string;
  merchant: string;
  amount: number;
  occurred_at: string;
  confidence: number;
  reason: string;
}
