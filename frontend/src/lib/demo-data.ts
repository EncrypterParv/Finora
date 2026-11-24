import type {
  HistoricalSamplingDTO,
  IntelligenceOverviewDTO,
  YearlyTrajectoryDTO,
} from "@/types/analytics";
import type { BudgetCreate, BudgetResponse } from "@/types/budget";
import type { GoalCreate, GoalResponse } from "@/types/goal";
import type { CalendarViewMode, CalendarViewResponse } from "@/types/calendar";
import type {
  CanonicalTransaction,
  TransactionDetail,
} from "@/types/transaction";

// Entirely synthetic, fixed-date preview. No real credentials or financial data.
export const DEMO_DATE = "2026-10-18";

export const demoAccounts = [
  {
    id: "acc-1",
    institution_name: "HDFC Bank",
    account_number_masked: "•••• 4821",
    account_type: "SAVINGS",
    currency: "INR",
    adapter_type: "SIMULATED",
    created_at: "2017-01-10T00:00:00Z",
  },
  {
    id: "acc-2",
    institution_name: "State Bank of India",
    account_number_masked: "•••• 9104",
    account_type: "CURRENT",
    currency: "INR",
    adapter_type: "SIMULATED",
    created_at: "2019-06-15T00:00:00Z",
  },
];
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
        category_color: t.transaction_type === "CREDIT" ? "#b94a00" : "#8a756c",
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


