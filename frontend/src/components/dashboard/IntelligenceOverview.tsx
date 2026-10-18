"use client";

import React from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  Check,
  Info,
  Lightbulb,
  PieChart,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IntelligenceOverviewSkeleton } from "@/components/dashboard/IntelligenceOverviewSkeleton";
import { useIntelligenceOverviewQuery } from "@/hooks/useFinancialData";

interface IntelligenceOverviewProps {
  onNavigateToCalendar?: () => void;
  onNavigateToGoals?: () => void;
  onNavigateToImport?: () => void;
}

const changeLabel = (change: number) => (change > 0 ? `+${change}%` : `${change}%`);

export const IntelligenceOverview: React.FC<IntelligenceOverviewProps> = ({
  onNavigateToCalendar,
  onNavigateToGoals,
  onNavigateToImport,
}) => {
  const { data: overview, isLoading, isError, refetch } = useIntelligenceOverviewQuery();

  if (isLoading && !overview) {
    return <IntelligenceOverviewSkeleton />;
  }

  if (isError || !overview) {
    return (
      <Card className="mx-auto max-w-xl p-12 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#faeeee] text-[#a04646]">
          <AlertCircle className="h-5 w-5" />
        </div>
        <h3 className="mt-5 text-lg font-semibold tracking-[-0.02em] text-[#1c2024]">
          Your overview could not load
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#596168]">
          Finora could not reach the intelligence service. Your data is unchanged; try again when you are ready.
        </p>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => refetch()}
          icon={<RefreshCw className="h-3.5 w-3.5" />}
          className="mt-6"
        >
          Try again
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

  const navigateForRecommendation = (actionType: string) => {
    if (actionType === "WEEKEND_PACING" || actionType === "BEHAVIOURAL_NUDGE") {
      onNavigateToCalendar?.();
    } else if (actionType === "SAVINGS_TRANSFER") {
      onNavigateToGoals?.();
    } else if (actionType === "STATEMENT_IMPORT") {
      onNavigateToImport?.();
    } else {
      onNavigateToCalendar?.();
    }
  };

  return (
    <div className="space-y-10">
      {dataSuff && dataSuff.status !== "SUFFICIENT" && (
        <div className="flex flex-col gap-4 border border-[#d7dcff] bg-[#eef0ff] px-4 py-3.5 text-sm text-[#3546A8] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              <strong className="font-semibold">Building your baseline.</strong> {dataSuff.total_transaction_count} transaction(s) across {dataSuff.history_span_days} day(s). {dataSuff.guidance_message}
            </span>
          </div>
          {onNavigateToImport && (
            <Button size="sm" variant="outline" onClick={onNavigateToImport} className="shrink-0 border-[#bfc6f5]">
              Import statements
            </Button>
          )}
        </div>
      )}

      <header className="flex flex-col justify-between gap-6 border-b border-[#dfe1dc] pb-8 lg:flex-row lg:items-end">
        <div>
          <h1 className="max-w-2xl text-3xl font-semibold tracking-[-0.04em] text-[#1c2024] md:text-4xl">
            A clearer view of your financial position.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#596168] md:text-base">
            Liquidity, behaviour, and month-end pace in one measured view.
          </p>
        </div>
        <div className="flex items-end gap-4 lg:pb-1">
          <div className="text-right">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7a838a]">
              Behaviour score
            </span>
            <span className="finora-data mt-1 block text-3xl font-semibold text-[#3546A8]">
              {scoreData.score}<span className="ml-1 text-sm font-normal tracking-normal text-[#7a838a]">/ 100</span>
            </span>
            <span className="mt-1 block text-xs text-[#596168]">{scoreData.behavioural_archetype}</span>
          </div>
        </div>
      </header>

      <section aria-labelledby="position-heading" className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 id="position-heading" className="text-lg font-semibold tracking-[-0.025em] text-[#1c2024]">
            Current position
          </h2>
          <span className="hidden text-xs text-[#7a838a] sm:block">Updated from your latest transactions</span>
        </div>

        <div className="grid grid-cols-1 gap-px overflow-hidden border border-[#e3e4df] bg-[#e3e4df] sm:grid-cols-2 xl:grid-cols-[1.35fr_repeat(4,minmax(0,1fr))]">
          <div className="bg-white p-5">
            <span className="text-xs font-medium text-[#596168]">Liquid balance</span>
            <p className="finora-data mt-3 text-3xl font-semibold tracking-[-0.06em] text-[#1c2024]">
              {formatCurrency(liquid_balance)}
            </p>
            <span className="mt-3 flex items-center gap-1.5 text-xs text-[#2f6b45]">
              <Check className="h-3.5 w-3.5" /> Healthy liquid reserve
            </span>
          </div>
          <div className="bg-white p-5">
            <span className="text-xs font-medium text-[#596168]">Monthly inflow</span>
            <p className="finora-data mt-3 text-xl font-semibold text-[#2f6b45]">+{formatCurrency(monthly_inflow)}</p>
            <span className="mt-3 block text-xs text-[#7a838a]">Salary and credits</span>
          </div>
          <div className="bg-white p-5">
            <span className="text-xs font-medium text-[#596168]">Month-to-date outflow</span>
            <p className="finora-data mt-3 text-xl font-semibold text-[#1c2024]">-{formatCurrency(month_to_date_spend)}</p>
            <span className="mt-3 block text-xs text-[#7a838a]">{formatCurrency(forecast.daily_projected_rate)}/day pace</span>
          </div>
          <div className="bg-white p-5">
            <span className="text-xs font-medium text-[#596168]">Effective savings rate</span>
            <p className="finora-data mt-3 text-xl font-semibold text-[#3546A8]">{effective_savings_rate.toFixed(1)}%</p>
            <span className="mt-3 block text-xs text-[#7a838a]">From live debits</span>
          </div>
          <div className="bg-white p-5">
            <span className="text-xs font-medium text-[#596168]">Runway capacity</span>
            <p className="finora-data mt-3 text-xl font-semibold text-[#8a641e]">{runway_days} days</p>
            <span className="mt-3 block text-xs text-[#7a838a]">At current burn rate</span>
          </div>
        </div>
      </section>

      <section aria-labelledby="shifts-heading" className="space-y-4">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <h2 id="shifts-heading" className="text-lg font-semibold tracking-[-0.025em] text-[#1c2024]">Recent behaviour</h2>
            <p className="mt-1 text-sm text-[#596168]">What changed against your historical baseline.</p>
          </div>
          <span className="text-xs text-[#7a838a]">Active 30d vs 60d baseline</span>
        </div>

        <div className="divide-y divide-[#e3e4df] border-y border-[#e3e4df] bg-white">
          {shifts && shifts.length > 0 ? shifts.map((shift) => (
            <article key={`${shift.dimension}-${shift.metric_name}`} className="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(180px,0.8fr)_minmax(0,2fr)_auto] sm:items-center sm:px-5">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${shift.impact_rating === "CONCERNING" ? "bg-[#c7852c]" : shift.impact_rating === "POSITIVE" ? "bg-[#4f8a62]" : "bg-[#9ba3a8]"}`} />
                <span className="text-sm font-semibold text-[#1c2024]">{shift.metric_name}</span>
              </div>
              <p className="text-sm leading-6 text-[#596168]">{shift.summary}</p>
              <Badge variant={shift.impact_rating === "CONCERNING" ? "warning" : shift.impact_rating === "POSITIVE" ? "positive" : "neutral"}>
                {changeLabel(shift.percentage_change)}
              </Badge>
            </article>
          )) : (
            <div className="px-5 py-8 text-sm text-[#596168]">No meaningful behavioural shifts detected in the current comparison window.</div>
          )}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section aria-labelledby="forecast-heading" className="border border-[#d7dcff] bg-[#f0f2ff] p-6 md:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="forecast-heading" className="text-lg font-semibold tracking-[-0.025em] text-[#1c2024]">Month-end outlook</h2>
              <p className="mt-1 text-sm text-[#596168]">A measured projection from your current spending velocity.</p>
            </div>
            <Badge variant={forecast.budget_risk_level === "SAFE" ? "positive" : "warning"}>
              {forecast.budget_risk_level === "SAFE" ? "On track" : "Pacing risk"}
            </Badge>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div>
              <span className="text-xs font-medium text-[#596168]">Projected month-end spend</span>
              <p className="finora-data mt-2 text-3xl font-semibold tracking-[-0.05em] text-[#1c2024]">{formatCurrency(forecast.expected_total_burn)}</p>
            </div>
            <div className="sm:text-right">
              <span className="text-xs font-medium text-[#596168]">{forecast.confidence_level_pct}% confidence range</span>
              <p className="finora-data mt-2 text-sm font-semibold text-[#3546A8]">{formatCurrency(forecast.lower_bound_80)} – {formatCurrency(forecast.upper_bound_80)}</p>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-[#d7dcff] pt-4 text-xs text-[#596168]">
            <span>{forecast.remaining_days_in_month} days remaining</span>
            <span className="finora-data">{formatCurrency(forecast.daily_projected_rate)}/day expected pace</span>
          </div>
          <p className="mt-5 text-sm leading-6 text-[#596168]">{forecast.status_summary}</p>
        </section>

        <section aria-labelledby="drivers-heading" className="border border-[#e3e4df] bg-white p-6 md:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="drivers-heading" className="text-lg font-semibold tracking-[-0.025em] text-[#1c2024]">Spending drivers</h2>
              <p className="mt-1 text-sm text-[#596168]">The categories shaping your current pattern.</p>
            </div>
            <PieChart className="h-5 w-5 text-[#7a838a]" />
          </div>

          <div className="mt-6 space-y-4">
            {scoreData.top_discretionary_categories.slice(0, 3).map((category) => (
              <div key={category.category}>
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="font-medium text-[#1c2024]">{category.category}</span>
                  <span className="finora-data text-xs text-[#596168]">{category.percentage.toFixed(1)}%</span>
                </div>
                <div className="mt-2 h-1.5 bg-[#f1f0eb]">
                  <div className="h-full bg-[#3546A8]" style={{ width: `${Math.min(100, category.percentage)}%` }} />
                </div>
                <div className="mt-1 text-xs text-[#7a838a]">{category.amount ? formatCurrency(category.amount) : "No amount recorded"}</div>
              </div>
            ))}
            <div className="border-t border-[#e3e4df] pt-4 text-sm leading-6 text-[#596168]">
              Weekend burn is <strong className="font-semibold text-[#1c2024]">{scoreData.weekend_velocity_multiplier.toFixed(1)}x</strong> weekday pacing, with a category concentration index of <strong className="finora-data font-semibold text-[#1c2024]">{scoreData.category_concentration_hhi.toFixed(3)}</strong>.
            </div>
          </div>
        </section>
      </div>

      <section aria-labelledby="actions-heading" className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="actions-heading" className="text-lg font-semibold tracking-[-0.025em] text-[#1c2024]">Suggested actions</h2>
            <p className="mt-1 text-sm text-[#596168]">Small, evidence-based moves that can improve your month.</p>
          </div>
          <Lightbulb className="h-5 w-5 text-[#8a641e]" />
        </div>

        <div className="grid gap-px overflow-hidden border border-[#e3e4df] bg-[#e3e4df] md:grid-cols-3">
          {recommendations && recommendations.length > 0 ? recommendations.slice(0, 3).map((recommendation) => (
            <article key={recommendation.id} className="flex flex-col justify-between bg-white p-5">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <Badge variant={recommendation.priority === "HIGH" ? "warning" : "brand"}>
                    {recommendation.priority === "HIGH" ? "Priority" : "Opportunity"}
                  </Badge>
                  {recommendation.financial_impact_monthly > 0 && (
                    <span className="finora-data text-xs font-semibold text-[#2f6b45]">+{formatCurrency(recommendation.financial_impact_monthly)}/mo</span>
                  )}
                </div>
                <h3 className="mt-4 text-sm font-semibold leading-5 text-[#1c2024]">{recommendation.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#596168]">{recommendation.suggested_action}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => navigateForRecommendation(recommendation.action_type)} className="mt-6 w-full justify-between">
                {recommendation.action_label || "Review action"}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </article>
          )) : (
            <div className="bg-white px-5 py-8 text-sm text-[#596168] md:col-span-3">No active recommendations right now. Finora will surface one when your behaviour changes enough to support a useful action.</div>
          )}
        </div>
      </section>

      {anomalies && anomalies.length > 0 && (
        <section aria-labelledby="anomalies-heading" className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 id="anomalies-heading" className="text-lg font-semibold tracking-[-0.025em] text-[#1c2024]">Transactions worth a closer look</h2>
              <p className="mt-1 text-sm text-[#596168]">Material outliers identified against your category baselines.</p>
            </div>
            <TrendingUp className="h-5 w-5 text-[#a04646]" />
          </div>
          <div className="divide-y divide-[#e3e4df] border-y border-[#e3e4df] bg-white">
            {anomalies.map((anomaly) => (
              <article key={anomaly.transaction_id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#a04646]" />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-[#1c2024]">{anomaly.merchant_name}</h3>
                      <Badge variant={anomaly.severity === "CRITICAL" ? "negative" : "warning"}>{anomaly.severity}</Badge>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-[#596168]">{anomaly.reason}</p>
                  </div>
                </div>
                <span className="finora-data shrink-0 text-sm font-semibold text-[#1c2024]">{formatCurrency(anomaly.amount)}</span>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
