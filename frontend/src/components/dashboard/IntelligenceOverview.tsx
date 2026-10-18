"use client";

import React from "react";
import { formatCurrency } from "@/lib/utils";
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  PieChart,
  Layers,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Info,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import {
  useIntelligenceOverviewQuery,
} from "@/hooks/useFinancialData";

interface IntelligenceOverviewProps {
  onNavigateToCalendar?: () => void;
  onNavigateToGoals?: () => void;
  onNavigateToImport?: () => void;
}

export const IntelligenceOverview: React.FC<IntelligenceOverviewProps> = ({
  onNavigateToCalendar,
  onNavigateToGoals,
  onNavigateToImport,
}) => {
  const {
    data: overview,
    isLoading,
    isError,
    refetch,
  } = useIntelligenceOverviewQuery();

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

  if (isError || !overview) {
    return (
      <Card className="p-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-white">Unable to generate Behavioural Intelligence</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Failed to process behavioural feature store vectors and live forecast models.
        </p>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => refetch()}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Retry Pipeline
        </Button>
      </Card>
    );
  }

  const {
    liquid_balance,
    monthly_inflow,
    month_to_date_spend,
    effective_savings_rate,
    runway_days,
    behaviour_profile: scoreData,
    forecast,
    observed_shifts: shifts,
    recommendations,
    top_anomalies: anomalies,
    data_sufficiency: dataSuff,
  } = overview;

  return (
    <div className="space-y-8">
      {/* 0. Data Sufficiency Advisory (Honest Guidance) */}
      {dataSuff && dataSuff.status !== "SUFFICIENT" && (
        <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between gap-3 text-xs text-indigo-200">
          <div className="flex items-center gap-2.5">
            <Info className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              <strong>Baseline building:</strong> {dataSuff.total_transaction_count} transaction(s) recorded across {dataSuff.history_span_days} day(s). {dataSuff.guidance_message}
            </span>
          </div>
          {onNavigateToImport && (
            <Button size="sm" variant="secondary" onClick={onNavigateToImport}>
              Import Statements
            </Button>
          )}
        </div>
      )}

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
                  Financial Behaviour Intelligence
                </h1>
                <Badge variant="brand">Autonomous Pipeline</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Observed cash-flow vectors, behavioural shifts, and month-end trajectory
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-semibold">
              Financial Health Index
            </span>
            <span className="text-xl font-bold font-mono text-emerald-400">
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
              {formatCurrency(liquid_balance)}
            </p>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3 h-3" /> Safe liquid reserve
            </span>
          </Card>

          <Card className="p-4">
            <span className="text-[11px] text-slate-400 font-medium">Monthly Inflow</span>
            <p className="text-xl font-bold font-mono text-emerald-400 mt-1">
              +{formatCurrency(monthly_inflow)}
            </p>
            <span className="text-[10px] text-slate-500 mt-1 block">Salary & credits</span>
          </Card>

          <Card className="p-4">
            <span className="text-[11px] text-slate-400 font-medium">Month-to-Date Outflow</span>
            <p className="text-xl font-bold font-mono text-slate-100 mt-1">
              -{formatCurrency(month_to_date_spend)}
            </p>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Daily pace: {formatCurrency(forecast.daily_projected_rate)}/day
            </span>
          </Card>

          <Card className="p-4">
            <span className="text-[11px] text-slate-400 font-medium">Effective Savings Rate</span>
            <p className="text-xl font-bold font-mono text-indigo-300 mt-1">
              {effective_savings_rate.toFixed(1)}%
            </p>
            <span className="text-[10px] text-indigo-400 mt-1 block">Derived from live debits</span>
          </Card>

          <Card className="p-4">
            <span className="text-[11px] text-slate-400 font-medium">Runway Capacity</span>
            <p className="text-xl font-bold font-mono text-amber-300 mt-1">
              {runway_days} Days
            </p>
            <span className="text-[10px] text-slate-500 mt-1 block">
              At current daily burn rate
            </span>
          </Card>
        </div>
      </section>

      {/* ========================================================== */}
      {/* 2. WHAT CHANGED (BEHAVIOURAL SHIFTS) */}
      {/* ========================================================== */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            2. What Changed (Observed Behavioural Shifts)
          </h2>
          <span className="text-[11px] text-slate-500">Active 30d vs 60d Baseline</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {shifts && shifts.length > 0 ? (
            shifts.map((shift, idx) => (
              <Card
                key={idx}
                className={`p-4 border-l-4 ${
                  shift.impact_rating === "CONCERNING"
                    ? "border-l-amber-500 bg-amber-950/10"
                    : shift.impact_rating === "POSITIVE"
                    ? "border-l-emerald-500 bg-emerald-950/10"
                    : "border-l-slate-700 bg-slate-900/60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">{shift.metric_name}</span>
                  <Badge variant={shift.impact_rating === "CONCERNING" ? "warning" : "positive"}>
                    {shift.percentage_change > 0 ? `+${shift.percentage_change}%` : `${shift.percentage_change}%`}
                  </Badge>
                </div>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  {shift.summary}
                </p>
              </Card>
            ))
          ) : (
            <Card className="p-5 text-center col-span-3 text-slate-400 text-xs italic">
              Behavioural metrics are stable within normal standard deviation bounds across active and baseline windows.
            </Card>
          )}
        </div>
      </section>

      {/* ========================================================== */}
      {/* 3 & 4. WHAT IS LIKELY NEXT + WHY */}
      {/* ========================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* What is likely next (Forecast with Uncertainty) */}
        <Card className="p-5 space-y-4 bg-gradient-to-br from-indigo-950/30 via-slate-900 to-slate-900 border-indigo-900/40 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                3. What is Likely Next (Spending Forecast)
              </h3>
              <Badge variant={forecast.budget_risk_level === "SAFE" ? "positive" : "warning"}>
                {forecast.budget_risk_level === "SAFE" ? "Safe Trajectory" : "Pacing Risk"}
              </Badge>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Projected Month-End Spend</span>
                  <span className="text-2xl font-bold font-mono text-indigo-200">
                    {formatCurrency(forecast.expected_total_burn)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block font-medium">80% Confidence Range</span>
                  <span className="text-xs font-semibold font-mono text-slate-300">
                    {formatCurrency(forecast.lower_bound_80)} – {formatCurrency(forecast.upper_bound_80)}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>{forecast.remaining_days_in_month} days remaining in cycle</span>
                <span>Expected daily velocity: {formatCurrency(forecast.daily_projected_rate)}/day</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {forecast.status_summary}
            </p>
          </div>

          <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
            <span>Method: {forecast.methodology}</span>
            <span>Version: {forecast.model_version}</span>
          </div>
        </Card>

        {/* Why (Drivers & Ratios) */}
        <Card className="p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <PieChart className="w-4 h-4 text-slate-400" />
                4. Why (Top Drivers & Concentration)
              </h3>
              <Badge variant="neutral">
                {(scoreData.discretionary_ratio * 100).toFixed(0)}% Discretionary
              </Badge>
            </div>

            <ul className="space-y-3 text-xs text-slate-300">
              {scoreData.top_discretionary_categories.map((cat, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 mt-1 shrink-0" />
                  <div>
                    <strong className="text-white">{cat.category}:</strong> Contributes {cat.percentage.toFixed(1)}% of discretionary outflow
                    {cat.amount ? ` (${formatCurrency(cat.amount)})` : ""}.
                  </div>
                </li>
              ))}
              <li className="flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-purple-400 mt-1 shrink-0" />
                <div>
                  <strong className="text-white">Weekend Pacing:</strong> Weekend daily burn is{" "}
                  <span className="text-purple-300 font-semibold">{scoreData.weekend_velocity_multiplier.toFixed(1)}x</span> higher than weekday pacing ({(scoreData.weekend_vs_weekday_ratio * 100).toFixed(1)}% of total debit volume).
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400 mt-1 shrink-0" />
                <div>
                  <strong className="text-white">Category Concentration (HHI):</strong> Index at {scoreData.category_concentration_hhi.toFixed(3)}.
                </div>
              </li>
            </ul>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500">
            Archetype Classification: <strong className="text-slate-300">{scoreData.behavioural_archetype}</strong>
          </div>
        </Card>
      </div>

      {/* ========================================================== */}
      {/* 5. WHAT SHOULD I DO? (ACTIONABLE NUDGES) */}
      {/* ========================================================== */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-emerald-400" />
            5. What Should I Do? (Ranked Actions)
          </h2>
          <span className="text-xs text-slate-500">Evidence-Based Interventions</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendations && recommendations.length > 0 ? (
            recommendations.map((rec) => (
              <Card key={rec.id} className="p-5 flex flex-col justify-between hoverable border-slate-800">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Badge variant={rec.priority === "HIGH" ? "warning" : "brand"}>
                      {rec.priority === "HIGH" ? "High Priority" : "Optimization"}
                    </Badge>
                    {rec.financial_impact_monthly > 0 && (
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        +{formatCurrency(rec.financial_impact_monthly)}/mo
                      </span>
                    )}
                  </div>
                  
                  <h4 className="text-sm font-bold text-white">{rec.title}</h4>
                  
                  <div className="text-xs space-y-1.5 text-slate-300 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/80">
                    <p><strong className="text-slate-400">Trigger:</strong> {rec.trigger}</p>
                    <p><strong className="text-slate-400">Evidence:</strong> {rec.evidence}</p>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    {rec.suggested_action}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full"
                    onClick={() => {
                      if (rec.action_type === "WEEKEND_PACING" || rec.action_type === "BEHAVIOURAL_NUDGE") {
                        onNavigateToCalendar?.();
                      } else if (rec.action_type === "SAVINGS_TRANSFER") {
                        onNavigateToGoals?.();
                      } else if (rec.action_type === "STATEMENT_IMPORT") {
                        onNavigateToImport?.();
                      } else {
                        onNavigateToCalendar?.();
                      }
                    }}
                  >
                    {rec.action_label || "Take Action"}
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

      {/* ========================================================== */}
      {/* 6. CONTEXTUAL ANOMALIES (IF ANY FLAGGED) */}
      {/* ========================================================== */}
      {anomalies && anomalies.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            6. Material Spending Anomalies
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {anomalies.map((a, idx) => (
              <Card key={idx} className="p-4 border-l-4 border-l-rose-500 bg-rose-950/10 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{a.merchant_name}</span>
                    <Badge variant={a.severity === "CRITICAL" ? "negative" : "warning"}>
                      {a.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-300">{a.reason}</p>
                  <span className="text-[11px] text-slate-400 block pt-1">{a.action_prompt}</span>
                </div>
                <div className="text-right shrink-0 font-mono">
                  <span className="text-sm font-bold text-white">{formatCurrency(a.amount)}</span>
                  <span className="text-[10px] text-slate-500 block">{(a.confidence_score * 100).toFixed(0)}% Conf.</span>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
