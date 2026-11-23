import { isDemoSession } from "./demo-session";
import { createClient as createSupabaseClient } from "./supabase/client";
import {
  demoOverview,
  demoTransactions,
  demoBudgets,
  demoGoals,
  demoCreateBudget,
  demoCreateGoal,
  demoCalendar,
  demoTransactionDetail,
} from "./demo-data";
import { CalendarViewResponse, CalendarViewMode } from "@/types/calendar";
import { CanonicalTransaction, TransactionDetail, TransactionType } from "@/types/transaction";
import { BudgetResponse, BudgetCreate, BudgetUpdate } from "@/types/budget";
import { GoalResponse, GoalCreate, GoalUpdate } from "@/types/goal";
import {
  BehaviourScoreDTO,
  RecommendationDTO,
  AnomalyAlertDTO,
  IntelligenceOverviewDTO,
  ForecastDTO,
  BehaviourShiftDTO,
} from "@/types/analytics";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "/api/v1";

// Short-lived, browser-memory-only cache for read-only API responses. Requests
// are partitioned by the authenticated Supabase user and every mutation
// invalidates that user's entries before it is sent.
const API_CACHE_TTL_MS = 30_000;
const API_CACHE_MAX_ENTRIES = 50;
type CachedApiResponse = {
  body: string;
  status: number;
  statusText: string;
  headers: [string, string][];
  expiresAt: number;
};
const apiResponseCache = new Map<string, CachedApiResponse>();
const apiCacheGenerations = new Map<string, number>();
let apiCacheEpoch = 0;

export function clearApiResponseCache(userId?: string) {
  if (!userId) {
    apiCacheEpoch += 1;
    apiResponseCache.clear();
    apiCacheGenerations.clear();
    return;
  }
  apiCacheGenerations.set(userId, (apiCacheGenerations.get(userId) ?? 0) + 1);
  for (const key of apiResponseCache.keys()) {
    if (key.startsWith(`${userId}:`)) apiResponseCache.delete(key);
  }
}

export type StatementSourceFormat = "csv" | "pdf" | "image";

export interface StatementDraftTransaction {
  account_id: string;
  occurred_at: string;
  amount: number;
  currency: string;
  transaction_type: "DEBIT" | "CREDIT" | "TRANSFER";
  raw_description: string;
  merchant_name: string;
  category_name: string;
  balance_before?: number | null;
  balance_after?: number | null;
  reference_id: string;
  source: "CSV" | "PDF" | "IMAGE";
  metadata?: Record<string, unknown>;
}

export interface BankAccountSummary {
  id: string;
  institution_name: string;
  account_number_masked: string;
  account_type: string;
  currency: string;
  adapter_type?: string;
  created_at?: string;
}

export type AccountTypeOption = "SAVINGS" | "CURRENT" | "CREDIT";

// Error thrown for a failed API call; keeps the HTTP status so screens can react (e.g. 409 on delete).
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export interface StatementPreview {
  format: StatementSourceFormat;
  needs_review: boolean;
  warnings: string[];
  transactions: StatementDraftTransaction[];
}

// Turns a FastAPI error body into a readable message: a plain `detail` string, or the first
// validation problem when `detail` is a list (422), e.g. "amount: Input should be greater than 0".
async function responseError(response: Response, fallback: string): Promise<ApiError> {
  try {
    const payload = (await response.json()) as { detail?: unknown };
    if (typeof payload.detail === "string") return new ApiError(payload.detail, response.status);
    if (Array.isArray(payload.detail) && payload.detail.length > 0) {
      const first = payload.detail[0] as { msg?: unknown; loc?: unknown };
      if (typeof first?.msg === "string") {
        const message = first.msg.replace(/^Value error, /, "");
        const field = Array.isArray(first.loc) ? String(first.loc[first.loc.length - 1] ?? "") : "";
        const label = field && field !== "body" ? `${field.replace(/_/g, " ")}: ` : "";
        return new ApiError(`${label}${message}`, response.status);
      }
    }
  } catch {
    // Return the stable fallback if the API response is not JSON.
  }
  return new ApiError(fallback, response.status);
}

