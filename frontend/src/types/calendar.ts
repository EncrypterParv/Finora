export type CalendarViewMode = 'day' | 'week' | 'month';

export interface CalendarEventBlock {
  id: string;
  time_label: string; // "14:32"
  occurred_at: string;
  amount: number;
  currency: string;
  transaction_type: 'DEBIT' | 'CREDIT' | 'TRANSFER';
  merchant_name: string;
  category_name: string;
  category_color: string;
  category_icon: string;
  intensity_score: number; // 0.0 to 1.0
}

export interface CalendarDaySummary {
  date: string; // YYYY-MM-DD
  date_label: string; // "Mon, Oct 7"
  total_debit: number;
  total_credit: number;
  net_flow: number;
  transaction_count: number;
  spending_intensity: number; // 0.0 to 1.0
  is_projected: boolean;
  projected_debit?: number;
  events: CalendarEventBlock[];
}

export interface CalendarViewResponse {
  mode: CalendarViewMode;
  start_date: string;
  end_date: string;
  total_period_debit: number;
  total_period_credit: number;
  average_daily_spend: number;
  days: CalendarDaySummary[];
  predicted_month_end_burn?: number;
}
