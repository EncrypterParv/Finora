import { CalendarViewResponse, CalendarViewMode } from "@/types/calendar";
import { CanonicalTransaction, TransactionDetail } from "@/types/transaction";
import { BudgetResponse, BudgetCreate } from "@/types/budget";
import { GoalResponse, GoalCreate } from "@/types/goal";
import {
  BehaviourScoreDTO,
  RecommendationDTO,
  AnomalyAlertDTO,
  IntelligenceOverviewDTO,
  ForecastDTO,
  BehaviourShiftDTO,
} from "@/types/analytics";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export async function fetchCalendarView(
  mode: CalendarViewMode = "month",
  year?: number,
  month?: number
): Promise<CalendarViewResponse> {
  const params = new URLSearchParams({ mode });
  if (year) params.append("year", year.toString());
  if (month) params.append("month", month.toString());

  const res = await fetch(`${API_BASE}/calendar/view?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch calendar view: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function fetchTransactions(
  limit: number = 50,
  offset: number = 0
): Promise<CanonicalTransaction[]> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });
  const res = await fetch(`${API_BASE}/transactions?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch transactions: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function fetchTransactionDetail(id: string): Promise<TransactionDetail> {
  const res = await fetch(`${API_BASE}/transactions/${id}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch transaction detail: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function fetchBudgets(): Promise<BudgetResponse[]> {
  const res = await fetch(`${API_BASE}/budgets`);
  if (!res.ok) {
    throw new Error(`Failed to fetch budgets: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function createBudget(data: BudgetCreate): Promise<BudgetResponse> {
  const res = await fetch(`${API_BASE}/budgets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(`Failed to create budget: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function fetchGoals(): Promise<GoalResponse[]> {
  const res = await fetch(`${API_BASE}/goals`);
  if (!res.ok) {
    throw new Error(`Failed to fetch goals: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function createGoal(data: GoalCreate): Promise<GoalResponse> {
  const res = await fetch(`${API_BASE}/goals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(`Failed to create goal: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function fetchIntelligenceOverview(): Promise<IntelligenceOverviewDTO> {
  const res = await fetch(`${API_BASE}/analytics/overview`);
  if (!res.ok) {
    throw new Error(`Failed to fetch intelligence overview: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function fetchBehaviourScore(): Promise<BehaviourScoreDTO> {
  const res = await fetch(`${API_BASE}/analytics/score`);
  if (!res.ok) {
    throw new Error(`Failed to fetch behavioural score: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function fetchForecast(): Promise<ForecastDTO> {
  const res = await fetch(`${API_BASE}/analytics/forecast`);
  if (!res.ok) {
    throw new Error(`Failed to fetch spending forecast: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function fetchBehaviouralChanges(): Promise<BehaviourShiftDTO[]> {
  const res = await fetch(`${API_BASE}/analytics/changes`);
  if (!res.ok) {
    throw new Error(`Failed to fetch behavioural changes: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function fetchRecommendations(): Promise<RecommendationDTO[]> {
  const res = await fetch(`${API_BASE}/analytics/recommendations`);
  if (!res.ok) {
    throw new Error(`Failed to fetch recommendations: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function fetchAnomalies(): Promise<AnomalyAlertDTO[]> {
  const res = await fetch(`${API_BASE}/analytics/anomalies`);
  if (!res.ok) {
    throw new Error(`Failed to fetch anomalies: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function triggerBankSync(
  accountId: string = "acc-1",
  institutionId: string = "hsbc_demo"
): Promise<{ transactions_added: number; transactions_updated: number; new_balance: number }> {
  const res = await fetch(`${API_BASE}/bank/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ account_id: accountId, institution_id: institutionId }),
  });
  if (!res.ok) {
    throw new Error(`Failed to sync bank: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function uploadStatement(
  accountId: string,
  file: File
): Promise<{ filename: string; transactions_parsed: number; transactions_added: number; duplicates_skipped: number }> {
  const formData = new FormData();
  formData.append("account_id", accountId);
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/statements/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    throw new Error(`Failed to upload statement: ${res.status} ${res.statusText}`);
  }
  return res.json();
}
