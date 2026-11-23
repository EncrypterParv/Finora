"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
import { fetchCalendarView } from "@/lib/api";
import { CalendarDaySummary, CalendarEventBlock, CalendarViewMode, CalendarViewResponse } from "@/types/calendar";
import { EmptyPanel, PageTitle, Panel, SecondaryButton, money, todayIso, toNumber } from "./prototype-ui";
import { CalendarLoadingSkeleton } from "./PrototypeSkeletons";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const modeLabels: Record<CalendarViewMode, string> = { month: "Month", week: "Week", day: "Day" };

// Date maths on yyyy-mm-dd strings in UTC, so a day never shifts because of the viewer's timezone.
const parse = (iso: string) => new Date(`${iso}T00:00:00Z`);
const iso = (date: Date) => date.toISOString().slice(0, 10);
const addDays = (value: string, days: number) => { const date = parse(value); date.setUTCDate(date.getUTCDate() + days); return iso(date); };
const addMonths = (value: string, months: number) => { const date = parse(value); return iso(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1))); };
const mondayIndex = (value: string) => (parse(value).getUTCDay() + 6) % 7;
const fmt = (value: string, options: Intl.DateTimeFormatOptions) => parse(value).toLocaleDateString("en-IN", { ...options, timeZone: "UTC" });
const compact = (value: number) => value >= 1000 ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", notation: "compact", maximumFractionDigits: 1 }).format(value) : money(value);

// Spending intensity (0–1 from the API) mapped to one of six warm tints; 0 means nothing spent.
function heatLevel(day: CalendarDaySummary): number {
  if (toNumber(day.total_debit) <= 0) return 0;
  return Math.min(5, 1 + Math.floor(toNumber(day.spending_intensity) * 4.999));
}