export function getDemoHistoricalInsights(horizon: "30d" | "1y" | "5y" | "10y" | "all" = "all"): HistoricalSamplingDTO {
  const is10y = horizon === "10y" || horizon === "all";
  const is5y = horizon === "5y";
  const is1y = horizon === "1y";

  const totalTransactions = is10y ? 4280 : is5y ? 2150 : is1y ? 490 : 42;
  const sampledDebits = Math.round(totalTransactions * 0.88);
  const sampledCredits = totalTransactions - sampledDebits;
  const activeMonths = is10y ? 120 : is5y ? 60 : is1y ? 12 : 1;

  const totalOutflow = is10y ? 3240000 : is5y ? 1680000 : is1y ? 342000 : 24076;
  const totalInflow = is10y ? 4850000 : is5y ? 2450000 : is1y ? 495000 : 38000;
  const netSavings = totalInflow - totalOutflow;
  const lifetimeSavingsRate = Number(((netSavings / totalInflow) * 100).toFixed(1));
  const avgMonthlySpend = Math.round(totalOutflow / activeMonths);
  const avgMonthlyInflow = Math.round(totalInflow / activeMonths);

  const startYear = is10y ? 2017 : is5y ? 2022 : is1y ? 2025 : 2026;
  const yearlyTrajectory: YearlyTrajectoryDTO[] = [];
  for (let yr = startYear; yr <= 2026; yr++) {
    const yrFactor = 1 + (yr - startYear) * 0.08;
    const spend = Math.round((totalOutflow / (2026 - startYear + 1)) * yrFactor);
    const inflow = Math.round((totalInflow / (2026 - startYear + 1)) * (yrFactor * 1.05));
    yearlyTrajectory.push({
      year: yr,
      total_spend: spend,
      total_inflow: inflow,
      net_savings: inflow - spend,
      savings_rate_pct: Number((((inflow - spend) / inflow) * 100).toFixed(1)),
    });
  }

  return {
    horizon,
    total_transactions: totalTransactions,
    sampled_debit_count: sampledDebits,
    sampled_credit_count: sampledCredits,
    date_range_start: `${startYear}-01-01`,
    date_range_end: "2026-11-24",
    history_span_days: activeMonths * 30,
    active_months_count: activeMonths,
    privacy_certificate: {
      policy_id: "KW-FIN-ZERO-LEAKAGE-2026.1",
      security_tier: "AIR_GAPPED_CONFIDENTIAL",
      air_gapped: true,
      cloud_ai_leakage_prevented: true,
      egress_allowed: false,
      model_architecture: "Deterministic Industrial Statistical & Non-Parametric Bootstrap (Non-LLM)",
      model_name: "Finora-Industrial-Local-Historical-v2.6",
      kiteworks_boundary_status: "ENFORCED_ZERO_TRUST",
      kiteworks_gateway_hook: "AVAILABLE_FOR_ENTERPRISE_ATTACH",
      data_retention: "IN_MEMORY_EPHEMERAL_ONLY",
      audit_hash: "8f7e2a4c9b1d3e5f0a2c4e6b",
      verified_at: new Date().toISOString(),
    },
    metrics: {
      total_inflow: totalInflow,
      total_outflow: totalOutflow,
      net_savings: netSavings,
      lifetime_savings_rate_pct: lifetimeSavingsRate,
      average_monthly_spend: avgMonthlySpend,
      average_monthly_inflow: avgMonthlyInflow,
      yoy_spend_growth_pct: 6.4,
      financial_resilience_score: 84,
    },
    bootstrap_sampling: {
      iterations: 1000,
      median_daily_spend: Math.round(avgMonthlySpend / 30),
      ci_lower_80: Math.round((avgMonthlySpend / 30) * 0.88),
      ci_upper_80: Math.round((avgMonthlySpend / 30) * 1.14),
      ci_lower_95: Math.round((avgMonthlySpend / 30) * 0.76),
      ci_upper_95: Math.round((avgMonthlySpend / 30) * 1.28),
      bootstrap_method: "Empirical Non-Parametric Resampling (1,000 Draws)",
    },
    yearly_trajectory: yearlyTrajectory,
    category_distribution: [
      { category: "Housing & Utilities", amount: Math.round(totalOutflow * 0.35), percentage: 35.0 },
      { category: "Groceries & Essentials", amount: Math.round(totalOutflow * 0.22), percentage: 22.0 },
      { category: "Food & Dining", amount: Math.round(totalOutflow * 0.16), percentage: 16.0 },
      { category: "Transportation", amount: Math.round(totalOutflow * 0.12), percentage: 12.0 },
      { category: "Travel & Leisure", amount: Math.round(totalOutflow * 0.09), percentage: 9.0 },
      { category: "Subscriptions & Personal", amount: Math.round(totalOutflow * 0.06), percentage: 6.0 },
    ],
    seasonality_index: {
      Jan: 0.92, Feb: 0.88, Mar: 0.95, Apr: 1.02,
      May: 1.15, Jun: 1.08, Jul: 0.98, Aug: 1.01,
      Sep: 1.04, Oct: 1.22, Nov: 1.18, Dec: 1.12,
    },
    forward_projection_12m: [
      { month_offset: 1, month_name: "Dec", projected_spend: Math.round(avgMonthlySpend * 1.12), lower_bound: Math.round(avgMonthlySpend * 0.95), upper_bound: Math.round(avgMonthlySpend * 1.28) },
      { month_offset: 2, month_name: "Jan", projected_spend: Math.round(avgMonthlySpend * 0.92), lower_bound: Math.round(avgMonthlySpend * 0.80), upper_bound: Math.round(avgMonthlySpend * 1.08) },
      { month_offset: 3, month_name: "Feb", projected_spend: Math.round(avgMonthlySpend * 0.89), lower_bound: Math.round(avgMonthlySpend * 0.77), upper_bound: Math.round(avgMonthlySpend * 1.04) },
      { month_offset: 4, month_name: "Mar", projected_spend: Math.round(avgMonthlySpend * 0.96), lower_bound: Math.round(avgMonthlySpend * 0.82), upper_bound: Math.round(avgMonthlySpend * 1.11) },
      { month_offset: 5, month_name: "Apr", projected_spend: Math.round(avgMonthlySpend * 1.03), lower_bound: Math.round(avgMonthlySpend * 0.88), upper_bound: Math.round(avgMonthlySpend * 1.19) },
      { month_offset: 6, month_name: "May", projected_spend: Math.round(avgMonthlySpend * 1.16), lower_bound: Math.round(avgMonthlySpend * 0.99), upper_bound: Math.round(avgMonthlySpend * 1.34) },
    ],
    model_metadata: {
      algorithm: "Empirical Bootstrap + Robust Median Absolute Deviation + LOESS Seasonality",
      non_llm: true,
      zero_cloud_leakage: true,
      execution_mode: "IN_MEMORY_AIR_GAPPED",
      sample_iterations: 1000,
    },
  };
}


