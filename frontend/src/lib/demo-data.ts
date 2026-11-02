import type { IntelligenceOverviewDTO } from "@/types/analytics";
import type { BudgetCreate, BudgetResponse } from "@/types/budget";
import type { GoalCreate, GoalResponse } from "@/types/goal";
import type { CalendarViewMode, CalendarViewResponse } from "@/types/calendar";
import type {
  CanonicalTransaction,
  TransactionDetail,
} from "@/types/transaction";

// Entirely synthetic, fixed-date preview. No real credentials or financial data.
export const DEMO_DATE = "2026-10-18";
const merchants = [
  ["Blue Tokai", "Food & Dining", 320],
  ["Namma Metro", "Transportation", 120],
  ["Fresh produce", "Groceries", 1840],
  ["Monthly rent", "Bills & Utilities", 15000],
  ["Swiggy", "Food & Dining", 650],
  ["Bookshop", "Shopping", 1250],
  ["Cinema", "Entertainment", 680],
  ["Electricity", "Bills & Utilities", 1890],
  ["Weekend lunch", "Food & Dining", 2400],
  ["Campus canteen", "Food & Dining", 180],
  ["Local transport", "Transportation", 320],
  ["Groceries", "Groceries", 2200],
  ["Coffee with friends", "Food & Dining", 600],
  ["Phone plan", "Bills & Utilities", 1000],
] as const;
export const demoTransactions: CanonicalTransaction[] = merchants.map(
  ([merchant, category, amount], i) => ({
    id: `demo-tx-${i + 1}`,
    user_id: "demo-user",
    account_id: "acc-1",
    occurred_at: `2026-10-${String(i + 3).padStart(2, "0")}T${i % 2 ? "18:30" : "10:15"}:00+05:30`,
    amount,
    currency: "INR",
    transaction_type: "DEBIT",
    raw_description: `SAMPLE / ${merchant}`,
    merchant_name: merchant,
    category_name: category,
    reference_id: `SAMPLE-${i + 1}`,
    source: "MANUAL",
    created_at: "2026-10-18T00:00:00Z",
  }),
);
demoTransactions.unshift({
  ...demoTransactions[0],
  id: "demo-income",
  occurred_at: "2026-10-01T09:00:00+05:30",
  amount: 75000,
  transaction_type: "CREDIT",
  merchant_name: "Sample monthly income",
  category_name: "Income",
  raw_description: "SYNTHETIC MONTHLY INCOME",
  reference_id: "SAMPLE-INCOME",
});
const spent = demoTransactions
  .filter((t) => t.transaction_type === "DEBIT")
  .reduce((sum, t) => sum + t.amount, 0);