// Calendar screen: where your money went, day by day, with month / week / day views.
export function CalendarScreen({ onAddStatement }: { onAddStatement: () => void }) {
  const [mode, setMode] = useState<CalendarViewMode>("month");
  const [anchor, setAnchor] = useState(todayIso());
  const [data, setData] = useState<CalendarViewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const today = todayIso();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    const date = parse(anchor);
    const request = mode === "month"
      ? fetchCalendarView("month", date.getUTCFullYear(), date.getUTCMonth() + 1)
      : fetchCalendarView(mode, undefined, undefined, anchor);
    request
      .then((result) => { if (active) setData(result); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Could not load your calendar."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [mode, anchor, reloadKey]);

  function step(direction: -1 | 1) {
    setAnchor((current) => mode === "month" ? addMonths(current, direction) : addDays(current, direction * (mode === "week" ? 7 : 1)));
  }

  function openDay(date: string) {
    setAnchor(date);
    setMode("day");
  }

  const periodLabel = mode === "month"
    ? fmt(anchor, { month: "long", year: "numeric" })
    : mode === "week"
      ? (() => { const start = addDays(anchor, -mondayIndex(anchor)); const end = addDays(start, 6); return `${fmt(start, { day: "numeric", month: "short" })} – ${fmt(end, { day: "numeric", month: "short", year: "numeric" })}`; })()
      : fmt(anchor, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const hasRecords = (data?.days ?? []).some((day) => day.transaction_count > 0);

  return <>
    <PageTitle title="Calendar" description="See your money as it happened, day by day. Darker days are the ones where you spent more than usual." />

    {!data && loading ? <CalendarLoadingSkeleton /> : <Panel className="p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <SecondaryButton className="!px-2.5" onClick={() => step(-1)} aria-label={`Previous ${modeLabels[mode].toLowerCase()}`}><ChevronLeft size={16} /></SecondaryButton>
          <SecondaryButton className="!px-2.5" onClick={() => step(1)} aria-label={`Next ${modeLabels[mode].toLowerCase()}`}><ChevronRight size={16} /></SecondaryButton>
          <h2 className="calendar-period ml-2" aria-live="polite">{periodLabel}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SecondaryButton onClick={() => setAnchor(today)}>Today</SecondaryButton>
          <div className="prototype-segmented" role="radiogroup" aria-label="Calendar view">
            {(["month", "week", "day"] as CalendarViewMode[]).map((value) => <button key={value} type="button" role="radio" aria-checked={mode === value} onClick={() => setMode(value)}>{modeLabels[value]}</button>)}
          </div>
        </div>
      </div>

      {data && <dl className="calendar-totals mt-4">
        <div><dt>Spent</dt><dd>{money(data.total_period_debit)}</dd></div>
        <div><dt>Received</dt><dd className="text-[#477250]">{money(data.total_period_credit)}</dd></div>
        {mode !== "day" && <div><dt>Average per day</dt><dd>{money(data.average_daily_spend)}</dd></div>}
      </dl>}

      <div className={`mt-4 ${loading ? "opacity-60" : ""}`} aria-busy={loading}>
        {error ? <div role="alert" className="rounded-lg bg-[#fdebec] p-4 text-sm text-[#9f2f2d]">{error}<SecondaryButton className="ml-3" onClick={() => setReloadKey((key) => key + 1)}><RotateCw size={14} /> Try again</SecondaryButton></div>
          : !data ? <div role="status" className="py-16 text-center text-sm text-[#575953]">Your calendar could not be loaded.</div>
          : mode === "month" ? <MonthGrid data={data} today={today} onOpenDay={openDay} />
          : mode === "week" ? <WeekColumns data={data} today={today} onOpenDay={openDay} />
          : <DayDetail day={data.days[0]} />}
      </div>
      {data && mode === "month" && <div className="calendar-legend mt-4" aria-hidden="true"><span>Less spending</span>{[0, 1, 2, 3, 4, 5].map((level) => <i key={level} data-heat={level} />)}<span>More</span></div>}
    </Panel>}

    {data && !loading && !hasRecords && <div className="mt-4"><EmptyPanel title={`Nothing recorded ${mode === "day" ? "on this day" : mode === "week" ? "this week" : "in this month"}`} body="Transactions appear on the calendar once you import a statement or add them by hand. Use the arrows to look at other dates." onAdd={onAddStatement} /></div>}
  </>;
}

// Month view: one tinted square per day; tap a day to see its transactions.
function MonthGrid({ data, today, onOpenDay }: { data: CalendarViewResponse; today: string; onOpenDay: (date: string) => void }) {
  const leading = data.days.length ? mondayIndex(data.days[0].date) : 0;
  return <div className="calendar-month" role="grid" aria-label="Spending by day">
    <div className="calendar-weekdays" role="row">{WEEKDAYS.map((day) => <span key={day} role="columnheader">{day}</span>)}</div>
    <div className="calendar-cells" role="rowgroup">
      {Array.from({ length: leading }, (_, index) => <span key={`blank-${index}`} className="calendar-blank" aria-hidden="true" />)}
      {data.days.map((day) => {
        const spent = toNumber(day.total_debit);
        const future = day.date > today;
        const label = `${fmt(day.date, { weekday: "long", day: "numeric", month: "long" })}: ${day.transaction_count ? `${money(spent)} spent, ${day.transaction_count} transaction${day.transaction_count === 1 ? "" : "s"}` : "no transactions"}`;
        return <button key={day.date} type="button" role="gridcell" className="calendar-cell" data-heat={heatLevel(day)} data-today={day.date === today || undefined} data-future={future || undefined} onClick={() => onOpenDay(day.date)} aria-label={label}>
          <span className="calendar-date">{Number(day.date.slice(8))}</span>
          {spent > 0 && <span className="calendar-amount">{compact(spent)}</span>}
          {toNumber(day.total_credit) > 0 && <span className="calendar-income">+{compact(toNumber(day.total_credit))}</span>}
        </button>;
      })}
    </div>
  </div>;
}

// Week view: seven columns, each listing that day's transactions in time order.
function WeekColumns({ data, today, onOpenDay }: { data: CalendarViewResponse; today: string; onOpenDay: (date: string) => void }) {
  return <div className="calendar-week">
    {data.days.map((day) => <section key={day.date} className="calendar-week-day" data-today={day.date === today || undefined}>
      <button type="button" onClick={() => onOpenDay(day.date)} className="calendar-week-head">
        <span>{fmt(day.date, { weekday: "short" })} <strong>{Number(day.date.slice(8))}</strong></span>
        <span className="tabular-nums">{toNumber(day.total_debit) > 0 ? money(day.total_debit) : "—"}</span>
      </button>
      <div className="calendar-heat-rule" data-heat={heatLevel(day)} aria-hidden="true" />
      {day.events.length === 0 ? <p className="px-1 py-3 text-xs text-[#62645d]">No transactions</p>
        : <ul className="mt-1">{day.events.map((event) => <EventRow key={event.id} event={event} compactRow />)}</ul>}
    </section>)}
  </div>;
}

// Day view: every transaction on one date, in time order.
function DayDetail({ day }: { day?: CalendarDaySummary }) {
  const events = useMemo(() => day?.events ?? [], [day]);
  if (!day || events.length === 0) return <p className="py-10 text-center text-sm text-[#575953]">No transactions on this day.</p>;
  return <ul className="divide-y divide-[#e5e4de]">{events.map((event) => <EventRow key={event.id} event={event} />)}</ul>;
}

// One transaction line inside the calendar.
function EventRow({ event, compactRow = false }: { event: CalendarEventBlock; compactRow?: boolean }) {
  const credit = event.transaction_type === "CREDIT";
  const time = event.time_label && event.time_label !== "00:00" ? event.time_label : "";
  if (compactRow) {
    return <li className="calendar-event">
      <span className="min-w-0 truncate">{event.merchant_name}</span>
      <span className={`shrink-0 tabular-nums ${credit ? "text-[#477250]" : ""}`}>{credit ? "+" : ""}{compact(toNumber(event.amount))}</span>
    </li>;
  }
  return <li className="flex items-center gap-3 py-3">
    <span className="w-12 shrink-0 text-xs tabular-nums text-[#62645d]">{time}</span>
    <span className="calendar-swatch" style={{ background: event.category_color }} aria-hidden="true" />
    <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{event.merchant_name}</div><div className="mt-0.5 text-[11px] text-[#62645d]">{event.category_name}</div></div>
    <span className={`shrink-0 text-sm font-medium tabular-nums ${credit ? "text-[#477250]" : "text-[#414340]"}`}>{credit ? "+" : "−"}{money(event.amount, event.currency, 2)}</span>
  </li>;
}
