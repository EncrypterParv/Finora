import { isDemoSession } from "./demo-session";
import { createClient as createSupabaseClient } from "./supabase/client";
import {
  demoAccounts,
  demoOverview,
  demoTransactions,
  demoBudgets,
  demoGoals,
  demoCreateBudget,
  demoCreateGoal,
  demoCalendar,
  demoTransactionDetail,
  getDemoHistoricalInsights,
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
  HistoricalSamplingDTO,
} from "@/types/analytics";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "/api/v1";

// Session cache for repeat reads. Entries live until a relevant mutation,
// sign-out, LRU eviction, or page reload. User data never enters localStorage.
const API_CACHE_MAX_ENTRIES = 60;
const API_CACHE_MAX_BYTES = 5 * 1024 * 1024;
const API_CACHE_MAX_ENTRY_BYTES = 1024 * 1024;
const API_CACHE_TAGS = ["accounts", "transactions", "calendar", "budgets", "goals", "analytics"] as const;
type ApiCacheTag = (typeof API_CACHE_TAGS)[number];
type CachedApiResponse = {
  userId: string;
  tags: ApiCacheTag[];
  body: string;
  status: number;
  statusText: string;
  headers: [string, string][];
  sizeBytes: number;
};
const apiResponseCache = new Map<string, CachedApiResponse>();
const apiCacheInFlight = new Map<string, Promise<CachedApiResponse>>();
const apiCacheGenerations = new Map<string, Map<ApiCacheTag, number>>();
let apiCacheEpoch = 0;
let apiCacheBytes = 0;
let apiCacheChannel: BroadcastChannel | null = null;

function removeCachedResponse(key: string) {
  const cached = apiResponseCache.get(key);
  if (!cached) return;
  apiResponseCache.delete(key);
  apiCacheBytes -= cached.sizeBytes;
}

function clearAllCachedResponses() {
  apiCacheEpoch += 1;
  apiResponseCache.clear();
  apiCacheInFlight.clear();
  apiCacheGenerations.clear();
  apiCacheBytes = 0;
}

function ensureApiCacheChannel() {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return null;
  if (apiCacheChannel) return apiCacheChannel;

  try {
    apiCacheChannel = new BroadcastChannel("finora-api-cache-v2");
  } catch {
    // Browser privacy settings may disable channels; same-tab invalidation remains active.
    return null;
  }
  apiCacheChannel.addEventListener("message", (event: MessageEvent<unknown>) => {
    const message = event.data as { type?: unknown; userId?: unknown; tags?: unknown } | null;
    if (message?.type === "clear") {
      clearAllCachedResponses();
      return;
    }
    if (message?.type !== "invalidate" || typeof message.userId !== "string" || !Array.isArray(message.tags)) return;
    const tags = message.tags.filter((tag): tag is ApiCacheTag => API_CACHE_TAGS.includes(tag as ApiCacheTag));
    if (tags.length) invalidateApiCache(message.userId, tags, false);
  });
  return apiCacheChannel;
}

function invalidateApiCache(userId: string, tags: readonly ApiCacheTag[], broadcast = true) {
  if (tags.length === 0) return;
  const versions = apiCacheGenerations.get(userId) ?? new Map<ApiCacheTag, number>();
  for (const tag of tags) versions.set(tag, (versions.get(tag) ?? 0) + 1);
  apiCacheGenerations.set(userId, versions);

  for (const [key, cached] of apiResponseCache) {
    if (cached.userId === userId && cached.tags.some((tag) => tags.includes(tag))) removeCachedResponse(key);
  }
  if (broadcast) ensureApiCacheChannel()?.postMessage({ type: "invalidate", userId, tags });
}

function cacheTagsForRead(url: string): ApiCacheTag[] {
  const path = new URL(url, "http://finora.local").pathname;
  if (path.endsWith("/calendar/view")) return ["calendar", "transactions"];
  if (/\/transactions(?:\/|$)/.test(path)) return ["transactions"];
  if (/\/accounts(?:\/|$)/.test(path)) return ["accounts"];
  if (/\/budgets(?:\/|$)/.test(path)) return ["budgets", "transactions"];
  if (/\/goals(?:\/|$)/.test(path)) return ["goals"];
  if (/\/analytics(?:\/|$)/.test(path)) return ["analytics", "transactions", "budgets"];
  return [];
}

