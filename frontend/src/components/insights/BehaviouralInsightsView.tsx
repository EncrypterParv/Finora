"use client";

import React from "react";
import { formatCurrency } from "@/lib/utils";
import {
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  Flame,
  Brain,
  BarChart2,
  Activity,
  AlertCircle,
  RefreshCw,
  Layers,
  PieChart,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useAnomaliesData, useBehaviourScoreData } from "@/hooks/useFinancialData";

export const BehaviouralInsightsView: React.FC = () => {
  const {
    data: anomalies,
    isLoading: isAnomaliesLoading,
    isError: isAnomaliesError,
    refetch: refetchAnomalies,
  } = useAnomaliesData();

  const {
    data: scoreData,
    isLoading: isScoreLoading,
    isError: isScoreError,
    refetch: refetchScore,
  } = useBehaviourScoreData();

  const isLoading = isAnomaliesLoading || isScoreLoading;
  const isError = isAnomaliesError || isScoreError;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <LoadingSkeleton height="h-8" width="w-64" />
          <LoadingSkeleton height="h-8" width="w-32" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <LoadingSkeleton height="h-24" />
          <LoadingSkeleton height="h-24" />
          <LoadingSkeleton height="h-24" />
          <LoadingSkeleton height="h-24" />
        </div>
        <LoadingSkeleton height="h-64" />
      </div>
    );
  }

  if (isError || !scoreData) {
    return (
      <Card className="p-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-white">Unable to compute Behavioural Analytics</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Failed to process statistical anomaly detection model and feature vectors.
        </p>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            refetchAnomalies();
            refetchScore();
          }}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Retry Pipeline
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                  Behavioural Machine Learning & Feature Vectors
                </h1>
                <Badge variant="brand">Autonomous Analysis</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Deterministic feature engineering, category concentration, and statistical anomaly detection
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-semibold">
              Behaviour Archetype
            </span>
            <span className="text-base font-bold text-indigo-300">
              {scoreData.behavioural_archetype}
            </span>
          </div>
        </div>
      </div>

      {/* Feature Store Vector Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Weekend Spend Ratio
          </span>
          <p className="text-2xl font-bold font-mono text-purple-400">
            {(scoreData.weekend_vs_weekday_ratio * 100).toFixed(1)}%
          </p>
          <span className="text-[10px] text-slate-500">
            {scoreData.weekend_velocity_multiplier.toFixed(1)}x weekday velocity
          </span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Impulse Index
          </span>
          <p className="text-2xl font-bold font-mono text-amber-400">
            {scoreData.impulse_spending_index.toFixed(2)}
          </p>
          <span className="text-[10px] text-slate-500">Sub-₹1,000 discretionary</span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Savings Rate
          </span>
          <p className="text-2xl font-bold font-mono text-indigo-300">
            {scoreData.savings_rate_pct.toFixed(1)}%
          </p>
          <span className="text-[10px] text-slate-500">Effective monthly rate</span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Concentration (HHI)
          </span>
          <p className="text-2xl font-bold font-mono text-emerald-400">
            {scoreData.category_concentration_hhi.toFixed(3)}
          </p>
          <span className="text-[10px] text-slate-500">Category diversity score</span>
        </Card>
      </div>

      {/* Strengths & Vulnerabilities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-5 space-y-3 border-l-4 border-l-emerald-500">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Observed Behavioral Strengths
          </h3>
          <ul className="space-y-2 text-xs text-slate-300">
            {scoreData.strengths.map((str, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5 space-y-3 border-l-4 border-l-amber-500">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            Observed Vulnerabilities & Leaks
          </h3>
          <ul className="space-y-2 text-xs text-slate-300">
            {scoreData.vulnerabilities.map((vuln, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <span>{vuln}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Anomaly Detection Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Detected Statistical & Category Anomalies ({anomalies?.length || 0})
          </h2>
          <Badge variant="warning" size="sm">Z-Score &gt; 2.5 + Category Benchmarking</Badge>
        </div>

        <div className="space-y-3">
          {anomalies && anomalies.length > 0 ? (
            anomalies.map((anom) => (
              <Card key={anom.transaction_id} className="p-5 border-l-4 border-l-amber-500 bg-slate-900/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">{anom.merchant_name}</h4>
                    <Badge variant={anom.severity === "CRITICAL" ? "negative" : "warning"}>
                      {anom.severity}
                    </Badge>
                    <span className="text-[11px] font-mono text-slate-400">
                      {new Date(anom.occurred_at).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold font-mono text-amber-300">
                      -{formatCurrency(anom.amount)}
                    </span>
                    <span className="text-[10px] text-slate-500 block font-mono">
                      {(anom.confidence_score * 100).toFixed(0)}% Confidence
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-slate-800 leading-relaxed">
                  {anom.reason}
                </p>
                <span className="text-[11px] text-slate-400 block pt-1">
                  Action prompt: {anom.action_prompt}
                </span>
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center text-slate-500 text-xs italic">
              No statistical anomalies detected in current active period.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
