"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, RotateCw, Trash2 } from "lucide-react";
import { createBudget, deleteBudget, fetchBudgets, updateBudget } from "@/lib/api";
import { BudgetResponse } from "@/types/budget";
import {
  ConfirmStrip,
  EmptyPanel,
  ErrorNote,
  Field,
  IconButton,
  inputClass,
  PageTitle,
  Panel,
  PrimaryButton,
  ProgressBar,
  SecondaryButton,
  formatDate,
  money,
  toIso,
  todayIso,
  toNumber,
} from "./prototype-ui";

// Budgets screen: spending limits for a date range, with real spend and a pace-based projection.
export function BudgetsScreen() {
  const [budgets, setBudgets] = useState<BudgetResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    fetchBudgets()
      .then((result) => { if (active) setBudgets(result); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Could not load your budgets."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reloadKey]);

  const today = todayIso();
  const ordered = [...budgets].sort((a, b) => budgetRank(a, today) - budgetRank(b, today) || b.start_date.localeCompare(a.start_date));

  return <>
    <PageTitle
      title="Budgets"
      description="Set a spending limit for a period. Finora adds up the spending you’ve recorded in those dates and shows where your pace is heading."
      action={<PrimaryButton onClick={() => setShowCreate((open) => !open)} aria-expanded={showCreate}><Plus size={16} /> New budget</PrimaryButton>}
    />
    {showCreate && <Panel className="mb-4 p-5"><BudgetForm onCancel={() => setShowCreate(false)} onSaved={(budget) => { setBudgets((current) => [budget, ...current]); setShowCreate(false); }} /></Panel>}
    {loading ? <Panel className="p-8 text-sm text-[#766e65]"><span role="status">Loading your budgets…</span></Panel>
      : error ? <Panel className="p-6"><p role="alert" className="text-sm text-[#9f2f2d]">{error}</p><SecondaryButton className="mt-4" onClick={() => setReloadKey((key) => key + 1)}><RotateCw size={15} /> Try again</SecondaryButton></Panel>
      : ordered.length === 0 ? (!showCreate && <EmptyPanel title="No budgets yet" body="A budget is a spending limit for a period, like ₹20,000 for this month. Every spending transaction in those dates counts toward it, across all your accounts." onAdd={() => setShowCreate(true)} actionLabel="Create your first budget" />)
      : <div className="grid gap-4 lg:grid-cols-2">{ordered.map((budget) => <BudgetCard key={budget.id} budget={budget} today={today}
          onUpdated={(updated) => setBudgets((current) => current.map((item) => item.id === updated.id ? updated : item))}
          onDeleted={(id) => setBudgets((current) => current.filter((item) => item.id !== id))} />)}</div>}
    {!loading && ordered.length > 0 && <p className="mt-4 text-xs text-[#837970]">Budgets count all spending across your accounts in their dates. Per-category limits are coming later.</p>}
  </>;
}

// Running budgets first, then upcoming, then finished ones.
function budgetRank(budget: BudgetResponse, today: string): number {
  if (budget.start_date <= today && budget.end_date >= today) return 0;
  if (budget.start_date > today) return 1;
  return 2;
}

// One budget: spent vs limit, a status sentence, and edit/delete.
function BudgetCard({ budget, today, onUpdated, onDeleted }: { budget: BudgetResponse; today: string; onUpdated: (budget: BudgetResponse) => void; onDeleted: (id: string) => void }) {
  const [mode, setMode] = useState<"view" | "edit" | "confirm">("view");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  const limit = toNumber(budget.total_limit);
  const spent = toNumber(budget.total_spent);
  const percent = limit > 0 ? (spent / limit) * 100 : 0;
  const upcoming = budget.start_date > today;
  const ended = budget.end_date < today;
  const over = spent > limit;
  const tone = over ? "over" : percent >= 85 ? "caution" : "steady";
  const status = budgetStatus(budget, { limit, spent, upcoming, ended, over });

  async function remove() {
    setWorking(true);
    setError("");
    try {
      await deleteBudget(budget.id);
      onDeleted(budget.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete this budget.");
      setWorking(false);
    }
  }

  if (mode === "edit") return <Panel className="p-5"><BudgetForm budget={budget} onCancel={() => setMode("view")} onSaved={(updated) => { onUpdated(updated); setMode("view"); }} /></Panel>;

  return <Panel className="p-5">
    <div className="flex items-start gap-2">
      <div className="min-w-0 flex-1">
        <h2 className="truncate font-semibold">{budget.name}</h2>
        <p className="mt-1 text-xs text-[#837970]">{formatDate(budget.start_date, { day: "numeric", month: "short" })} – {formatDate(budget.end_date)}{upcoming ? " · Upcoming" : ended ? " · Finished" : ""}</p>
      </div>
      <IconButton label={`Edit ${budget.name}`} onClick={() => setMode("edit")}><Pencil size={15} /></IconButton>
      <IconButton label={`Delete ${budget.name}`} onClick={() => setMode("confirm")}><Trash2 size={15} /></IconButton>
    </div>
    <div className="mt-5 flex flex-wrap items-baseline justify-between gap-2">
      <p className="tabular-nums"><span className="prototype-figure">{money(spent)}</span> <span className="text-sm text-[#837970]">of {money(limit)}</span></p>
      <p className={`text-sm font-medium tabular-nums ${over ? "text-[#9f2f2d]" : "text-[#5f554c]"}`}>{over ? `${money(spent - limit)} over` : `${money(limit - spent)} left`}</p>
    </div>
    <div className="mt-3"><ProgressBar value={percent} tone={tone} label={`${budget.name}: ${Math.round(percent)}% of the limit spent`} /></div>
    <p className={`mt-3 text-xs leading-5 ${status.warn ? "text-[#8b4a1d]" : "text-[#766e65]"}`}>{status.text}</p>
    {mode === "confirm" && <ConfirmStrip message={<>Delete the budget <strong>{budget.name}</strong>? Your transactions stay as they are.</>} confirmLabel="Delete budget" working={working} onConfirm={remove} onCancel={() => setMode("view")} />}
    {error && <ErrorNote message={error} />}
  </Panel>;
}

// The one-line explanation under the bar, in plain words.
function budgetStatus(budget: BudgetResponse, s: { limit: number; spent: number; upcoming: boolean; ended: boolean; over: boolean }): { text: string; warn: boolean } {
  if (s.upcoming) return { text: `Starts on ${formatDate(budget.start_date)}. Spending before then doesn’t count.`, warn: false };
  if (s.ended) return { text: s.over ? `Finished ${money(s.spent - s.limit)} over the limit.` : `Finished with ${money(s.limit - s.spent)} to spare.`, warn: s.over };
  if (s.over) return { text: "You’ve gone past this limit. New spending in these dates keeps adding to it.", warn: true };
  if (budget.projected_exhaustion_date) return { text: `At your current pace you’ll reach the limit on ${formatDate(budget.projected_exhaustion_date, { day: "numeric", month: "short" })}, before the budget ends.`, warn: true };
  const projected = toNumber(budget.projected_burn_total);
  if (projected > 0) return { text: `On track: about ${money(projected)} by ${formatDate(budget.end_date, { day: "numeric", month: "short" })} at your current pace.`, warn: false };
  return { text: "No spending recorded in these dates yet.", warn: false };
}

function monthBounds(): { start: string; end: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return { start: toIso(year, month, 1), end: toIso(year, month, new Date(year, month, 0).getDate()) };
}

// Create/edit form. A budget covering exactly one calendar month is saved as MONTHLY, anything else as CUSTOM.
function BudgetForm({ budget, onCancel, onSaved }: { budget?: BudgetResponse; onCancel: () => void; onSaved: (budget: BudgetResponse) => void }) {
  const defaults = monthBounds();
  const [name, setName] = useState(budget?.name ?? "");
  const [limit, setLimit] = useState(budget ? String(toNumber(budget.total_limit)) : "");
  const [start, setStart] = useState(budget?.start_date ?? defaults.start);
  const [end, setEnd] = useState(budget?.end_date ?? defaults.end);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (end < start) { setError("The end date must be on or after the start date."); return; }
    if (toNumber(limit) <= 0) { setError("Enter a limit greater than zero."); return; }
    const startDate = new Date(`${start}T00:00:00Z`);
    const lastOfMonth = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
    const payload = {
      name: name.trim(),
      total_limit: Math.round(toNumber(limit) * 100) / 100,
      start_date: start,
      end_date: end,
      period: start.endsWith("-01") && end === lastOfMonth ? "MONTHLY" : "CUSTOM",
    };
    setWorking(true);
    try {
      onSaved(budget ? await updateBudget(budget.id, payload) : await createBudget(payload));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save this budget.");
    } finally {
      setWorking(false);
    }
  }

  return <form onSubmit={submit}>
    <h2 className="font-semibold">{budget ? "Edit budget" : "New budget"}</h2>
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <Field label="Name"><input required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. November spending" className={inputClass} /></Field>
      <Field label="Spending limit (₹)"><input type="number" required min="1" step="1" inputMode="numeric" value={limit} onChange={(event) => setLimit(event.target.value)} className={inputClass} /></Field>
      <Field label="Starts"><input type="date" required value={start} onChange={(event) => setStart(event.target.value)} className={inputClass} /></Field>
      <Field label="Ends"><input type="date" required min={start} value={end} onChange={(event) => setEnd(event.target.value)} className={inputClass} /></Field>
    </div>
    {error && <ErrorNote message={error} />}
    <div className="mt-4 flex flex-wrap gap-2"><PrimaryButton type="submit" disabled={working}>{working ? "Saving…" : budget ? "Save changes" : "Create budget"}</PrimaryButton><SecondaryButton onClick={onCancel} disabled={working}>Cancel</SecondaryButton></div>
  </form>;
}