function cacheTagsForMutation(url: string, method: string): ApiCacheTag[] | null {
  const parsed = new URL(url, "http://finora.local");
  const path = parsed.pathname;
  if (path.endsWith("/statements/preview")) return [];
  if (path.endsWith("/statements/import") || path.endsWith("/statements/upload")) {
    return ["transactions", "calendar", "budgets", "analytics"];
  }
  if (path.endsWith("/bank/sync")) {
    return ["accounts", "transactions", "calendar", "budgets", "analytics"];
  }
  if (/\/transactions(?:\/|$)/.test(path)) return ["transactions", "calendar", "budgets", "analytics"];
  if (/\/accounts(?:\/|$)/.test(path)) {
    return method === "DELETE" && parsed.searchParams.get("delete_transactions") === "true"
      ? ["accounts", "transactions", "calendar", "budgets", "analytics"]
      : ["accounts"];
  }
  if (/\/budgets(?:\/|$)/.test(path)) return ["budgets", "analytics"];
  if (/\/goals(?:\/|$)/.test(path)) return ["goals"];
  return null;
}

function cacheVersionKey(userId: string, tags: readonly ApiCacheTag[]) {
  const versions = apiCacheGenerations.get(userId);
  return [...tags].sort().map((tag) => `${tag}:${versions?.get(tag) ?? 0}`).join(",");
}

function responseFromSnapshot(snapshot: CachedApiResponse) {
  const bodylessStatus = snapshot.status === 204 || snapshot.status === 205 || snapshot.status === 304;
  return new Response(bodylessStatus ? null : snapshot.body, {
    status: snapshot.status,
    statusText: snapshot.statusText,
    headers: snapshot.headers,
  });
}

async function fetchCachedApiResponse(
  userId: string,
  url: string,
  tags: ApiCacheTag[],
  fetcher: () => Promise<Response>,
): Promise<Response> {
  ensureApiCacheChannel();
  const cacheKey = `${userId}:${url}`;
  const cached = apiResponseCache.get(cacheKey);
  if (cached) {
    // Map insertion order is the LRU order: a hit makes this entry newest.
    apiResponseCache.delete(cacheKey);
    apiResponseCache.set(cacheKey, cached);
    return responseFromSnapshot(cached);
  }

  const requestEpoch = apiCacheEpoch;
  const versionKey = cacheVersionKey(userId, tags);
  const flightKey = `${cacheKey}:${requestEpoch}:${versionKey}`;
  let pending = apiCacheInFlight.get(flightKey);
  if (!pending) {
    pending = (async () => {
      const response = await fetcher();
      const body = await response.clone().text();
      const snapshotHeaders = new Headers();
      for (const name of ["content-type", "x-total-count", "retry-after", "x-request-id", "www-authenticate"]) {
        const value = response.headers.get(name);
        if (value !== null) snapshotHeaders.set(name, value);
      }
      const snapshot: CachedApiResponse = {
        userId,
        tags,
        body,
        status: response.status,
        statusText: response.statusText,
        headers: Array.from(snapshotHeaders.entries()),
        sizeBytes: new TextEncoder().encode(body).byteLength,
      };

      const stillCurrent = requestEpoch === apiCacheEpoch && versionKey === cacheVersionKey(userId, tags);
      if (!response.ok || !stillCurrent || snapshot.sizeBytes > API_CACHE_MAX_ENTRY_BYTES) return snapshot;

      while (apiResponseCache.size >= API_CACHE_MAX_ENTRIES || apiCacheBytes + snapshot.sizeBytes > API_CACHE_MAX_BYTES) {
        const oldestKey = apiResponseCache.keys().next().value;
        if (oldestKey === undefined) break;
        removeCachedResponse(oldestKey);
      }
      apiResponseCache.set(cacheKey, snapshot);
      apiCacheBytes += snapshot.sizeBytes;
      return snapshot;
    })();
    apiCacheInFlight.set(flightKey, pending);
  }

  try {
    return responseFromSnapshot(await pending);
  } finally {
    if (apiCacheInFlight.get(flightKey) === pending) apiCacheInFlight.delete(flightKey);
  }
}

