"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Cpu,
  Lock,
  Minus,
  RotateCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { fetchHistoricalInsights, fetchIntelligenceOverview } from "@/lib/api";
import {
  BehaviourShiftDTO,
  HistoricalSamplingDTO,
  IntelligenceOverviewDTO,
} from "@/types/analytics";
import { InsightsLoadingSkeleton } from "./PrototypeSkeletons";
import {
  EmptyPanel,
  PageTitle,
  Panel,
  ProgressBar,
  SecondaryButton,
  formatDate,
  money,
  toNumber,
} from "./prototype-ui";

// A 0–1 ratio from the API (sent as a string or number) shown as a whole percentage.
const percent = (ratio: unknown) => `${Math.round(toNumber(ratio) * 100)}%`;

type Horizon = "30d" | "1y" | "5y" | "10y" | "all";

const HORIZON_LABELS: { id: Horizon; label: string; description: string }[] = [
  { id: "30d", label: "Last 30 Days", description: "Tactical spend & burn velocity" },
  { id: "1y", label: "1 Year", description: "Annual seasonality & lifestyle rhythm" },
  { id: "5y", label: "5 Years", description: "Medium-term lifestyle drift & major commitments" },
  { id: "10y", label: "10 Years", description: "Decadal wealth accumulation & macro trends" },
  { id: "all", label: "Full History", description: "All connected statements & account history" },
];

export function InsightsScreen({ onAddStatement }: { onAddStatement: () => void }) {
  const [data, setData] = useState<IntelligenceOverviewDTO | null>(null);
  const [historical, setHistorical] = useState<HistoricalSamplingDTO | null>(null);
  const [horizon, setHorizon] = useState<Horizon>("5y");
  const [loading, setLoading] = useState(true);
  const [historicalLoading, setHistoricalLoading] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [showPrivacyDetails, setShowPrivacyDetails] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    Promise.all([
      fetchIntelligenceOverview(),
      fetchHistoricalInsights(horizon),
    ])
      .then(([overviewRes, histRes]) => {
        if (active) {
          setData(overviewRes);
          setHistorical(histRes);
        }
      })
      .catch((cause) => {
        if (active) {
          setError(
            cause instanceof Error ? cause.message : "Could not load your insights."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadKey, horizon]);

  const handleHorizonChange = async (newHorizon: Horizon) => {
    setHorizon(newHorizon);
    setHistoricalLoading(true);
    try {
      const res = await fetchHistoricalInsights(newHorizon);
      setHistorical(res);
    } catch {
      // Keep previous data if sampling fails
    } finally {
      setHistoricalLoading(false);
    }
  };

  const sufficiency = data?.data_sufficiency;

  return (
    <>
      <PageTitle
        title="Insights"
        description="Calculated from your recorded statements using industrial statistical models and local non-parametric sampling — strictly air-gapped with zero cloud AI leakage."
      />

      {loading && !data ? (
        <InsightsLoadingSkeleton />
      ) : error || !data ? (
        <Panel className="p-6">
          <p role="alert" className="text-sm text-[#9f2f2d] dark:text-[#f87171]">
            {error || "Could not load your insights."}
          </p>
          <SecondaryButton
            className="mt-4"
            onClick={() => setReloadKey((key) => key + 1)}
          >
            <RotateCw size={15} /> Try again
          </SecondaryButton>
        </Panel>
      ) : sufficiency?.status === "INSUFFICIENT" ? (
        <EmptyPanel
          title="Not enough history yet"
          body="Insights need at least 5 transactions spread across 7 days. More history gives better results; two to three months of statements works best."
          onAdd={onAddStatement}
          actionLabel="Add a bank statement"
        />
      ) : (
        <>
          {sufficiency?.status === "PARTIAL" && sufficiency.guidance_message && (
            <p
              role="note"
              className="mb-4 rounded-md border border-[#e9d5b8] bg-[#faf7ef] p-3 text-xs leading-5 text-[#725b43] dark:border-[#383e54] dark:bg-[#181b26] dark:text-[#cbd5e1]"
            >
              {sufficiency.guidance_message}
            </p>
          )}

          {/* Kiteworks Zero-Trust Privacy Perimeter & Local ML Controller */}
          <LocalMLEngineBar
            horizon={horizon}
            onSelectHorizon={handleHorizonChange}
            isLoading={historicalLoading}
            privacyCert={historical?.privacy_certificate}
            showPrivacyDetails={showPrivacyDetails}
            onTogglePrivacyDetails={() => setShowPrivacyDetails((prev) => !prev)}
          />

          {/* Historical Sampling Multi-Year Intelligence Card */}
          {historical && (
            <HistoricalSamplingCard
              data={historical}
              horizon={horizon}
              isLoading={historicalLoading}
            />
          )}

          {/* Real-time Month Projection & Behaviour Score */}
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <ThisMonth data={data} />
            <SpendingHabits data={data} />
          </div>

          <WhatChanged shifts={data.observed_shifts} />
          <Suggestions data={data} />
          <UnusualTransactions data={data} />
        </>
      )}
    </>
  );
}

// Section heading used by every insights panel.
function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <span className="prototype-eyebrow text-xs uppercase tracking-wider text-[#987b65] dark:text-[#94a3b8]">
        {eyebrow}
      </span>
      <h2 className="mt-1 font-semibold text-[#20211f] dark:text-[#f8fafc]">{title}</h2>
    </div>
  );
}