const sufficiency = {
  status: "PARTIAL" as const,
  history_span_days: 18,
  total_transaction_count: demoTransactions.length,
  is_sufficient_for_basic: true,
  is_sufficient_for_advanced: false,
  guidance_message:
    "This is a fixed-date sample, not a live financial assessment.",
};
export const demoOverview: IntelligenceOverviewDTO = {
  liquid_balance: 148500,
  monthly_inflow: 75000,
  month_to_date_spend: spent,
  effective_savings_rate: Math.round(((75000 - spent) / 75000) * 100),
  runway_days: Math.floor(148500 / 1500),
  behaviour_profile: {
    score: 78,
    impulse_spending_index: 0.18,
    savings_rate_pct: Math.round(((75000 - spent) / 75000) * 100),
    weekend_vs_weekday_ratio: 0.38,
    weekend_velocity_multiplier: 1.8,
    discretionary_ratio: 0.35,
    essential_ratio: 0.65,
    category_concentration_hhi: 0.24,
    top_discretionary_categories: [
      { category: "Food & Dining", percentage: 58, amount: 4150 },
      { category: "Shopping", percentage: 27, amount: 1250 },
    ],
    behavioural_archetype: "Finding a steady pace",
    runway_days: 99,
    strengths: [
      "Sample monthly income exceeds recorded spending",
      "An emergency reserve provides a buffer",
    ],
    vulnerabilities: [
      "Weekend spending can change the monthly pace",
      "This short sample cannot establish long-term habits",
    ],
    data_sufficiency: sufficiency,
  },
  forecast: {
    expected_total_burn: spent + 1500 * 13,
    lower_bound_80: spent + 1300 * 13,
    upper_bound_80: spent + 1700 * 13,
    daily_projected_rate: 1500,
    remaining_days_in_month: 13,
    projected_remaining_spend: 19500,
    budget_exhaustion_date: null,
    budget_risk_level: "SAFE",
    status_summary:
      "Illustrative projection: ₹1,500/day for the remaining 13 days, within a ₹50,000 sample budget.",
    methodology: "Synthetic scenario, not a validated prediction",
    model_version: "frontend-demo",
    confidence_level_pct: 80,
    forecast_generated_at: "2026-10-18T10:00:00Z",
  },
  observed_shifts: [
    {
      metric_name: "Weekend spending",
      dimension: "spending",
      previous_baseline: 1000,
      current_value: 1240,
      percentage_change: 24,
      direction: "INCREASING",
      impact_rating: "CONCERNING",
      summary:
        "Illustrative comparison: weekend daily spending rose from ₹1,000 to ₹1,240. This comparison is sample content.",
    },
  ],
  recommendations: [
    {
      id: "demo-rec-1",
      priority: "MEDIUM",
      title: "Give the weekend a little structure",
      trigger: "Sample weekend pace is above the comparison baseline",
      evidence:
        "Illustrative weekend spend: ₹1,240/day versus a ₹1,000/day baseline.",
      financial_impact_monthly: 1920,
      suggested_action:
        "Try a ₹1,000 daily weekend limit and review your calendar.",
      action_type: "WEEKEND_PACING",
      action_label: "Review your calendar",
      confidence_score: 0.7,
      relevance_window_days: 7,
      created_at: "2026-10-18T00:00:00Z",
    },
    {
      id: "demo-rec-2",
      priority: "LOW",
      title: "Give your savings a destination",
      trigger: "Sample income exceeds current expenses",
      evidence: "A separate emergency fund makes your savings target visible.",
      financial_impact_monthly: 5000,
      suggested_action:
        "Explore a ₹5,000 monthly contribution in the goal simulator.",
      action_type: "SAVINGS_TRANSFER",
      action_label: "Explore savings goals",
      confidence_score: 0.7,
      relevance_window_days: 30,
      created_at: "2026-10-18T00:00:00Z",
    },
  ],
  top_anomalies: [],
  data_sufficiency: sufficiency,
};
const defaultBudget: BudgetResponse = {
  id: "demo-budget",
  user_id: "demo-user",
  name: "Everyday spending",
  period: "MONTHLY",
  total_limit: 50000,
  total_spent: spent,
  start_date: "2026-10-01",
  end_date: "2026-10-31",
  projected_burn_total: demoOverview.forecast.expected_total_burn,
  categories: [],
};
const defaultGoal: GoalResponse = {
  id: "demo-goal",
  user_id: "demo-user",
  title: "Emergency fund",
  goal_type: "EMERGENCY_FUND",
  target_amount: 300000,
  current_saved: 150000,
  monthly_contribution: 5000,
  target_date: "2029-04-18",
  expected_annual_return_pct: 0,
  status: "ACTIVE",
  progress_percentage: 50,
  projected_completion_date: "2029-04-18",
  is_on_track: true,
  scenarios: [],
  milestones: [
    { title: "First ₹1,50,000", target_amount: 150000, is_completed: true },
    { title: "Full safety net", target_amount: 300000, is_completed: false },
  ],
};
function readSession<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(`finora.demo.${key}`);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
export function demoBudgets() {
  return readSession<BudgetResponse[]>("budgets", [defaultBudget]);
}
export function demoGoals() {
  return readSession<GoalResponse[]>("goals", [defaultGoal]);
}
export function demoCreateBudget(data: BudgetCreate): BudgetResponse {
  const budget = { ...defaultBudget, ...data, id: `demo-budget-${Date.now()}` };
  sessionStorage.setItem(
    "finora.demo.budgets",
    JSON.stringify([budget, ...demoBudgets()]),
  );
  return budget;
}
export function demoCreateGoal(data: GoalCreate): GoalResponse {
  const goal = {
    ...defaultGoal,
    ...data,
    id: `demo-goal-${Date.now()}`,
    progress_percentage:
      data.target_amount > 0
        ? (data.current_saved / data.target_amount) * 100
        : 0,
    milestones: [],
    scenarios: [],
  };
  sessionStorage.setItem(
    "finora.demo.goals",
    JSON.stringify([goal, ...demoGoals()]),
  );
  return goal;
}
export function demoTransactionDetail(id: string): TransactionDetail {
  const transaction = demoTransactions.find((t) => t.id === id);
  if (!transaction) throw new Error("Sample transaction not found.");
  return {
    ...transaction,
    monthly_budget_allocated: 50000,
    monthly_budget_spent: spent,
    monthly_budget_utilization_pct: spent / 500,
    projected_monthly_spend: demoOverview.forecast.expected_total_burn,
    recommended_daily_spend: 1500,
    is_anomaly: false,
  };
}
export function demoCalendar(
  mode: CalendarViewMode,
  year = 2026,
  month = 10,
): CalendarViewResponse {
  const count = new Date(year, month, 0).getDate();
  const days = Array.from({ length: count }, (_, i) => {
    const date = `${year}-${String(month).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
    const transactions = demoTransactions.filter((t) =>
      t.occurred_at.startsWith(date),
    );
    const debit = transactions
      .filter((t) => t.transaction_type === "DEBIT")
      .reduce((sum, t) => sum + t.amount, 0);
    const credit = transactions
      .filter((t) => t.transaction_type === "CREDIT")
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      date,
      date_label: new Date(year, month - 1, i + 1).toLocaleDateString("en-IN", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      total_debit: debit,
      total_credit: credit,
      net_flow: credit - debit,
      transaction_count: transactions.length,
      spending_intensity: Math.min(1, debit / 2500),
      is_projected: false,
      events: transactions.map((t) => ({
        id: t.id,
        time_label: t.occurred_at.slice(11, 16),
        occurred_at: t.occurred_at,
        amount: t.amount,
        currency: t.currency,
        transaction_type: t.transaction_type,
        merchant_name: t.merchant_name,
        category_name: t.category_name,
        category_color: t.transaction_type === "CREDIT" ? "#53705a" : "#7d8472",
        category_icon: "bank",
        intensity_score: Math.min(1, t.amount / 2500),
      })),
    };
  });
  const debit = days.reduce((sum, d) => sum + d.total_debit, 0);
  return {
    mode,
    start_date: days[0].date,
    end_date: days[count - 1].date,
    total_period_debit: debit,
    total_period_credit: days.reduce((sum, d) => sum + d.total_credit, 0),
    average_daily_spend: debit / count,
    days,
    predicted_month_end_burn:
      year === 2026 && month === 10
        ? demoOverview.forecast.expected_total_burn
        : undefined,
  };
}
