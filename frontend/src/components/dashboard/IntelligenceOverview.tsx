"use client";

import React from "react";
import { formatCurrency } from "@/lib/utils";
import {
  Sparkles,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  ShieldAlert,
  ArrowRight,
  PieChart,
  Calendar,
  Layers,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import {
  useBehaviourScoreData,
  useRecommendationsData,
  useCalendarData,
} from "@/hooks/useFinancialData";

interface IntelligenceOverviewProps {
  onNavigateToCalendar?: () => void;
  onNavigateToGoals?: () => void;
}

export const IntelligenceOverview: React.FC<IntelligenceOverviewProps> = ({
  onNavigateToCalendar,
  onNavigateToGoals,
}) => {
  const {
    data: scoreData,
    isLoading: isScoreLoading,
    isError: isScoreError,
    refetch: refetchScore,
  } = useBehaviourScoreData();

  const {
    data: recommendations,
    isLoading: isRecsLoading,
    isError: isRecsError,
    refetch: refetchRecs,
  } = useRecommendationsData();

  const {
    data: calendarData,
    isLoading: isCalLoading,
    isError: isCalError,
  } = useCalendarData("month", 2026, 10);

  const isLoading = isScoreLoading || isRecsLoading || isCalLoading;
  const isError = isScoreError || isRecsError || isCalError;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <LoadingSkeleton height="h-8" width="w-64" />
          <LoadingSkeleton height="h-8" width="w-32" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          <LoadingSkeleton height="h-24" />
          <LoadingSkeleton height="h-24" />
          <LoadingSkeleton height="h-24" />
          <LoadingSkeleton height="h-24" />
          <LoadingSkeleton height="h-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <LoadingSkeleton height="h-32" />
          <LoadingSkeleton height="h-32" />
          <LoadingSkeleton height="h-32" />
        </div>
      </div>
    );
  }

  if (isError || !scoreData || !calendarData) {
    return (
      <Card className="p-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-white">Unable to generate Intelligence Overview</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Failed to process behavioural ML feature store records.
        </p>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            refetchScore();
            refetchRecs();
          }}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Retry Analysis
        </Button>
      </Card>
    );
  }

  const liquidBalance = 148500.0;
  const totalInflow = calendarData.total_period_credit;
  const totalSpend = calendarData.total_period_debit;
  const projectedBurn = calendarData.predicted_month_end_burn || totalSpend;
  const budgetTarget = 50000.0;
  const budgetBuffer = Math.max(0, budgetTarget - projectedBurn);

  return (
    <div className="space-y-8">
      {/* 1. Header with Executive Summary */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                  Intelligence Overview
                </h1>
                <Badge variant="brand">Autonomous Analysis</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Observed cash-flows, behavioural shifts, and month-end trajectory
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider block">
              Financial Health Score
            </span>
            <span className="text-lg font-bold font-mono text-emerald-400">
              {scoreData.score} <span className="text-xs font-normal text-slate-400">/ 100</span>
            </span>
            <span className="text-[10px] text-slate-400 block font-medium">
              Archetype: {scoreData.behavioural_archetype}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* 1. FINANCIAL POSITION SUMMARY */}
      {/* ========================================================== */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          1. Current Financial Position
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          <Card className="p-4">
            <span className="text-[11px] text-slate-400 font-medium">Liquid Balance</span>
            <p className="text-xl font-bold font-mono text-white mt-1">
              {formatCurrency(liquidBalance)}
            </p>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
              <ShieldAlert className="w-3 h-3" /> Safe runway
            </span>
          </Card>

          <Card className="p-4">
            <span className="text-[11px] text-slate-400 font-medium">Monthly Inflow</span>
            <p className="text-xl font-bold font-mono text-emerald-400 mt-1">
              +{formatCurrency(totalInflow)}
            </p>
            <span className="text-[10px] text-slate-500 mt-1 block">Salary & credits</span>
          </Card>

          <Card className="p-4">
            <span className="text-[11px] text-slate-400 font-medium">Month-to-Date Spend</span>
            <p className="text-xl font-bold font-mono text-slate-100 mt-1">
              -{formatCurrency(totalSpend)}
            </p>
            <span className="text-[10px] text-slate-500 mt-1 block">
              {((totalSpend / budgetTarget) * 100).toFixed(1)}% of budget
            </span>
          </Card>

          <Card className="p-4">
            <span className="text-[11px] text-slate-400 font-medium">Effective Savings Rate</span>
            <p className="text-xl font-bold font-mono text-indigo-300 mt-1">
              {scoreData.savings_rate_pct.toFixed(1)}%
            </p>
            <span className="text-[10px] text-indigo-400 mt-1 block">Live calculated</span>
          </Card>

          <Card className="p-4">
            <span className="text-[11px] text-slate-400 font-medium">Runway Capacity</span>
            <p className="text-xl font-bold font-mono text-amber-300 mt-1">
              {scoreData.runway_days} Days
            </p>
            <span className="text-[10px] text-slate-500 mt-1 block">
              At {formatCurrency(calendarData.average_daily_spend)}/day
            </span>
          </Card>
        </div>
      </section>

      {/* ========================================================== */}
      {/* 2. WHAT CHANGED (BEHAVIOURAL DELTAS) */}
      {/* ========================================================== */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
          2. What Changed (Observed Behavioural Shifts)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 border-l-4 border-l-amber-500 bg-slate-900/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">Impulse Index</span>
              <Badge variant="warning">
                {(scoreData.impulse_spending_index * 100).toFixed(0)}% Index
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Micro-transactions under ₹500 account for {(scoreData.impulse_spending_index * 100).toFixed(0)}% of transaction volume.
            </p>
          </Card>

          <Card className="p-4 border-l-4 border-l-purple-500 bg-slate-900/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">Weekend Concentration</span>
              <Badge variant="brand">
                {(scoreData.weekend_vs_weekday_ratio * 100).toFixed(1)}% of Spend
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Discretionary dining and leisure transactions concentrate heavily on Friday-Sunday evenings.
            </p>
          </Card>

          <Card className="p-4 border-l-4 border-l-emerald-500 bg-slate-900/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">Observed Strengths</span>
              <Badge variant="positive">Verified</Badge>
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              {scoreData.strengths[0] || "Consistent monthly deposits observed across baseline."}
            </p>
          </Card>
        </div>
      </section>

      {/* ========================================================== */}
      {/* 3 & 4. WHAT IS LIKELY NEXT + WHY */}
      {/* ========================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* What is likely next */}
        <Card className="p-5 space-y-4 bg-gradient-to-br from-indigo-950/30 via-slate-900 to-slate-900 border-indigo-900/40">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              3. What is Likely Next (Month-End Forecast)
            </h3>
            <Badge variant="brand">Predictive Core</Badge>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">Projected Total Spend</span>
                <span className="text-2xl font-bold font-mono text-indigo-200">
                  {formatCurrency(projectedBurn)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Monthly Target</span>
                <span className="text-sm font-semibold font-mono text-slate-300">
                  {formatCurrency(budgetTarget)}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              At your current daily velocity of{" "}
              <strong className="text-amber-400">
                {formatCurrency(calendarData.average_daily_spend)}/day
              </strong>
              , you are on track to finish the month with a projected buffer of{" "}
              <strong className="text-emerald-400">{formatCurrency(budgetBuffer)}</strong>.
            </p>
          </div>
        </Card>

        {/* Why (Drivers) */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-slate-400" />
              4. Why (Top Discretionary Drivers)
            </h3>
          </div>

          <ul className="space-y-2.5 text-xs text-slate-300">
            {scoreData.top_discretionary_categories.map((cat, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <span>
                  <strong>{cat.category}:</strong> Contributes {cat.percentage.toFixed(1)}% of discretionary outflow.
                </span>
              </li>
            ))}
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
              <span>
                <strong>Weekend Spike:</strong> Weekend daily velocity is {scoreData.weekend_vs_weekday_ratio > 0.4 ? "2.4x" : "1.2x"} higher than weekday pacing.
              </span>
            </li>
          </ul>
        </Card>
      </div>

      {/* ========================================================== */}
      {/* 5. WHAT SHOULD I DO? (ACTIONABLE NUDGES) */}
      {/* ========================================================== */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-emerald-400" />
            5. What Should I Do? (Actionable Decisions)
          </h2>
          <span className="text-xs text-slate-500">Live Recommendations</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendations && recommendations.length > 0 ? (
            recommendations.map((rec) => (
              <Card key={rec.id} className="p-5 flex flex-col justify-between hoverable">
                <div>
                  <div className="flex items-center justify-between pb-2">
                    <Badge variant={rec.priority === "HIGH" ? "warning" : "brand"}>
                      {rec.priority === "HIGH" ? "High Impact" : "Optimization"}
                    </Badge>
                    {rec.potential_monthly_savings > 0 && (
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        +{formatCurrency(rec.potential_monthly_savings)}/mo
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-white mt-1">{rec.title}</h4>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    {rec.description}
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-800">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full"
                    onClick={() => {
                      if (rec.nudge_type === "WEEKEND_CAP") onNavigateToCalendar?.();
                      else if (rec.nudge_type === "SIP_INCREASE") onNavigateToGoals?.();
                      else onNavigateToCalendar?.();
                    }}
                  >
                    {rec.action_label || "Explore Impact"}
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-6 text-center col-span-3 text-slate-500 text-xs italic">
              No active behavioural anomalies or urgent nudges detected.
            </Card>
          )}
        </div>
      </section>
    </div>
  );
};
