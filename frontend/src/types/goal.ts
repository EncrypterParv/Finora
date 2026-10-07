export interface GoalMilestone {
  title: string;
  target_amount: number;
  is_completed: boolean;
}

export interface GoalScenario {
  monthly_contribution_delta: number;
  new_monthly_contribution: number;
  projected_completion_date: string;
  months_saved: number;
}

export interface GoalResponse {
  id: string;
  user_id: string;
  title: string;
  goal_type: string;
  target_amount: number;
  current_saved: number;
  monthly_contribution: number;
  target_date: string;
  expected_annual_return_pct: number;
  status: string;
  progress_percentage: number;
  projected_completion_date?: string | null;
  is_on_track: boolean;
  scenarios: GoalScenario[];
  milestones: GoalMilestone[];
}

export interface GoalCreate {
  title: string;
  goal_type?: string;
  target_amount: number;
  current_saved: number;
  monthly_contribution: number;
  target_date: string;
  expected_annual_return_pct?: number;
}
