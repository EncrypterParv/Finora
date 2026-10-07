export interface BudgetCategory {
  id?: string;
  category_name: string;
  category_limit: number;
  spent_amount: number;
  color?: string;
}

export interface BudgetResponse {
  id: string;
  user_id: string;
  name: string;
  period: string;
  total_limit: number;
  total_spent: number;
  start_date: string;
  end_date: string;
  categories: BudgetCategory[];
  projected_burn_total?: number;
  projected_exhaustion_date?: string | null;
}

export interface BudgetCreate {
  name: string;
  period: string;
  total_limit: number;
  start_date: string;
  end_date: string;
}