export interface MonthlyFinancialRecord {
  monthKey: string; // "2017-01"
  monthLabel: string; // "Jan 2017"
  year: number;
  month: number;
  inflow: number; // Green (Credits)
  outflow: number; // Red (Debits / Expenses)
  net: number; // Blue (Retained)
  cumulativeBalance: number; // Total liquid portfolio / wealth reserve
  essentialSpend: number;
  discretionarySpend: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number; // Transaction count
  isBullish: boolean; // net > 0 (Green candle) vs net < 0 (Red candle)
}

// Pre-calculated continuous 10-year financial records (2017 to 2026 = 120 months)
export function getDemo10YearMonthlyRecords(): MonthlyFinancialRecord[] {
  const records: MonthlyFinancialRecord[] = [];
  const startYear = 2017;
  const endYear = 2026;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  let runningBalance = 45000;

  for (let yr = startYear; yr <= endYear; yr++) {
    const yearProgress = (yr - startYear) / (endYear - startYear); // 0.0 to 1.0
    // Base salary progression from ~₹32k/mo in 2017 to ~₹85k/mo in 2026
    const baseIncome = 32000 + yearProgress * 53000;
    // Base living expenses progression from ~₹20k/mo to ~₹52k/mo
    const baseSpend = 20000 + yearProgress * 32000;

    for (let m = 0; m < 12; m++) {
      // Don't generate past Nov 2026 if current year
      if (yr === 2026 && m > 10) break;

      const monthName = months[m];
      const monthNum = m + 1;
      const monthKey = `${yr}-${String(monthNum).padStart(2, "0")}`;
      const monthLabel = `${monthName} ${yr}`;

      // Seasonal modifiers
      let incomeMultiplier = 1.0;
      let spendMultiplier = 1.0;

      // October/November festivals / bonuses
      if (m === 9 || m === 10) {
        incomeMultiplier = 1.25;
        spendMultiplier = 1.35;
      }
      // March appraisal / year-end
      if (m === 2) {
        incomeMultiplier = 1.15;
      }
      // Summer travel (May/June)
      if (m === 4 || m === 5) {
        spendMultiplier = 1.20;
      }
      // Post-holiday dip (January)
      if (m === 0) {
        spendMultiplier = 0.88;
      }

      // Small pseudo-random variations based on month and year seed
      const pseudoNoise = Math.sin(yr * 12 + m * 7) * 0.08;
      const inflow = Math.round((baseIncome * incomeMultiplier * (1 + pseudoNoise)) / 100) * 100;
      const outflow = Math.round((baseSpend * spendMultiplier * (1 - pseudoNoise * 0.7)) / 100) * 100;

      const net = inflow - outflow;
      const open = runningBalance;
      runningBalance += net;
      const close = runningBalance;

      const high = Math.max(open, close) + Math.round(inflow * 0.15);
      const low = Math.min(open, close) - Math.round(outflow * 0.12);

      const essentialShare = 0.62 - yearProgress * 0.08;
      const essential = Math.round(outflow * essentialShare);
      const discretionary = outflow - essential;
      const txCount = Math.round(24 + yearProgress * 22 + Math.cos(m) * 5);

      records.push({
        monthKey,
        monthLabel,
        year: yr,
        month: monthNum,
        inflow,
        outflow,
        net,
        cumulativeBalance: runningBalance,
        essentialSpend: essential,
        discretionarySpend: discretionary,
        open,
        high,
        low,
        close,
        volume: txCount,
        isBullish: net >= 0,
      });
    }
  }

  return records;
}
