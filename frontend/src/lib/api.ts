import { CalendarViewResponse } from "@/types/calendar";
import { CanonicalTransaction, TransactionDetail } from "@/types/transaction";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export async function fetchCalendarView(
  mode: "day" | "week" | "month" = "month",
  year?: number,
  month?: number
): Promise<CalendarViewResponse> {
  const params = new URLSearchParams({ mode });
  if (year) params.append("year", year.toString());
  if (month) params.append("month", month.toString());

  const res = await fetch(`${API_BASE}/calendar/view?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch calendar view: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchTransactions(): Promise<CanonicalTransaction[]> {
  const res = await fetch(`${API_BASE}/transactions`);
  if (!res.ok) {
    throw new Error(`Failed to fetch transactions: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchTransactionDetail(id: string): Promise<TransactionDetail> {
  const res = await fetch(`${API_BASE}/transactions/${id}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch transaction detail: ${res.statusText}`);
  }
  return res.json();
}

export async function triggerBankSync(accountId: string): Promise<unknown> {
  const res = await fetch(`${API_BASE}/bank/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ account_id: accountId, institution_id: "hsbc_demo" }),
  });
  if (!res.ok) {
    throw new Error(`Failed to sync bank: ${res.statusText}`);
  }
  return res.json();
}
