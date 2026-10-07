"use client";

import React, { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import {
  Target,
  TrendingUp,
  Sparkles,
  Plus,
  Calendar,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useGoalsData, useCreateGoalMutation } from "@/hooks/useFinancialData";

export const GoalsView: React.FC = () => {
  const { data: goals, isLoading, isError, refetch } = useGoalsData();
  const createGoalMutation = useCreateGoalMutation();

  const [additionalMonthlySavings, setAdditionalMonthlySavings] = useState<number>(5000);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState<boolean>(false);
  const [goalTitle, setGoalTitle] = useState<string>("Emergency Corpus 6-Month");
  const [goalTarget, setGoalTarget] = useState<number>(600000);
  const [goalSaved, setGoalSaved] = useState<number>(150000);
  const [goalSIP, setGoalSIP] = useState<number>(15000);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <LoadingSkeleton height="h-8" width="w-64" />
          <LoadingSkeleton height="h-8" width="w-32" />
        </div>
        <LoadingSkeleton height="h-80" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="p-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-white">Unable to load Financial Goals</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Failed to fetch FIRE and milestone projections.
        </p>
        <Button size="sm" variant="secondary" onClick={() => refetch()} icon={<RefreshCw className="w-3.5 h-3.5" />}>
          Retry
        </Button>
      </Card>
    );
  }

  const primaryGoal = goals && goals.length > 0 ? goals[0] : null;

  // Primary Goal calculations
  const currentCorpus = primaryGoal ? primaryGoal.current_saved : 420000;
  const targetCorpus = primaryGoal ? primaryGoal.target_amount : 2500000;
  const baseMonthlySIP = primaryGoal ? primaryGoal.monthly_contribution : 18000;
  const expectedReturnPct = primaryGoal ? primaryGoal.expected_annual_return_pct : 12.0;

  // Compound projection estimation
  const monthsSaved = Math.round((additionalMonthlySavings / (baseMonthlySIP + additionalMonthlySavings)) * 48);
  const baseYears = 7.2;
  const projectedYears = Math.max(1.5, baseYears - monthsSaved / 12).toFixed(1);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    await createGoalMutation.mutateAsync({
      title: goalTitle,
      goal_type: "SAVINGS",
      target_amount: Number(goalTarget),
      current_saved: Number(goalSaved),
      monthly_contribution: Number(goalSIP),
      target_date: "2028-12-31",
      expected_annual_return_pct: 10.0,
    });
    setIsGoalModalOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                  Financial Independence & Goals
                </h1>
                <Badge variant="brand">FIRE Engine</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Connecting daily spending habits directly to long-term wealth milestones
              </p>
            </div>
          </div>
        </div>

        <Button
          size="sm"
          variant="primary"
          onClick={() => setIsGoalModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          New Milestone Goal
        </Button>
      </div>

      {/* Primary Goal Spotlight Card */}
      <Card className="p-6 md:p-8 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border-indigo-900/40 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Badge variant="brand" size="sm" className="mb-2">
              Primary Goal · {primaryGoal?.goal_type || "Retirement & Independence"}
            </Badge>
            <h2 className="text-xl md:text-2xl font-bold text-white">
              {primaryGoal?.title || "Financial Independence (FIRE)"}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Freedom from active wage dependency at {expectedReturnPct}% annual diversified equity growth
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block">Projected Completion</span>
            <span className="text-xl md:text-2xl font-bold font-mono text-indigo-300">
              {primaryGoal?.projected_completion_date || "October 2033"}
            </span>
            <span className="text-[10px] text-emerald-400 font-medium block mt-0.5">
              {primaryGoal?.is_on_track ? "✓ On Track" : "Action Needed"}
            </span>
          </div>
        </div>

        {/* Corpus Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 block font-medium">Current Accumulated</span>
            <span className="text-lg font-bold font-mono text-white mt-1 block">
              {formatCurrency(currentCorpus)}
            </span>
            <span className="text-[10px] text-slate-500">
              {((currentCorpus / targetCorpus) * 100).toFixed(1)}% of target
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 block font-medium">Target Corpus</span>
            <span className="text-lg font-bold font-mono text-white mt-1 block">
              {formatCurrency(targetCorpus)}
            </span>
            <span className="text-[10px] text-slate-500">25x annual expenses</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 block font-medium">Monthly SIP</span>
            <span className="text-lg font-bold font-mono text-emerald-400 mt-1 block">
              {formatCurrency(baseMonthlySIP)}
            </span>
            <span className="text-[10px] text-emerald-500/80">Active automatic transfer</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 block font-medium">Expected Annual Yield</span>
            <span className="text-lg font-bold font-mono text-indigo-300 mt-1 block">
              {expectedReturnPct}% p.a.
            </span>
            <span className="text-[10px] text-slate-500">Nifty 50 Index Baseline</span>
          </div>
        </div>

        {/* Dynamic Scenario Exploration Slider */}
        <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs md:text-sm font-bold text-white">
                Scenario Simulator: What if I save / invest more each month?
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
              +{formatCurrency(additionalMonthlySavings)} / month
            </span>
          </div>

          {/* Range input */}
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max="25000"
              step="1000"
              value={additionalMonthlySavings}
              onChange={(e) => setAdditionalMonthlySavings(Number(e.target.value))}
              aria-label="Additional monthly savings slider"
              className="w-full accent-indigo-500 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500"
            />
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>₹0</span>
              <span>+₹10,000</span>
              <span>+₹25,000</span>
            </div>
          </div>

          {/* Dynamic Simulation Result Statement */}
          <div className="p-3 bg-indigo-950/30 rounded-lg border border-indigo-900/40 text-xs text-slate-300 flex items-center justify-between">
            <span>
              By investing an extra <strong>{formatCurrency(additionalMonthlySavings)}</strong>/month, you achieve FIRE{" "}
              <strong className="text-emerald-400">{monthsSaved} months sooner</strong> (in ~{projectedYears} years).
            </span>
            <span className="text-indigo-400 text-[11px] font-mono font-semibold hidden sm:inline">
              Compounding Active
            </span>
          </div>
        </div>
      </Card>

      {/* Additional Milestone Goals List */}
      {goals && goals.length > 1 && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Other Financial Goals ({goals.length - 1})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.slice(1).map((g) => (
              <Card key={g.id} className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">{g.title}</h4>
                  <Badge variant="neutral" size="sm">{g.goal_type}</Badge>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300">{formatCurrency(g.current_saved)}</span>
                  <span className="text-slate-500">Target: {formatCurrency(g.target_amount)}</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${Math.min(100, (g.current_saved / g.target_amount) * 100)}%` }}
                  />
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Goal Creation Modal Dialog */}
      {isGoalModalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-label="New Milestone Goal"
        >
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Create New Milestone Goal</h3>
              <button
                onClick={() => setIsGoalModalOpen(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">
                  Goal Title
                </label>
                <input
                  type="text"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">
                    Target Corpus (₹)
                  </label>
                  <input
                    type="number"
                    min="10000"
                    step="10000"
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">
                    Current Saved (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={goalSaved}
                    onChange={(e) => setGoalSaved(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">
                  Monthly Contribution / SIP (₹)
                </label>
                <input
                  type="number"
                  min="500"
                  step="500"
                  value={goalSIP}
                  onChange={(e) => setGoalSIP(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="subtle"
                  size="sm"
                  onClick={() => setIsGoalModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={createGoalMutation.isPending}
                  icon={<Target className="w-3.5 h-3.5" />}
                >
                  {createGoalMutation.isPending ? "Creating..." : "Set Milestone"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
