"use client";

import React, { useState } from "react";
import { CalendarViewResponse, CalendarViewMode, CalendarDaySummary } from "@/types/calendar";
import { TransactionEventBlockView } from "./TransactionEventBlock";
import { formatCurrency } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Calendar as CalIcon, Flame, TrendingDown, RefreshCw } from "lucide-react";

interface CalendarViewProps {
  calendarData: CalendarViewResponse;
  onSelectTransaction?: (id: string) => void;
  onSyncBank?: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  calendarData,
  onSelectTransaction,
  onSyncBank,
}) => {
  const [viewMode, setViewMode] = useState<CalendarViewMode>(calendarData.mode || "month");

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <CalIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                Financial Calendar
              </h1>
              <p className="text-xs text-slate-400">
                Temporal Money Flow & Daily Behavioural Density
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-lg">
            {(["day", "week", "month"] as CalendarViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 text-xs font-semibold rounded-md capitalize transition ${
                  viewMode === mode
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <button
            onClick={onSyncBank}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sync Bank Stream
          </button>
        </div>
      </div>

      {/* Overview Analytics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Outflow</p>
          <p className="text-xl font-bold font-mono text-slate-100 mt-1">
            {formatCurrency(calendarData.total_period_debit)}
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Inflow</p>
          <p className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {formatCurrency(calendarData.total_period_credit)}
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Daily Avg Burn</p>
          <p className="text-xl font-bold font-mono text-amber-400 mt-1">
            {formatCurrency(calendarData.average_daily_spend)}
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Projected Month-End</p>
          <p className="text-xl font-bold font-mono text-indigo-300 mt-1">
            {formatCurrency(calendarData.predicted_month_end_burn || calendarData.total_period_debit)}
          </p>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {calendarData.days.map((daySummary: CalendarDaySummary) => (
          <div
            key={daySummary.date}
            className={`min-h-[140px] rounded-xl border p-3 flex flex-col justify-between transition-all ${
              daySummary.is_projected
                ? "bg-slate-950/40 border-dashed border-slate-800/80 opacity-60"
                : "bg-slate-900/70 border-slate-800/80 hover:border-slate-700"
            }`}
          >
            {/* Day Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/40">
              <span className="text-xs font-semibold text-slate-300">
                {daySummary.date_label}
              </span>
              {daySummary.total_debit > 0 && (
                <span className="text-[11px] font-mono font-medium text-slate-400">
                  -{formatCurrency(daySummary.total_debit)}
                </span>
              )}
            </div>

            {/* Events in Day */}
            <div className="flex-1 my-2 overflow-y-auto max-h-48 space-y-1 pr-0.5">
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
    </div>
  );
};