async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;

  const method = (init.method ?? "GET").toUpperCase();
  const userId = data.session?.user.id;
  const headers = new Headers(init.headers);
  if (data.session?.access_token) {
    headers.set("Authorization", `Bearer ${data.session.access_token}`);
  }

  const requestUrl = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  const cacheKey = userId ? `${userId}:${requestUrl}` : "";
  const requestEpoch = apiCacheEpoch;
  const requestGeneration = userId ? apiCacheGenerations.get(userId) ?? 0 : 0;
  if (method === "GET" && cacheKey) {
    const cached = apiResponseCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      // Refresh insertion order so frequently revisited screens stay in cache.
      apiResponseCache.delete(cacheKey);
      apiResponseCache.set(cacheKey, cached);
      return new Response(cached.body, {
        status: cached.status,
        statusText: cached.statusText,
        headers: cached.headers,
      });
    }
    if (cached) apiResponseCache.delete(cacheKey);
  } else if (userId && method !== "GET") {
    clearApiResponseCache(userId);
  }

  const response = await fetch(input, { ...init, headers });
  if (method !== "GET" && userId) clearApiResponseCache(userId);
  if (method === "GET" && cacheKey && response.ok && requestEpoch === apiCacheEpoch && requestGeneration === (apiCacheGenerations.get(userId!) ?? 0)) {
    const body = await response.clone().text();
    const now = Date.now();
    for (const [key, value] of apiResponseCache) {
      if (value.expiresAt <= now) apiResponseCache.delete(key);
    }
    while (apiResponseCache.size >= API_CACHE_MAX_ENTRIES) {
      const oldestKey = apiResponseCache.keys().next().value;
      if (oldestKey === undefined) break;
      apiResponseCache.delete(oldestKey);
    }
    const cachedHeaders = new Headers();
    for (const name of ["content-type", "x-total-count"]) {
      const value = response.headers.get(name);
      if (value !== null) cachedHeaders.set(name, value);
    }
    apiResponseCache.set(cacheKey, {
      body,
      status: response.status,
      statusText: response.statusText,
      headers: Array.from(cachedHeaders.entries()),
      expiresAt: now + API_CACHE_TTL_MS,
    });
  }
  return response;
}

// `date` (yyyy-mm-dd) picks which week or day to show; month views use year/month.
export async function fetchCalendarView(
  mode: CalendarViewMode = "month",
  year?: number,
  month?: number,
  date?: string,
): Promise<CalendarViewResponse> {
  if (isDemoSession()) return demoCalendar(mode, year, month);
  const params = new URLSearchParams({ mode });
  if (year) params.append("year", year.toString());
  if (month) params.append("month", month.toString());
  if (date) params.append("date", date);

  const res = await apiFetch(`${API_BASE}/calendar/view?${params.toString()}`);
  if (!res.ok) throw await responseError(res, "Could not load your calendar.");
  return res.json();
}

export async function fetchTransactions(
  limit: number = 50,
  offset: number = 0,
): Promise<CanonicalTransaction[]> {
  if (isDemoSession())
    return [...demoTransactions]
      .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))
      .slice(offset, offset + limit);
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });
  const res = await apiFetch(`${API_BASE}/transactions?${params.toString()}`);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch transactions: ${res.status} ${res.statusText}`,
    );
  }
  return res.json();
}

export async function fetchUserTransactions(
  limit: number = 200,
  offset: number = 0,
): Promise<CanonicalTransaction[]> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });
  const response = await apiFetch(`${API_BASE}/transactions?${params.toString()}`);
  if (!response.ok) throw await responseError(response, "Could not load your transactions.");
  return response.json();
}

export interface TransactionFilters {
  q?: string;
  transaction_type?: TransactionType;
  account_id?: string;
  start_date?: string;
  end_date?: string;
  min_amount?: number;
  max_amount?: number;
}

// One page of filtered transactions plus the total match count from the X-Total-Count header.
export async function fetchTransactionPage(
  filters: TransactionFilters,
  limit: number = 25,
  offset: number = 0,
): Promise<{ items: CanonicalTransaction[]; total: number }> {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") params.append(key, String(value));
  }
  const response = await apiFetch(`${API_BASE}/transactions?${params.toString()}`);
  if (!response.ok) throw await responseError(response, "Could not load your transactions.");
  const items = (await response.json()) as CanonicalTransaction[];
  const header = response.headers.get("X-Total-Count");
  const total = header !== null && Number.isFinite(Number(header)) ? Number(header) : offset + items.length;
  return { items, total };
}

// Records a manual transaction (e.g. cash spending). It does not change the account balance.
export async function createManualTransaction(input: {
  account_id: string;
  occurred_at: string;
  amount: number;
  transaction_type: "DEBIT" | "CREDIT";
  description: string;
}): Promise<CanonicalTransaction> {
  const response = await apiFetch(`${API_BASE}/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw await responseError(response, "Could not save this transaction.");
  return response.json();
}

