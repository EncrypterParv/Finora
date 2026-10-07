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
          Failed to process statistical anomaly detection model.
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
          Retry
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
                  Behavioural Machine Learning
                </h1>
                <Badge variant="brand">Isolation Forest + Features</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Feature vectors, spending entropy, weekend ratios, and statistical anomaly detection
              </p>
            </div>
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
          <span className="text-[10px] text-slate-500">Benchmark: &lt; 35%</span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Impulse Index
          </span>
          <p className="text-2xl font-bold font-mono text-amber-400">
            {scoreData.impulse_spending_index.toFixed(2)}
          </p>
          <span className="text-[10px] text-slate-500">Sub-₹500 micro-orders</span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Savings Rate
          </span>
          <p className="text-2xl font-bold font-mono text-indigo-300">
            {scoreData.savings_rate_pct.toFixed(1)}%
          </p>
          <span className="text-[10px] text-slate-500">Of total inflow</span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Runway Capacity
          </span>
          <p className="text-2xl font-bold font-mono text-emerald-400">
            {scoreData.runway_days} Days
          </p>
          <span className="text-[10px] text-slate-500">Expense buffer</span>
        </Card>
      </div>

      {/* Anomaly Detection Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Detected Statistical Anomalies ({anomalies?.length || 0})
          </h2>
          <Badge variant="warning" size="sm">Z-Score &gt; 2.5</Badge>
        </div>

        <div className="space-y-3">
          {anomalies && anomalies.length > 0 ? (
            anomalies.map((anom) => (
              <Card key={anom.id} className="p-5 border-l-4 border-l-amber-500 bg-slate-900/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">{anom.merchant}</h4>
                    <p className="text-[11px] font-mono text-slate-400">
                      {new Date(anom.occurred_at).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold font-mono text-amber-300">
                      -{formatCurrency(anom.amount)}
                    </span>
                    <span className="text-[10px] text-slate-500 block font-mono">
                      {(anom.confidence * 100).toFixed(0)}% Confidence
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-slate-800 leading-relaxed">
                  {anom.reason}
                </p>
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