export function clearApiResponseCache(userId?: string) {
  if (!userId) {
    clearAllCachedResponses();
    ensureApiCacheChannel()?.postMessage({ type: "clear" });
    return;
  }
  invalidateApiCache(userId, API_CACHE_TAGS);
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
  const fetcher = () => fetch(input, { ...init, headers });

  if (method === "GET" && userId) {
    const tags = cacheTagsForRead(requestUrl);
    if (tags.length) return fetchCachedApiResponse(userId, requestUrl, tags, fetcher);
  }

  const response = await fetcher();
  if (method !== "GET" && userId && response.ok) {
    const tags = cacheTagsForMutation(requestUrl, method);
    if (tags === null) clearApiResponseCache(userId);
    else if (tags.length) invalidateApiCache(userId, tags);
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
  if (isDemoSession()) {
    let items = demoTransactions;
    if (filters.q) {
      const query = filters.q.toLowerCase();
      items = items.filter(
        (t) =>
          t.merchant_name?.toLowerCase().includes(query) ||
          t.category_name?.toLowerCase().includes(query) ||
          t.raw_description.toLowerCase().includes(query)
      );
    }
    if (filters.transaction_type) {
      items = items.filter((t) => t.transaction_type === filters.transaction_type);
    }
    if (filters.account_id) {
      items = items.filter((t) => t.account_id === filters.account_id);
    }
    return {
      items: items.slice(offset, offset + limit),
      total: items.length,
    };
  }
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

export interface CurrencyCashFlow {
  currency: string;
  transaction_count: number;
  days: { day: string; inflow: string; spending: string }[];
  spending_by_account: Record<string, string>;
}

export async function fetchTransactionSummary(month: string): Promise<{ month: string; currencies: CurrencyCashFlow[] }> {
  if (isDemoSession()) {
    const monthTx = demoTransactions.filter((t) => t.occurred_at.startsWith(month));
    const daysMap = new Map<string, { inflow: number; spending: number }>();
    monthTx.forEach((t) => {
      const day = t.occurred_at.slice(0, 10);
      const curr = daysMap.get(day) || { inflow: 0, spending: 0 };
      if (t.transaction_type === "CREDIT") curr.inflow += t.amount;
      else if (t.transaction_type === "DEBIT") curr.spending += t.amount;
      daysMap.set(day, curr);
    });
    const days = Array.from(daysMap.entries()).map(([day, val]) => ({
      day,
      inflow: String(val.inflow),
      spending: String(val.spending),
    }));
    const totalSpend = monthTx
      .filter((t) => t.transaction_type === "DEBIT")
      .reduce((s, t) => s + t.amount, 0);

    return {
      month,
      currencies: [
        {
          currency: "INR",
          transaction_count: monthTx.length,
          days: days.length > 0 ? days : [{ day: `${month}-01`, inflow: "0", spending: "0" }],
          spending_by_account: { "acc-1": String(totalSpend) },
        },
      ],
    };
  }
  const params = new URLSearchParams({ month });
  const response = await apiFetch(`${API_BASE}/transactions/summary?${params}`);
  if (!response.ok) throw await responseError(response, "Could not load your monthly summary.");
  return response.json();
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

export async function fetchHistoricalInsights(
  horizon: "30d" | "1y" | "5y" | "10y" | "all" = "all",
  bootstrapSamples = 1000
): Promise<HistoricalSamplingDTO> {
  if (isDemoSession()) return getDemoHistoricalInsights(horizon);
  const res = await apiFetch(
    `${API_BASE}/analytics/historical?horizon=${horizon}&bootstrap_samples=${bootstrapSamples}`
  );
  if (!res.ok) {
    // If backend 404s or is inaccessible, fall back to robust local demo sampling to preserve UX
    return getDemoHistoricalInsights(horizon);
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
  if (isDemoSession()) return demoAccounts;
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