export async function deleteTransaction(id: string): Promise<void> {
  const response = await apiFetch(`${API_BASE}/transactions/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!response.ok) throw await responseError(response, "Could not delete this transaction.");
}

export async function fetchTransactionDetail(
  id: string,
): Promise<TransactionDetail> {
  if (isDemoSession()) return demoTransactionDetail(id);
  const res = await apiFetch(`${API_BASE}/transactions/${id}`);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch transaction detail: ${res.status} ${res.statusText}`,
    );
  }
  return res.json();
}

export async function fetchBudgets(): Promise<BudgetResponse[]> {
  if (isDemoSession()) return demoBudgets();
  const res = await apiFetch(`${API_BASE}/budgets`);
  if (!res.ok) throw await responseError(res, "Could not load your budgets.");
  return res.json();
}

export async function createBudget(
  data: BudgetCreate,
): Promise<BudgetResponse> {
  if (isDemoSession()) return demoCreateBudget(data);
  const res = await apiFetch(`${API_BASE}/budgets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await responseError(res, "Could not create this budget.");
  return res.json();
}

export async function updateBudget(id: string, data: BudgetUpdate): Promise<BudgetResponse> {
  const res = await apiFetch(`${API_BASE}/budgets/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await responseError(res, "Could not update this budget.");
  return res.json();
}

export async function deleteBudget(id: string): Promise<void> {
  const res = await apiFetch(`${API_BASE}/budgets/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!res.ok) throw await responseError(res, "Could not delete this budget.");
}

export async function fetchGoals(): Promise<GoalResponse[]> {
  if (isDemoSession()) return demoGoals();
  const res = await apiFetch(`${API_BASE}/goals`);
  if (!res.ok) throw await responseError(res, "Could not load your goals.");
  return res.json();
}

export async function createGoal(data: GoalCreate): Promise<GoalResponse> {
  if (isDemoSession()) return demoCreateGoal(data);
  const res = await apiFetch(`${API_BASE}/goals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await responseError(res, "Could not create this goal.");
  return res.json();
}

export async function updateGoal(id: string, data: GoalUpdate): Promise<GoalResponse> {
  const res = await apiFetch(`${API_BASE}/goals/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await responseError(res, "Could not update this goal.");
  return res.json();
}

export async function deleteGoal(id: string): Promise<void> {
  const res = await apiFetch(`${API_BASE}/goals/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!res.ok) throw await responseError(res, "Could not delete this goal.");
}

export async function fetchIntelligenceOverview(): Promise<IntelligenceOverviewDTO> {
  if (isDemoSession()) return demoOverview;
  const res = await apiFetch(`${API_BASE}/analytics/overview`);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch intelligence overview: ${res.status} ${res.statusText}`,
    );
  }
  return res.json();
}

export async function fetchBehaviourScore(): Promise<BehaviourScoreDTO> {
  if (isDemoSession()) return demoOverview.behaviour_profile;
  const res = await apiFetch(`${API_BASE}/analytics/score`);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch behavioural score: ${res.status} ${res.statusText}`,
    );
  }
  return res.json();
}

export async function fetchForecast(): Promise<ForecastDTO> {
  if (isDemoSession()) return demoOverview.forecast;
  const res = await apiFetch(`${API_BASE}/analytics/forecast`);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch spending forecast: ${res.status} ${res.statusText}`,
    );
  }
  return res.json();
}

export async function fetchBehaviouralChanges(): Promise<BehaviourShiftDTO[]> {
  if (isDemoSession()) return demoOverview.observed_shifts;
  const res = await apiFetch(`${API_BASE}/analytics/changes`);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch behavioural changes: ${res.status} ${res.statusText}`,
    );
  }
  return res.json();
}

