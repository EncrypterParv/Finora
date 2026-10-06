"use client";

import React, { useState } from "react";
import { CalendarViewResponse, CalendarViewMode, CalendarDaySummary } from "@/types/calendar";
import { TransactionEventBlockView } from "./TransactionEventBlock";
import { formatCurrency } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalIcon,
  Flame,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingDown,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

interface CalendarViewProps {
  calendarData: CalendarViewResponse;
  onSelectTransaction?: (id: string) => void;
  onSyncBank?: () => void;
  isSyncing?: boolean;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  calendarData,
  onSelectTransaction,
  onSyncBank,
  isSyncing,
}) => {
  const [viewMode, setViewMode] = useState<CalendarViewMode>(calendarData.mode || "month");
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);

  const activeDay = calendarData.days[selectedDayIndex] || calendarData.days[0];

  return (
    <div className="space-y-6">
      {/* Calendar Header & Perspective Switcher */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 shadow-sm">
              <CalIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                  Financial Calendar
                </h1>
                <Badge variant="brand" size="sm">Signature View</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Temporal money flow, recurring rhythms, and daily burn intensity
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Tabs (Day, Week, Month) */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <Tabs<CalendarViewMode>
            options={[
              { id: "day", label: "Day View", icon: <Clock className="w-3.5 h-3.5" /> },
              { id: "week", label: "Week View" },
              { id: "month", label: "Month View" },
            ]}
            activeId={viewMode}
            onChange={setViewMode}
            size="sm"
          />
        </div>
      </div>

      {/* Financial Health & Prediction Ticker */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <Card className="p-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Total Outflow
          </span>
          <p className="text-xl md:text-2xl font-bold font-mono text-slate-100 mt-1">
            -{formatCurrency(calendarData.total_period_debit)}
          </p>
          <span className="text-[10px] text-slate-500 mt-1 block">Debited across period</span>
        </Card>

        <Card className="p-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Total Inflow
          </span>
          <p className="text-xl md:text-2xl font-bold font-mono text-emerald-400 mt-1">
            +{formatCurrency(calendarData.total_period_credit)}
          </p>
          <span className="text-[10px] text-emerald-500/80 mt-1 block">Payroll & credits</span>
        </Card>

        <Card className="p-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Daily Burn Velocity
          </span>
          <p className="text-xl md:text-2xl font-bold font-mono text-amber-400 mt-1">
            {formatCurrency(calendarData.average_daily_spend)}
            <span className="text-xs font-normal text-slate-400">/day</span>
          </p>
          <span className="text-[10px] text-slate-500 mt-1 block">Average daily pacing</span>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border-indigo-900/40">
          <span className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            Projected Month-End
          </span>
          <p className="text-xl md:text-2xl font-bold font-mono text-indigo-200 mt-1">
            {formatCurrency(calendarData.predicted_month_end_burn || calendarData.total_period_debit)}
          </p>
          <span className="text-[10px] text-indigo-400/80 mt-1 block">At current burn rate</span>
        </Card>
      </div>

      {/* ========================================================== */}
      {/* 1. DAY VIEW MODE */}
      {/* ========================================================== */}
      {viewMode === "day" && (
        <div className="space-y-4">
          {/* Day Selector Ribbon */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {calendarData.days.slice(0, 14).map((d, idx) => (
              <button
                key={d.date}
                onClick={() => setSelectedDayIndex(idx)}
                className={`px-3.5 py-2 rounded-xl text-left border shrink-0 transition ${
                  selectedDayIndex === idx
                    ? "bg-indigo-600 border-indigo-500 text-white shadow-md"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                }`}
              >
                <p className="text-[10px] uppercase font-semibold opacity-80">{d.date_label.split(",")[0]}</p>
                <p className="text-xs font-bold font-mono">{d.date_label.split(",")[1]}</p>
                <p className="text-[10px] font-mono mt-0.5 opacity-90">
                  {d.total_debit > 0 ? `-${formatCurrency(d.total_debit)}` : "₹0"}
                </p>
              </button>
            ))}
          </div>

          {/* Timeline Surface */}
          <Card className="p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">{activeDay.date_label}</h3>
                <p className="text-xs text-slate-400">
                  {activeDay.transaction_count} transaction{activeDay.transaction_count !== 1 ? "s" : ""} · Net Flow:{" "}
                  <span className={activeDay.net_flow >= 0 ? "text-emerald-400" : "text-slate-200"}>
                    {activeDay.net_flow >= 0 ? "+" : ""}
                    {formatCurrency(activeDay.net_flow)}
                  </span>
                </p>
              </div>

              {activeDay.spending_intensity > 0.6 && (
                <Badge variant="warning" icon={<Flame className="w-3 h-3" />}>
                  High Burn Day
                </Badge>
              )}
            </div>

            {/* Hour-by-hour transaction list */}
            <div className="mt-6 space-y-3">
              {activeDay.events.length > 0 ? (
                activeDay.events.map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => onSelectTransaction?.(ev.id)}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                        {ev.time_label}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-100">{ev.merchant_name}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: ev.category_color }}
                          />
                          {ev.category_name}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p
                        className={`text-sm font-bold font-mono ${
                          ev.transaction_type === "DEBIT" ? "text-slate-100" : "text-emerald-400"
                        }`}
                      >
                        {ev.transaction_type === "DEBIT" ? "-" : "+"}
                        {formatCurrency(ev.amount, ev.currency)}
                      </p>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                        Settled
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs italic">
                  No recorded transactions for this date.
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================== */}
      {/* 2. WEEK VIEW MODE */}
      {/* ========================================================== */}
      {viewMode === "week" && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {calendarData.days.slice(0, 7).map((daySummary) => (
            <div
              key={daySummary.date}
              className="min-h-[360px] rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80">
                  <div>
                    <p className="text-[11px] font-bold text-slate-200">{daySummary.date_label.split(",")[0]}</p>
                    <p className="text-[10px] text-slate-500">{daySummary.date_label.split(",")[1]}</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-200">
                    {daySummary.total_debit > 0 ? `-${formatCurrency(daySummary.total_debit)}` : "₹0"}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 overflow-y-auto max-h-[260px] pr-0.5">
                  {daySummary.events.map((event) => (
                    <TransactionEventBlockView
                      key={event.id}
                      event={event}
                      onClick={onSelectTransaction}
                    />
                  ))}
                  {daySummary.events.length === 0 && (
                    <p className="text-[11px] text-slate-600 text-center py-8 italic">No spend</p>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/60 text-[10px] text-slate-500 flex justify-between">
                <span>{daySummary.transaction_count} tx</span>
                {daySummary.spending_intensity > 0.6 && (
                  <span className="text-amber-400 font-semibold flex items-center gap-0.5">
                    <Flame className="w-3 h-3" /> Spike
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================== */}
      {/* 3. MONTH VIEW MODE */}
      {/* ========================================================== */}
      {viewMode === "month" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {calendarData.days.map((daySummary: CalendarDaySummary) => (
            <div
              key={daySummary.date}
              className={`min-h-[145px] rounded-xl border p-3 flex flex-col justify-between transition-all ${
                daySummary.is_projected
                  ? "bg-slate-950/40 border-dashed border-slate-800/80 opacity-60"
                  : "bg-slate-900/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/90"
              }`}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/40">
                <span className="text-xs font-semibold text-slate-300">
                  {daySummary.date_label}
                </span>
                {daySummary.total_debit > 0 && (
                  <span className="text-[11px] font-mono font-medium text-slate-300">
                    -{formatCurrency(daySummary.total_debit)}
                  </span>
                )}
              </div>

              {/* Events in Day */}
              <div className="flex-1 my-2 overflow-y-auto max-h-36 space-y-1 pr-0.5">
                {daySummary.events.map((event) => (
                  <TransactionEventBlockView
                    key={event.id}
                    event={event}
                    onClick={onSelectTransaction}
                  />
                ))}

                {daySummary.events.length === 0 && (
                  <div className="h-full flex items-center justify-center py-4">
                    <p className="text-[11px] text-slate-600 italic">No activity</p>
                  </div>
                )}
              </div>

              {/* Daily Indicator Footer */}
              <div className="pt-2 border-t border-slate-800/40 flex items-center justify-between text-[10px] text-slate-500">
                <span>{daySummary.transaction_count} tx</span>
                {daySummary.spending_intensity > 0.6 && (
                  <span className="flex items-center gap-1 text-amber-500 font-medium">
                    <Flame className="w-3 h-3" /> Peak Burn
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