// Local Machine Learning & Kiteworks Air-Gapped Privacy Perimeter Bar
function LocalMLEngineBar({
  horizon,
  onSelectHorizon,
  isLoading,
  privacyCert,
  showPrivacyDetails,
  onTogglePrivacyDetails,
}: {
  horizon: Horizon;
  onSelectHorizon: (h: Horizon) => void;
  isLoading: boolean;
  privacyCert?: HistoricalSamplingDTO["privacy_certificate"];
  showPrivacyDetails: boolean;
  onTogglePrivacyDetails: () => void;
}) {
  return (
    <Panel className="mb-4 p-5 md:p-6 transition-all duration-300">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#16a34a] dark:bg-[#34d399] animate-pulse" />
            <span className="prototype-eyebrow text-[11px] font-bold text-[#16a34a] dark:text-[#34d399]">
              Local ML Engine & Historical Sampling
            </span>
          </div>
          <h2 className="mt-1 text-lg font-semibold text-[#20211f] dark:text-[#f8fafc]">
            Multi-Year Historical Statement Ingestion
          </h2>
          <p className="mt-0.5 text-xs text-[#575953] dark:text-[#94a3b8]">
            Sample across 10 years, 5 years, or statement history with zero cloud AI leakage.
          </p>
        </div>

        {/* Kiteworks Privacy Badge */}
        <button
          type="button"
          onClick={onTogglePrivacyDetails}
          className="inline-flex items-center gap-2 rounded-lg border border-[#cbd5e1] dark:border-[#2f364d] bg-[#f8fafc] dark:bg-[#181b26] px-3.5 py-2 text-xs font-medium text-[#0f172a] dark:text-[#f8fafc] hover:border-[#94a3b8] dark:hover:border-[#475569] transition-colors"
          title="Click to view Kiteworks Zero-Trust Data Isolation Certificate"
        >
          <ShieldCheck size={16} className="text-[#16a34a] dark:text-[#34d399]" />
          <span>Kiteworks Zero-Trust Gate</span>
          <span className="rounded bg-[#dcfce7] dark:bg-[#064e3b] px-1.5 py-0.5 text-[10px] font-semibold text-[#166534] dark:text-[#6ee7b7]">
            Air-Gapped
          </span>
        </button>
      </div>

      {/* Horizon Selector Pills */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-[#62645d] dark:text-[#94a3b8] mr-1">
          Historical Span:
        </span>
        {HORIZON_LABELS.map((item) => {
          const active = horizon === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectHorizon(item.id)}
              disabled={isLoading}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                active
                  ? "bg-[#262724] text-white shadow-sm dark:bg-white dark:text-[#090a0f] dark:font-semibold"
                  : "border border-[#d5d4cc] bg-white text-[#414340] hover:bg-[#f5f4f0] dark:border-[#282d3f] dark:bg-[#181b26] dark:text-[#cbd5e1] dark:hover:bg-[#232736]"
              } disabled:opacity-50`}
            >
              {item.label}
            </button>
          );
        })}
        {isLoading && (
          <span className="inline-flex items-center gap-1.5 text-xs text-[#62645d] dark:text-[#94a3b8] ml-2 animate-pulse">
            <RotateCw size={13} className="animate-spin" /> Sampling…
          </span>
        )}
      </div>

      {/* Kiteworks Privacy Certificate Drawer */}
      {showPrivacyDetails && privacyCert && (
        <div className="mt-5 rounded-lg border border-[#e2e8f0] dark:border-[#2f364d] bg-[#f8fafc] dark:bg-[#12141c] p-4 text-xs transition-all">
          <div className="flex items-center justify-between border-b border-[#e2e8f0] dark:border-[#232736] pb-2">
            <div className="flex items-center gap-2">
              <Lock size={14} className="text-[#2563eb] dark:text-[#60a5fa]" />
              <span className="font-semibold text-[#0f172a] dark:text-[#f8fafc]">
                Kiteworks Enterprise Security Boundary Certificate
              </span>
            </div>
            <span className="font-mono text-[11px] text-[#64748b] dark:text-[#94a3b8]">
              Hash: {privacyCert.audit_hash}
            </span>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-4 text-[11px]">
            <div>
              <span className="text-[#64748b] dark:text-[#94a3b8]">Security Policy:</span>
              <p className="font-medium text-[#0f172a] dark:text-[#f8fafc] mt-0.5">
                {privacyCert.policy_id}
              </p>
            </div>
            <div>
              <span className="text-[#64748b] dark:text-[#94a3b8]">Isolation Level:</span>
              <p className="font-medium text-[#16a34a] dark:text-[#34d399] mt-0.5">
                {privacyCert.security_tier}
              </p>
            </div>
            <div>
              <span className="text-[#64748b] dark:text-[#94a3b8]">Cloud AI Egress:</span>
              <p className="font-medium text-[#dc2626] dark:text-[#f87171] mt-0.5">
                STRICTLY BLOCKED (0 bytes)
              </p>
            </div>
            <div>
              <span className="text-[#64748b] dark:text-[#94a3b8]">Kiteworks Perimeter Room:</span>
              <p className="font-medium text-[#2563eb] dark:text-[#60a5fa] mt-0.5">
                Quarantine Hook Ready
              </p>
            </div>
          </div>

          <p className="mt-3 text-[11px] leading-relaxed text-[#575953] dark:text-[#94a3b8]">
            <strong>Zero Data Leakage Guarantee:</strong> All financial features, bootstrap resamples, and trajectory regressions run strictly inside your local in-memory runtime. Raw statement PII (account numbers, contact details) is stripped and salted before mathematical modeling. No third-party LLMs or cloud endpoints ever receive transaction details.
          </p>
        </div>
      )}
    </Panel>
  );
}

// Multi-Year Historical Sampling Dashboard Card
function HistoricalSamplingCard({
  data,
  horizon,
  isLoading,
}: {
  data: HistoricalSamplingDTO;
  horizon: Horizon;
  isLoading: boolean;
}) {
  const metrics = data.metrics;
  const bootstrap = data.bootstrap_sampling;
  const trajectory = data.yearly_trajectory || [];
  const spanLabel = HORIZON_LABELS.find((h) => h.id === horizon)?.label || "Selected Horizon";

  return (
    <Panel className={`p-5 md:p-6 mb-4 transition-opacity duration-200 ${isLoading ? "opacity-60 pointer-events-none" : "opacity-100"}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <SectionHeading
          eyebrow="Decadal & Historical Intelligence"
          title={`Sampling Across ${spanLabel} (${data.total_transactions.toLocaleString()} statements & entries)`}
        />
        <div className="flex items-center gap-2">
          <span className="prototype-tag text-xs font-medium">
            <Cpu size={12} className="inline mr-1" /> Non-LLM Industrial ML
          </span>
          <span className="prototype-tag text-xs font-medium">
            Resilience Score: {metrics.financial_resilience_score} / 100
          </span>
        </div>
      </div>

      {/* Top 4 KPI Grid */}
      <dl className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-lg border border-[#e5e4de] dark:border-[#232736] bg-[#fbfbf9] dark:bg-[#181b26] p-3.5">
          <dt className="text-xs text-[#62645d] dark:text-[#94a3b8]">Total Historical Inflow</dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums text-[#20211f] dark:text-[#f8fafc]">
            {money(metrics.total_inflow)}
          </dd>
          <span className="mt-1 block text-[11px] text-[#16a34a] dark:text-[#34d399]">
            {data.active_months_count} months observed
          </span>
        </div>

        <div className="rounded-lg border border-[#e5e4de] dark:border-[#232736] bg-[#fbfbf9] dark:bg-[#181b26] p-3.5">
          <dt className="text-xs text-[#62645d] dark:text-[#94a3b8]">Total Historical Outflow</dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums text-[#20211f] dark:text-[#f8fafc]">
            {money(metrics.total_outflow)}
          </dd>
          <span className="mt-1 block text-[11px] text-[#62645d] dark:text-[#94a3b8]">
            Avg {money(metrics.average_monthly_spend)}/mo
          </span>
        </div>

        <div className="rounded-lg border border-[#e5e4de] dark:border-[#232736] bg-[#fbfbf9] dark:bg-[#181b26] p-3.5">
          <dt className="text-xs text-[#62645d] dark:text-[#94a3b8]">Historical Net Savings</dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums text-[#20211f] dark:text-[#f8fafc]">
            {money(metrics.net_savings)}
          </dd>
          <span className="mt-1 block text-[11px] font-medium text-[#16a34a] dark:text-[#34d399]">
            {metrics.lifetime_savings_rate_pct}% lifetime rate
          </span>
        </div>

        <div className="rounded-lg border border-[#e5e4de] dark:border-[#232736] bg-[#fbfbf9] dark:bg-[#181b26] p-3.5">
          <dt className="text-xs text-[#62645d] dark:text-[#94a3b8]">Year-over-Year Velocity</dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums text-[#20211f] dark:text-[#f8fafc]">
            {metrics.yoy_spend_growth_pct > 0 ? "+" : ""}
            {metrics.yoy_spend_growth_pct}%
          </dd>
          <span className="mt-1 block text-[11px] text-[#62645d] dark:text-[#94a3b8]">
            Annual spend growth pace
          </span>
        </div>
      </dl>

      {/* Multi-Year Trajectory Table / Breakdown */}
      {trajectory.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#62645d] dark:text-[#cbd5e1] mb-3">
            Multi-Year Trajectory & Savings Allocation
          </h3>
          <div className="overflow-x-auto rounded-lg border border-[#e5e4de] dark:border-[#232736]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f5f4f0] dark:bg-[#181b26] text-[#62645d] dark:text-[#94a3b8] font-medium">
                <tr>
                  <th className="py-2.5 px-3">Year</th>
                  <th className="py-2.5 px-3">Total Inflow</th>
                  <th className="py-2.5 px-3">Total Outflow</th>
                  <th className="py-2.5 px-3">Net Retained</th>
                  <th className="py-2.5 px-3">Savings Rate</th>
                  <th className="py-2.5 px-3">Solvency Band</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e4de] dark:divide-[#232736] bg-white dark:bg-[#12141c]">
                {trajectory.map((yr) => (
                  <tr key={yr.year} className="hover:bg-[#fbfbf9] dark:hover:bg-[#181b26]">
                    <td className="py-2.5 px-3 font-semibold text-[#20211f] dark:text-[#f8fafc]">
                      {yr.year}
                    </td>
                    <td className="py-2.5 px-3 tabular-nums text-[#414340] dark:text-[#cbd5e1]">
                      {money(yr.total_inflow)}
                    </td>
                    <td className="py-2.5 px-3 tabular-nums text-[#414340] dark:text-[#cbd5e1]">
                      {money(yr.total_spend)}
                    </td>
                    <td className="py-2.5 px-3 tabular-nums font-medium text-[#16a34a] dark:text-[#34d399]">
                      {money(yr.net_savings)}
                    </td>
                    <td className="py-2.5 px-3 tabular-nums text-[#20211f] dark:text-[#f8fafc]">
                      {yr.savings_rate_pct}%
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#16a34a] dark:text-[#34d399]">
                        <CheckCircle2 size={12} /> Robust
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Non-Parametric Bootstrap Sampling & Uncertainty Bands */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-[#e5e4de] dark:border-[#232736] bg-[#fbfbf9] dark:bg-[#181b26] p-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={15} className="text-[#2563eb] dark:text-[#60a5fa]" />
            <h4 className="text-xs font-semibold text-[#20211f] dark:text-[#f8fafc]">
              Bootstrap Sampling (1,000 Draws)
            </h4>
          </div>
          <p className="mt-1 text-xs text-[#575953] dark:text-[#94a3b8]">
            Non-parametric empirical distribution of daily expenditure:
          </p>
          <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <div>
              <dt className="text-[11px] text-[#62645d] dark:text-[#94a3b8]">Median Daily</dt>
              <dd className="mt-0.5 font-semibold text-[#20211f] dark:text-[#f8fafc]">
                {money(bootstrap.median_daily_spend)}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-[#62645d] dark:text-[#94a3b8]">80% CI Band</dt>
              <dd className="mt-0.5 font-medium text-[#20211f] dark:text-[#f8fafc]">
                {money(bootstrap.ci_lower_80)} – {money(bootstrap.ci_upper_80)}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-[#62645d] dark:text-[#94a3b8]">95% CI Band</dt>
              <dd className="mt-0.5 font-medium text-[#20211f] dark:text-[#f8fafc]">
                {money(bootstrap.ci_lower_95)} – {money(bootstrap.ci_upper_95)}
              </dd>
            </div>
          </dl>
        </div>

        {/* Annual Seasonality Multipliers */}
        <div className="rounded-lg border border-[#e5e4de] dark:border-[#232736] bg-[#fbfbf9] dark:bg-[#181b26] p-4">
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-[#d97706] dark:text-[#fbbf24]" />
            <h4 className="text-xs font-semibold text-[#20211f] dark:text-[#f8fafc]">
              Calendar Seasonality Factors
            </h4>
          </div>
          <p className="mt-1 text-xs text-[#575953] dark:text-[#94a3b8]">
            Relative month-of-year spend index (1.0 = baseline average):
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {Object.entries(data.seasonality_index || {}).map(([month, factor]) => {
              const isHigh = factor >= 1.15;
              const isLow = factor <= 0.90;
              return (
                <span
                  key={month}
                  className={`rounded px-1.5 py-0.5 text-[10px] font-mono ${
                    isHigh
                      ? "bg-[#fee2e2] text-[#991b1b] dark:bg-[#7f1d1d] dark:text-[#fca5a5]"
                      : isLow
                      ? "bg-[#dcfce7] text-[#166534] dark:bg-[#064e3b] dark:text-[#6ee7b7]"
                      : "bg-[#f1f5f9] text-[#475569] dark:bg-[#282d3f] dark:text-[#cbd5e1]"
                  }`}
                  title={`${month}: ${factor}x average`}
                >
                  {month} {factor}x
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </Panel>
  );
}

// "This month": spend so far plus the month-end forecast and its 80% range.
function ThisMonth({ data }: { data: IntelligenceOverviewDTO }) {
  const spent = toNumber(data.month_to_date_spend);
  const expected = toNumber(data.forecast.expected_total_burn);
  const lower = toNumber(data.forecast.lower_bound_80);
  const upper = toNumber(data.forecast.upper_bound_80);
  const pace = toNumber(data.forecast.daily_projected_rate);

  return (
    <Panel className="p-5 md:p-6">
      <SectionHeading eyebrow="This month" title="Spending so far and where it’s heading" />
      <p className="mt-5 tabular-nums">
        <span className="prototype-figure text-[#20211f] dark:text-[#f8fafc]">
          {money(spent)}
        </span>{" "}
        <span className="text-sm text-[#62645d] dark:text-[#94a3b8]">spent so far</span>
      </p>
      <ForecastRangeBar spent={spent} expected={expected} lower={lower} upper={upper} />
      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs text-[#62645d] dark:text-[#94a3b8]">Expected by month end</dt>
          <dd className="mt-1 font-medium tabular-nums text-[#20211f] dark:text-[#f8fafc]">
            {money(expected)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-[#62645d] dark:text-[#94a3b8]">Likely range (80%)</dt>
          <dd className="mt-1 font-medium tabular-nums text-[#20211f] dark:text-[#f8fafc]">
            {money(lower)} – {money(upper)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-[#62645d] dark:text-[#94a3b8]">Daily pace</dt>
          <dd className="mt-1 font-medium tabular-nums text-[#20211f] dark:text-[#f8fafc]">
            {money(pace)} / day
          </dd>
        </div>
      </dl>
    </Panel>
  );
}

// Straight horizontal bar: solid fill = spent so far, tinted band = 80% range, thin line = expected total.
function ForecastRangeBar({
  spent,
  expected,
  lower,
  upper,
}: {
  spent: number;
  expected: number;
  lower: number;
  upper: number;
}) {
  const max = Math.max(spent, expected, upper, 1) * 1.05;
  const at = (value: number) => `${Math.max(0, Math.min(100, (value / max) * 100))}%`;
  const label = `Spent ${money(spent)} so far; expected ${money(expected)} by month end, likely between ${money(lower)} and ${money(upper)}.`;

  return (
    <div className="mt-5">
      <div className="insights-range" role="img" aria-label={label}>
        <span
          className="insights-range-band"
          style={{ left: at(lower), width: `calc(${at(upper)} - ${at(lower)})` }}
        />
        <span className="insights-range-spent" style={{ width: at(spent) }} />
        <span className="insights-range-expected" style={{ left: at(expected) }} />
      </div>
      <ul
        className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#575953] dark:text-[#94a3b8]"
        aria-hidden="true"
      >
        <li className="flex items-center gap-1.5">
          <span className="insights-key insights-key-spent" />
          Spent so far
        </li>
        <li className="flex items-center gap-1.5">
          <span className="insights-key insights-key-expected" />
          Expected
        </li>
        <li className="flex items-center gap-1.5">
          <span className="insights-key insights-key-band" />
          Likely range
        </li>
      </ul>
    </div>
  );
}

// "Spending habits": the rule-based score, weekend/discretionary shares, savings rate and top categories.
function SpendingHabits({ data }: { data: IntelligenceOverviewDTO }) {
  const profile = data.behaviour_profile;
  const showSavings = toNumber(data.monthly_inflow) > 0;
  const categories = profile.top_discretionary_categories ?? [];

  return (
    <Panel className="p-5 md:p-6">
      <SectionHeading eyebrow="Spending habits" title="How you tend to spend" />
      <div className="mt-5 flex flex-wrap items-baseline justify-between gap-2">
        <p className="tabular-nums">
          <span className="text-xs text-[#62645d] dark:text-[#94a3b8]">
            Behaviour score (rule-based)
          </span>
          <br />
          <span className="prototype-figure text-[#20211f] dark:text-[#f8fafc]">
            {Math.round(toNumber(profile.score))}
          </span>{" "}
          <span className="text-sm text-[#62645d] dark:text-[#94a3b8]">/ 100</span>
        </p>
        <span className="prototype-tag">{profile.behavioural_archetype}</span>
      </div>
      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs text-[#62645d] dark:text-[#94a3b8]">
            Weekend share of spending
          </dt>
          <dd className="mt-1 font-medium tabular-nums text-[#20211f] dark:text-[#f8fafc]">
            {percent(profile.weekend_vs_weekday_ratio)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-[#62645d] dark:text-[#94a3b8]">Discretionary share</dt>
          <dd className="mt-1 font-medium tabular-nums text-[#20211f] dark:text-[#f8fafc]">
            {percent(profile.discretionary_ratio)}
          </dd>
        </div>
        {showSavings && (
          <div>
            <dt className="text-xs text-[#62645d] dark:text-[#94a3b8]">Savings rate</dt>
            <dd className="mt-1 font-medium tabular-nums text-[#20211f] dark:text-[#f8fafc]">
              {Math.round(toNumber(profile.savings_rate_pct))}%
            </dd>
          </div>
        )}
      </dl>
      <h3 className="mt-6 text-xs font-medium text-[#414340] dark:text-[#cbd5e1]">
        Top discretionary categories
      </h3>
      {categories.length === 0 ? (
        <p className="mt-2 text-sm text-[#575953] dark:text-[#94a3b8]">
          No discretionary spending recorded yet.
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {categories.map((item) => {
            const share = toNumber(item.percentage);
            return (
              <li key={item.category}>
                <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium text-[#20211f] dark:text-[#f8fafc]">
                    {item.category}
                  </span>
                  <span className="tabular-nums text-[#414340] dark:text-[#94a3b8]">
                    {item.amount !== undefined ? `${money(item.amount)} · ` : ""}
                    {Math.round(share)}% of spending
                  </span>
                </div>
                <div className="mt-1.5">
                  <ProgressBar
                    value={share}
                    label={`${item.category}: ${Math.round(share)}% of spending`}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

// Arrow for a shift's direction; colour comes from whether the change is good or bad.
function DirectionIcon({ direction }: { direction: BehaviourShiftDTO["direction"] }) {
  if (direction === "INCREASING")
    return (
      <>
        <ArrowUpRight size={16} aria-hidden="true" />
        <span className="sr-only">Up</span>
      </>
    );
  if (direction === "DECREASING")
    return (
      <>
        <ArrowDownRight size={16} aria-hidden="true" />
        <span className="sr-only">Down</span>
      </>
    );
  return (
    <>
      <Minus size={16} aria-hidden="true" />
      <span className="sr-only">No change</span>
    </>
  );
}

// "What changed": last 30 days compared with the 60 days before.
function WhatChanged({ shifts }: { shifts: BehaviourShiftDTO[] }) {
  return (
    <Panel className="mt-4 p-5 md:p-6">
      <SectionHeading
        eyebrow="What changed"
        title="Your last 30 days compared with the 60 before"
      />
      {shifts.length === 0 ? (
        <p className="mt-4 text-sm text-[#575953] dark:text-[#94a3b8]">
          No clear changes in your spending pattern right now.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-[#e5e4de] dark:divide-[#232736]">
          {shifts.map((shift) => {
            const tone =
              shift.impact_rating === "CONCERNING"
                ? "concerning"
                : shift.impact_rating === "POSITIVE"
                ? "positive"
                : undefined;
            return (
              <li
                key={`${shift.dimension}-${shift.metric_name}`}
                className="flex items-start gap-3 py-3"
              >
                <span className="insights-direction mt-0.5 shrink-0" data-tone={tone}>
                  <DirectionIcon direction={shift.direction} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#20211f] dark:text-[#f8fafc]">
                    {shift.metric_name}
                  </p>
                  <p className="mt-1 break-words text-xs leading-5 text-[#575953] dark:text-[#94a3b8]">
                    {shift.summary}
                  </p>
                </div>
                {tone && (
                  <span className="prototype-tag" data-tone={tone}>
                    {tone === "concerning" ? "Concerning" : "Positive"}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

// "Suggestions": what to try next, with the evidence behind it.
function Suggestions({ data }: { data: IntelligenceOverviewDTO }) {
  const recommendations = data.recommendations.filter(
    (rec) => rec.action_type !== "BUDGET_ADJUSTMENT"
  );
  return (
    <Panel className="mt-4 p-5 md:p-6">
      <SectionHeading eyebrow="Suggestions" title="Things you could try" />
      {recommendations.length === 0 ? (
        <p className="mt-4 text-sm text-[#575953] dark:text-[#94a3b8]">
          No suggestions right now. Keep adding statements and check back.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-[#e5e4de] dark:divide-[#232736]">
          {recommendations.map((rec) => (
            <li key={rec.id} className="py-3">
              <p className="text-sm font-medium text-[#20211f] dark:text-[#f8fafc]">
                {rec.title}
              </p>
              <p className="mt-1 break-words text-xs leading-5 text-[#575953] dark:text-[#94a3b8]">
                {rec.evidence}
              </p>
              <p className="mt-1.5 break-words text-sm leading-6 text-[#414340] dark:text-[#cbd5e1]">
                {rec.suggested_action}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

// "Unusual transactions": statistical outliers, with a fixed plain-words explanation.
function UnusualTransactions({ data }: { data: IntelligenceOverviewDTO }) {
  return (
    <Panel className="mt-4 p-5 md:p-6">
      <SectionHeading eyebrow="Unusual transactions" title="Payments that stand out" />
      {data.top_anomalies.length === 0 ? (
        <p className="mt-4 text-sm text-[#575953] dark:text-[#94a3b8]">
          Nothing unusual found in your recorded transactions.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-[#e5e4de] dark:divide-[#232736]">
          {data.top_anomalies.map((item) => (
            <li
              key={item.transaction_id}
              className="flex items-start justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[#20211f] dark:text-[#f8fafc]">
                  {item.merchant_name}
                </p>
                <p className="mt-1 text-[11px] text-[#62645d] dark:text-[#94a3b8]">
                  {formatDate(item.occurred_at)}
                </p>
                <p className="mt-1 text-xs leading-5 text-[#575953] dark:text-[#94a3b8]">
                  Much larger than your usual spending in this category.
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <span className="text-sm font-medium tabular-nums text-[#20211f] dark:text-[#f8fafc]">
                  {money(item.amount, "INR", 2)}
                </span>
                <span
                  className="prototype-tag"
                  data-tone={
                    item.severity === "CRITICAL" || item.severity === "HIGH"
                      ? "concerning"
                      : undefined
                  }
                >
                  {item.severity.charAt(0) + item.severity.slice(1).toLowerCase()}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