export async function fetchRecommendations(): Promise<RecommendationDTO[]> {
  if (isDemoSession()) return demoOverview.recommendations;
  const res = await apiFetch(`${API_BASE}/analytics/recommendations`);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch recommendations: ${res.status} ${res.statusText}`,
    );
  }
  return res.json();
}

export async function fetchAnomalies(): Promise<AnomalyAlertDTO[]> {
  if (isDemoSession()) return demoOverview.top_anomalies;
  const res = await apiFetch(`${API_BASE}/analytics/anomalies`);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch anomalies: ${res.status} ${res.statusText}`,
    );
  }
  return res.json();
}

export async function triggerBankSync(
  accountId: string = "acc-1",
  institutionId: string = "hsbc_demo",
): Promise<{
  transactions_added: number;
  transactions_updated: number;
  new_balance: number;
}> {
  if (isDemoSession())
    return {
      transactions_added: 0,
      transactions_updated: 0,
      new_balance: demoOverview.liquid_balance,
    };
  const res = await apiFetch(`${API_BASE}/bank/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      account_id: accountId,
      institution_id: institutionId,
    }),
  });
  if (!res.ok) {
    throw new Error(`Failed to sync bank: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function uploadStatement(
  accountId: string,
  file: File,
): Promise<{
  filename: string;
  transactions_parsed: number;
  transactions_added: number;
  duplicates_skipped: number;
}> {
  if (isDemoSession())
    throw new Error(
      "File import will be connected when the backend is added. Explore the sample calendar and transactions for now; no file has been uploaded.",
    );
  const formData = new FormData();
  formData.append("account_id", accountId);
  formData.append("file", file);

  const res = await apiFetch(`${API_BASE}/statements/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    throw new Error(
      `Failed to upload statement: ${res.status} ${res.statusText}`,
    );
  }
  return res.json();
}

export async function fetchBankAccounts(): Promise<BankAccountSummary[]> {
  const response = await apiFetch(`${API_BASE}/accounts`);
  if (!response.ok) throw await responseError(response, "Could not load your accounts.");
  return response.json();
}

export async function createBankAccount(input: {
  institution_name: string;
  account_type: AccountTypeOption;
  last_four?: string;
}): Promise<BankAccountSummary> {
  const response = await apiFetch(`${API_BASE}/accounts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      institution_name: input.institution_name,
      account_type: input.account_type,
      ...(input.last_four ? { account_last4: input.last_four } : {}),
      adapter_type: "STATEMENT_IMPORT",
    }),
  });
  if (!response.ok) throw await responseError(response, "Could not save this account.");
  return response.json();
}

// PATCH an account label; `last_four` maps to the API's account_last4 (never a full number).
export async function updateBankAccount(
  id: string,
  input: { institution_name?: string; account_type?: AccountTypeOption; last_four?: string },
): Promise<BankAccountSummary> {
  const response = await apiFetch(`${API_BASE}/accounts/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...(input.institution_name !== undefined ? { institution_name: input.institution_name } : {}),
      ...(input.account_type ? { account_type: input.account_type } : {}),
      ...(input.last_four ? { account_last4: input.last_four } : {}),
    }),
  });
  if (!response.ok) throw await responseError(response, "Could not update this account.");
  return response.json();
}

// Deletes an account. Without deleteTransactions the API answers 409 if the account still has transactions.
export async function deleteBankAccount(id: string, deleteTransactions = false): Promise<void> {
  const query = deleteTransactions ? "?delete_transactions=true" : "";
  const response = await apiFetch(`${API_BASE}/accounts/${encodeURIComponent(id)}${query}`, { method: "DELETE" });
  if (!response.ok) throw await responseError(response, "Could not delete this account.");
}

export async function previewStatement(file: File): Promise<StatementPreview> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await apiFetch(`${API_BASE}/statements/preview`, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) throw await responseError(response, "Could not read this statement.");
  return response.json();
}

export async function confirmStatementImport(input: {
  account_id: string;
  source_format: StatementSourceFormat;
  transactions: StatementDraftTransaction[];
}): Promise<{
  account_id: string;
  transactions_confirmed: number;
  transactions_added: number;
  duplicates_skipped: number;
}> {
  const response = await apiFetch(`${API_BASE}/statements/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw await responseError(response, "Could not save these transactions.");
  return response.json();
}
