"use client";

import { useEffect, useState } from "react";
import { Check, Pause, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { createGoal, deleteGoal, fetchGoals, updateGoal } from "@/lib/api";
import { GoalResponse, GoalStatus, GoalUpdate } from "@/types/goal";
import { CollectionLoadingSkeleton } from "./PrototypeSkeletons";
import {
  ConfirmStrip,
  DataLoadNotice,
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
  todayIso,
  toNumber,
} from "./prototype-ui";

const goalTypes: { value: string; label: string }[] = [
  { value: "EMERGENCY_FUND", label: "Emergency fund" },
  { value: "HOUSE", label: "Home" },
  { value: "CAR", label: "Vehicle" },
  { value: "EDUCATION", label: "Education" },
  { value: "TRAVEL", label: "Travel" },
  { value: "RETIREMENT", label: "Retirement" },
  { value: "FIRE", label: "Financial independence" },
  { value: "CUSTOM", label: "Something else" },
];
const goalTypeLabel = (value: string) => goalTypes.find((type) => type.value === value)?.label ?? "Savings goal";

const statusLabels: Record<string, string> = { IN_PROGRESS: "In progress", PAUSED: "Paused", COMPLETED: "Completed" };

// Goals screen: savings targets with progress, a projected finish date and quick updates.
export function GoalsScreen() {
  const [goals, setGoals] = useState<GoalResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    fetchGoals()
      .then((result) => { if (active) setGoals(result); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Could not load your goals."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reloadKey]);

  const order: Record<string, number> = { IN_PROGRESS: 0, PAUSED: 1, COMPLETED: 2 };
  const ordered = [...goals].sort((a, b) => (order[a.status] ?? 3) - (order[b.status] ?? 3) || a.target_date.localeCompare(b.target_date));
  const replace = (updated: GoalResponse) => setGoals((current) => current.map((goal) => goal.id === updated.id ? updated : goal));

  return <>
    <PageTitle
      title="Goals"
      description="Save towards something specific. Finora estimates when you’ll get there from what you’ve saved and what you add each month."
      action={<PrimaryButton onClick={() => setShowCreate((open) => !open)} aria-expanded={showCreate} disabled={loading || Boolean(error)}><Plus size={16} /> New goal</PrimaryButton>}
    />
    {showCreate && <Panel className="mb-4 p-5"><GoalForm onCancel={() => setShowCreate(false)} onSaved={(goal) => { setGoals((current) => [goal, ...current]); setShowCreate(false); }} /></Panel>}
    {loading && goals.length === 0 ? <CollectionLoadingSkeleton label="Loading your goals" />
      : error ? <DataLoadNotice subject="Goals" onRetry={() => setReloadKey((key) => key + 1)} />
      : ordered.length === 0 ? (!showCreate && <EmptyPanel title="No goals yet" body="Add a goal like an emergency fund or a trip. Enter what you’ve saved and what you can add each month, and Finora estimates your finish date." onAdd={() => setShowCreate(true)} actionLabel="Create your first goal" />)
      : <div className="grid gap-4 lg:grid-cols-2">{ordered.map((goal) => <GoalCard key={goal.id} goal={goal} onUpdated={replace} onDeleted={(id) => setGoals((current) => current.filter((item) => item.id !== id))} />)}</div>}
    {ordered.length > 0 && <p className="mt-4 text-xs text-[#62645d]">Finish dates are estimates that assume your monthly amount and expected return stay the same. They are not investment advice.</p>}
  </>;
}

// One goal: progress toward the target, the projected finish, and its actions.
function GoalCard({ goal, onUpdated, onDeleted }: { goal: GoalResponse; onUpdated: (goal: GoalResponse) => void; onDeleted: (id: string) => void }) {
  const [mode, setMode] = useState<"view" | "edit" | "confirm" | "saved">("view");
  const [savedInput, setSavedInput] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  const target = toNumber(goal.target_amount);
  const saved = toNumber(goal.current_saved);
  const percent = target > 0 ? (saved / target) * 100 : 0;
  const completed = goal.status === "COMPLETED";
  const paused = goal.status === "PAUSED";
  const projection = goalProjection(goal);

  async function patch(update: GoalUpdate) {
    setWorking(true);
    setError("");
    try {
      onUpdated(await updateGoal(goal.id, update));
      setMode("view");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update this goal.");
    } finally {
      setWorking(false);
    }
  }

  async function remove() {
    setWorking(true);
    setError("");
    try {
      await deleteGoal(goal.id);
      onDeleted(goal.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete this goal.");
      setWorking(false);
    }
  }

  if (mode === "edit") return <Panel className="p-5"><GoalForm goal={goal} onCancel={() => setMode("view")} onSaved={(updated) => { onUpdated(updated); setMode("view"); }} /></Panel>;

  return <Panel className="p-5">
    <div className="flex items-start gap-2">
      <div className="min-w-0 flex-1">
        <h2 className="truncate font-semibold">{goal.title}</h2>
        <p className="mt-1 text-xs text-[#62645d]">{goalTypeLabel(goal.goal_type)} · target date {formatDate(goal.target_date)}</p>
      </div>
      <span className="prototype-tag" data-status={goal.status}>{statusLabels[goal.status] ?? goal.status}</span>
      <IconButton label={`Edit ${goal.title}`} onClick={() => setMode("edit")}><Pencil size={15} /></IconButton>
      <IconButton label={`Delete ${goal.title}`} onClick={() => setMode("confirm")}><Trash2 size={15} /></IconButton>
    </div>
    <div className="mt-5 flex flex-wrap items-baseline justify-between gap-2">
      <p className="tabular-nums"><span className="prototype-figure">{money(saved)}</span> <span className="text-sm text-[#62645d]">of {money(target)}</span></p>
      <p className="text-sm font-medium tabular-nums text-[#414340]">{Math.min(100, Math.round(percent))}%</p>
    </div>
    <div className="mt-3"><ProgressBar value={percent} tone={completed || percent >= 100 ? "done" : "steady"} label={`${goal.title}: ${Math.round(percent)}% saved`} /></div>
    <p className={`mt-3 text-xs leading-5 ${projection.warn ? "text-[#755727]" : "text-[#575953]"}`}>{projection.text}</p>
    <p className="mt-1 text-xs text-[#62645d]">Adding {money(goal.monthly_contribution)} a month · expected return {toNumber(goal.expected_annual_return_pct)}% a year</p>

    {mode === "saved"
      ? <form className="mt-4 flex flex-wrap items-end gap-2" onSubmit={(event) => { event.preventDefault(); if (savedInput !== "" && toNumber(savedInput) >= 0) void patch({ current_saved: Math.round(toNumber(savedInput) * 100) / 100 }); }}>
          <Field label="Total saved so far (₹)" className="min-w-[180px] flex-1"><input autoFocus type="number" required min="0" step="0.01" inputMode="decimal" value={savedInput} onChange={(event) => setSavedInput(event.target.value)} className={inputClass} /></Field>
          <PrimaryButton type="submit" disabled={working}>{working ? "Saving…" : "Save"}</PrimaryButton>
          <SecondaryButton onClick={() => setMode("view")} disabled={working}>Cancel</SecondaryButton>
        </form>
      : !completed && <div className="mt-4 flex flex-wrap gap-2 border-t border-[#e5e4de] pt-4">
          <SecondaryButton onClick={() => { setSavedInput(String(saved)); setMode("saved"); }}>Update savings</SecondaryButton>
          <SecondaryButton onClick={() => patch({ status: (paused ? "IN_PROGRESS" : "PAUSED") as GoalStatus })} disabled={working}>{paused ? <><Play size={14} /> Resume</> : <><Pause size={14} /> Pause</>}</SecondaryButton>
          <SecondaryButton onClick={() => patch({ status: "COMPLETED" })} disabled={working}><Check size={14} /> Mark as reached</SecondaryButton>
        </div>}
    {completed && <div className="mt-4 border-t border-[#e5e4de] pt-4"><SecondaryButton onClick={() => patch({ status: "IN_PROGRESS" })} disabled={working}>Reopen goal</SecondaryButton></div>}

    {mode === "confirm" && <ConfirmStrip message={<>Delete the goal <strong>{goal.title}</strong>? This can’t be undone.</>} confirmLabel="Delete goal" working={working} onConfirm={remove} onCancel={() => setMode("view")} />}
    {error && <ErrorNote message={error} />}
  </Panel>;
}

// Plain-words projection: reached, on track, behind, or needs a monthly amount.
function goalProjection(goal: GoalResponse): { text: string; warn: boolean } {
  if (goal.status === "COMPLETED") return { text: "Goal reached. Well done.", warn: false };
  if (toNumber(goal.current_saved) >= toNumber(goal.target_amount)) return { text: "You’ve saved the full amount. Mark it as reached when you’re ready.", warn: false };
  if (goal.status === "PAUSED") return { text: "Paused. Resume it when you start saving towards it again.", warn: false };
  if (!goal.projected_completion_date) return { text: "Add a monthly amount to see when you’ll reach this goal.", warn: true };
  const projected = formatDate(goal.projected_completion_date, { month: "long", year: "numeric" });
  return goal.is_on_track
    ? { text: `On track to reach it by ${projected}.`, warn: false }
    : { text: `At this rate you’ll reach it in ${projected}, after your target date. Adding more each month brings it closer.`, warn: true };
}

// Create/edit form for a goal.
function GoalForm({ goal, onCancel, onSaved }: { goal?: GoalResponse; onCancel: () => void; onSaved: (goal: GoalResponse) => void }) {
  const [title, setTitle] = useState(goal?.title ?? "");
  const [goalType, setGoalType] = useState(goal?.goal_type ?? "EMERGENCY_FUND");
  const [target, setTarget] = useState(goal ? String(toNumber(goal.target_amount)) : "");
  const [saved, setSaved] = useState(goal ? String(toNumber(goal.current_saved)) : "0");
  const [monthly, setMonthly] = useState(goal ? String(toNumber(goal.monthly_contribution)) : "");
  const [targetDate, setTargetDate] = useState(goal?.target_date ?? "");
  const [returnPct, setReturnPct] = useState(goal ? String(toNumber(goal.expected_annual_return_pct)) : "8");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (toNumber(target) <= 0) { setError("Enter a target amount greater than zero."); return; }
    const payload = {
      title: title.trim(),
      goal_type: goalType,
      target_amount: Math.round(toNumber(target) * 100) / 100,
      current_saved: Math.round(toNumber(saved) * 100) / 100,
      monthly_contribution: Math.round(toNumber(monthly) * 100) / 100,
      target_date: targetDate,
      expected_annual_return_pct: toNumber(returnPct),
    };
    setWorking(true);
    try {
      onSaved(goal ? await updateGoal(goal.id, payload) : await createGoal(payload));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save this goal.");
    } finally {
      setWorking(false);
    }
  }

  return <form onSubmit={submit}>
    <h2 className="font-semibold">{goal ? "Edit goal" : "New goal"}</h2>
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <Field label="What are you saving for?"><input required maxLength={150} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Emergency fund" className={inputClass} /></Field>
      <Field label="Type"><select value={goalType} onChange={(event) => setGoalType(event.target.value)} className={inputClass}>{goalTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></Field>
      <Field label="Target amount (₹)"><input type="number" required min="1" step="1" inputMode="numeric" value={target} onChange={(event) => setTarget(event.target.value)} className={inputClass} /></Field>
      <Field label="Target date"><input type="date" required min={goal ? undefined : todayIso()} value={targetDate} onChange={(event) => setTargetDate(event.target.value)} className={inputClass} /></Field>
      <Field label="Saved so far (₹)"><input type="number" required min="0" step="0.01" inputMode="decimal" value={saved} onChange={(event) => setSaved(event.target.value)} className={inputClass} /></Field>
      <Field label="You’ll add each month (₹)"><input type="number" min="0" step="1" inputMode="numeric" value={monthly} onChange={(event) => setMonthly(event.target.value)} placeholder="0" className={inputClass} /></Field>
      <Field label="Expected yearly return (%)" hint="0 for a savings account with no growth. 8 is a common long-term assumption." className="sm:col-span-2 sm:max-w-[50%]"><input type="number" min="0" max="30" step="0.1" inputMode="decimal" value={returnPct} onChange={(event) => setReturnPct(event.target.value)} className={inputClass} /></Field>
    </div>
    {error && <ErrorNote message={error} />}
    <div className="mt-4 flex flex-wrap gap-2"><PrimaryButton type="submit" disabled={working}>{working ? "Saving…" : goal ? "Save changes" : "Create goal"}</PrimaryButton><SecondaryButton onClick={onCancel} disabled={working}>Cancel</SecondaryButton></div>
  </form>;
}
