"use client";

import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Minus, RotateCw } from "lucide-react";
import { fetchIntelligenceOverview } from "@/lib/api";
import { BehaviourShiftDTO, IntelligenceOverviewDTO } from "@/types/analytics";
import { InsightsLoadingSkeleton } from "./PrototypeSkeletons";
import { EmptyPanel, PageTitle, Panel, ProgressBar, SecondaryButton, formatDate, money, toNumber } from "./prototype-ui";

// A 0–1 ratio from the API (sent as a string or number) shown as a whole percentage.
const percent = (ratio: unknown) => `${Math.round(toNumber(ratio) * 100)}%`;

// Insights screen: statistics and rules over the user's own transactions, never placeholder figures.
export function InsightsScreen({ onAddStatement }: { onAddStatement: () => void }) {
  const [data, setData] = useState<IntelligenceOverviewDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    fetchIntelligenceOverview()
      .then((result) => { if (active) setData(result); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Could not load your insights."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reloadKey]);

  const sufficiency = data?.data_sufficiency;

  return <>
    <PageTitle title="Insights" description="Calculated from your recorded transactions using statistics and simple rules, not a trained AI model." />
    {loading && !data ? <InsightsLoadingSkeleton />
      : error || !data ? <Panel className="p-6"><p role="alert" className="text-sm text-[#9f2f2d]">{error || "Could not load your insights."}</p><SecondaryButton className="mt-4" onClick={() => setReloadKey((key) => key + 1)}><RotateCw size={15} /> Try again</SecondaryButton></Panel>
      : sufficiency?.status === "INSUFFICIENT" ? <EmptyPanel title="Not enough history yet" body="Insights need at least 5 transactions spread across 7 days. More history gives better results; two to three months of statements works best." onAdd={onAddStatement} actionLabel="Add a bank statement" />
      : <>
        {sufficiency?.status === "PARTIAL" && sufficiency.guidance_message && <p role="note" className="mb-4 rounded-md border border-[#e9d5b8] bg-[#fff9ee] p-3 text-xs leading-5 text-[#725b43]">{sufficiency.guidance_message}</p>}
        <div className="grid gap-4 lg:grid-cols-2">
          <ThisMonth data={data} />
          <SpendingHabits data={data} />
        </div>
        <WhatChanged shifts={data.observed_shifts} />
        <Suggestions data={data} />
        <UnusualTransactions data={data} />
      </>}
  </>;
}

// Section heading used by every insights panel.
function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return <div><span className="prototype-eyebrow">{eyebrow}</span><h2 className="mt-1 font-semibold">{title}</h2></div>;
}

// "This month": spend so far plus the month-end forecast and its 80% range.
function ThisMonth({ data }: { data: IntelligenceOverviewDTO }) {
  const spent = toNumber(data.month_to_date_spend);
  const expected = toNumber(data.forecast.expected_total_burn);
  const lower = toNumber(data.forecast.lower_bound_80);
  const upper = toNumber(data.forecast.upper_bound_80);
  const pace = toNumber(data.forecast.daily_projected_rate);

  return <Panel className="p-5 md:p-6">
    <SectionHeading eyebrow="This month" title="Spending so far and where it’s heading" />
    <p className="mt-5 tabular-nums"><span className="prototype-figure">{money(spent)}</span> <span className="text-sm text-[#837970]">spent so far</span></p>
    <ForecastRangeBar spent={spent} expected={expected} lower={lower} upper={upper} />
    <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
      <div><dt className="text-xs text-[#837970]">Expected by month end</dt><dd className="mt-1 font-medium tabular-nums">{money(expected)}</dd></div>
      <div><dt className="text-xs text-[#837970]">Likely range (80%)</dt><dd className="mt-1 font-medium tabular-nums">{money(lower)} – {money(upper)}</dd></div>
      <div><dt className="text-xs text-[#837970]">Daily pace</dt><dd className="mt-1 font-medium tabular-nums">{money(pace)} / day</dd></div>
    </dl>
  </Panel>;
}

// Straight horizontal bar: solid fill = spent so far, tinted band = 80% range, thin line = expected total.
function ForecastRangeBar({ spent, expected, lower, upper }: { spent: number; expected: number; lower: number; upper: number }) {
  const max = Math.max(spent, expected, upper, 1) * 1.05;
  const at = (value: number) => `${Math.max(0, Math.min(100, (value / max) * 100))}%`;
  const label = `Spent ${money(spent)} so far; expected ${money(expected)} by month end, likely between ${money(lower)} and ${money(upper)}.`;

  return <div className="mt-5">
    <div className="insights-range" role="img" aria-label={label}>
      <span className="insights-range-band" style={{ left: at(lower), width: `calc(${at(upper)} - ${at(lower)})` }} />
      <span className="insights-range-spent" style={{ width: at(spent) }} />
      <span className="insights-range-expected" style={{ left: at(expected) }} />
    </div>
    <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#766e65]" aria-hidden="true">
      <li className="flex items-center gap-1.5"><span className="insights-key insights-key-spent" />Spent so far</li>
      <li className="flex items-center gap-1.5"><span className="insights-key insights-key-expected" />Expected</li>
      <li className="flex items-center gap-1.5"><span className="insights-key insights-key-band" />Likely range</li>
    </ul>
  </div>;
}

// "Spending habits": the rule-based score, weekend/discretionary shares, savings rate and top categories.
function SpendingHabits({ data }: { data: IntelligenceOverviewDTO }) {
  const profile = data.behaviour_profile;
  const showSavings = toNumber(data.monthly_inflow) > 0;
  const categories = profile.top_discretionary_categories ?? [];

  return <Panel className="p-5 md:p-6">
    <SectionHeading eyebrow="Spending habits" title="How you tend to spend" />
    <div className="mt-5 flex flex-wrap items-baseline justify-between gap-2">
      <p className="tabular-nums"><span className="text-xs text-[#837970]">Behaviour score (rule-based)</span><br /><span className="prototype-figure">{Math.round(toNumber(profile.score))}</span> <span className="text-sm text-[#837970]">/ 100</span></p>
      <span className="prototype-tag">{profile.behavioural_archetype}</span>
    </div>
    <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
      <div><dt className="text-xs text-[#837970]">Weekend share of spending</dt><dd className="mt-1 font-medium tabular-nums">{percent(profile.weekend_vs_weekday_ratio)}</dd></div>
      <div><dt className="text-xs text-[#837970]">Discretionary share</dt><dd className="mt-1 font-medium tabular-nums">{percent(profile.discretionary_ratio)}</dd></div>
      {showSavings && <div><dt className="text-xs text-[#837970]">Savings rate</dt><dd className="mt-1 font-medium tabular-nums">{Math.round(toNumber(profile.savings_rate_pct))}%</dd></div>}
    </dl>
    <h3 className="mt-6 text-xs font-medium text-[#655c54]">Top discretionary categories</h3>
    {categories.length === 0 ? <p className="mt-2 text-sm text-[#766e65]">No discretionary spending recorded yet.</p>
      : <ul className="mt-3 space-y-3">{categories.map((item) => {
          const share = toNumber(item.percentage);
          return <li key={item.category}>
            <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm"><span className="font-medium">{item.category}</span><span className="tabular-nums text-[#5f554c]">{item.amount !== undefined ? `${money(item.amount)} · ` : ""}{Math.round(share)}% of spending</span></div>
            <div className="mt-1.5"><ProgressBar value={share} label={`${item.category}: ${Math.round(share)}% of spending`} /></div>
          </li>;
        })}</ul>}
  </Panel>;
}

// Arrow for a shift's direction; colour comes from whether the change is good or bad.
function DirectionIcon({ direction }: { direction: BehaviourShiftDTO["direction"] }) {
  if (direction === "INCREASING") return <><ArrowUpRight size={16} aria-hidden="true" /><span className="sr-only">Up</span></>;
  if (direction === "DECREASING") return <><ArrowDownRight size={16} aria-hidden="true" /><span className="sr-only">Down</span></>;
  return <><Minus size={16} aria-hidden="true" /><span className="sr-only">No change</span></>;
}

// "What changed": last 30 days compared with the 60 days before.
function WhatChanged({ shifts }: { shifts: BehaviourShiftDTO[] }) {
  return <Panel className="mt-4 p-5 md:p-6">
    <SectionHeading eyebrow="What changed" title="Your last 30 days compared with the 60 before" />
    {shifts.length === 0 ? <p className="mt-4 text-sm text-[#766e65]">No clear changes in your spending pattern right now.</p>
      : <ul className="mt-4 divide-y divide-[#f0ede7]">{shifts.map((shift) => {
          const tone = shift.impact_rating === "CONCERNING" ? "concerning" : shift.impact_rating === "POSITIVE" ? "positive" : undefined;
          return <li key={`${shift.dimension}-${shift.metric_name}`} className="flex items-start gap-3 py-3">
            <span className="insights-direction mt-0.5 shrink-0" data-tone={tone}><DirectionIcon direction={shift.direction} /></span>
            <div className="min-w-0 flex-1"><p className="text-sm font-medium">{shift.metric_name}</p><p className="mt-1 break-words text-xs leading-5 text-[#766e65]">{shift.summary}</p></div>
            {tone && <span className="prototype-tag" data-tone={tone}>{tone === "concerning" ? "Concerning" : "Positive"}</span>}
          </li>;
        })}</ul>}
  </Panel>;
}

// "Suggestions": what to try next, with the evidence behind it (impact figures are deliberately not shown).
// The budget-breach suggestion is skipped: the analytics engine adds all budgets together, and the
// Budgets screen already shows the correct per-budget warning.
function Suggestions({ data }: { data: IntelligenceOverviewDTO }) {
  const recommendations = data.recommendations.filter((rec) => rec.action_type !== "BUDGET_ADJUSTMENT");
  return <Panel className="mt-4 p-5 md:p-6">
    <SectionHeading eyebrow="Suggestions" title="Things you could try" />
    {recommendations.length === 0 ? <p className="mt-4 text-sm text-[#766e65]">No suggestions right now. Keep adding statements and check back.</p>
      : <ul className="mt-4 divide-y divide-[#f0ede7]">{recommendations.map((rec) => <li key={rec.id} className="py-3">
          <p className="text-sm font-medium">{rec.title}</p>
          <p className="mt-1 break-words text-xs leading-5 text-[#766e65]">{rec.evidence}</p>
          <p className="mt-1.5 break-words text-sm leading-6 text-[#433b35]">{rec.suggested_action}</p>
        </li>)}</ul>}
  </Panel>;
}

// "Unusual transactions": statistical outliers, with a fixed plain-words explanation.
function UnusualTransactions({ data }: { data: IntelligenceOverviewDTO }) {
  return <Panel className="mt-4 p-5 md:p-6">
    <SectionHeading eyebrow="Unusual transactions" title="Payments that stand out" />
    {data.top_anomalies.length === 0 ? <p className="mt-4 text-sm text-[#766e65]">Nothing unusual found in your recorded transactions.</p>
      : <ul className="mt-4 divide-y divide-[#f0ede7]">{data.top_anomalies.map((item) => <li key={item.transaction_id} className="flex items-start justify-between gap-3 py-3">
          <div className="min-w-0"><p className="truncate text-sm font-medium">{item.merchant_name}</p><p className="mt-1 text-[11px] text-[#8a8279]">{formatDate(item.occurred_at)}</p><p className="mt-1 text-xs leading-5 text-[#766e65]">Much larger than your usual spending in this category.</p></div>
          <div className="flex shrink-0 flex-col items-end gap-1.5"><span className="text-sm font-medium tabular-nums">{money(item.amount, "INR", 2)}</span><span className="prototype-tag" data-tone={item.severity === "CRITICAL" || item.severity === "HIGH" ? "concerning" : undefined}>{item.severity.charAt(0) + item.severity.slice(1).toLowerCase()}</span></div>
        </li>)}</ul>}
  </Panel>;
}
