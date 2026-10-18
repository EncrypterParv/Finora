"use client";

import React, { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import {
  PieChart,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Plus,
  RefreshCw,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useBudgetsData, useCreateBudgetMutation } from "@/hooks/useFinancialData";

export const BudgetView: React.FC = () => {
  const { data: budgets, isLoading, isError, refetch } = useBudgetsData();
  const createBudgetMutation = useCreateBudgetMutation();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newLimit, setNewLimit] = useState<number>(50000);
  const [budgetName, setBudgetName] = useState<string>("Monthly Core Budget");

  const categories = [
    { name: "Food & Dining", allocated: 12000, spent: 8900, color: "#F59E0B" },
    { name: "Entertainment & Leisure", allocated: 6000, spent: 4100, color: "#8B5CF6" },
    { name: "Bills & Utilities", allocated: 8000, spent: 7800, color: "#EF4444" },
    { name: "Transportation", allocated: 5000, spent: 2200, color: "#3B82F6" },
    { name: "Shopping", allocated: 9000, spent: 5450, color: "#EC4899" },
    { name: "Personal & Health", allocated: 10000, spent: 0, color: "#10B981" },
  ];

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <LoadingSkeleton height="h-8" width="w-64" />
          <LoadingSkeleton height="h-8" width="w-32" />
        </div>
        <LoadingSkeleton height="h-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <LoadingSkeleton height="h-32" />
          <LoadingSkeleton height="h-32" />
          <LoadingSkeleton height="h-32" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="p-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-white">Unable to load Budgets</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Failed to retrieve budget allocations and burn projections.
        </p>
        <Button size="sm" variant="secondary" onClick={() => refetch()} icon={<RefreshCw className="w-3.5 h-3.5" />}>
          Retry
        </Button>
      </Card>
    );
  }

  const primaryBudget = budgets && budgets.length > 0 ? budgets[0] : null;
  const totalAllocated = primaryBudget ? primaryBudget.total_limit : 50000;
  const totalSpent = primaryBudget ? primaryBudget.total_spent : 28450;
  const remaining = Math.max(0, totalAllocated - totalSpent);
  const projectedTotal = primaryBudget?.projected_burn_total || 46500;
  const utilizationPct = Math.min(100, (totalSpent / totalAllocated) * 100);

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    await createBudgetMutation.mutateAsync({
      name: budgetName,
      period: "MONTHLY",
      total_limit: Number(newLimit),
      start_date: "2026-10-01",
      end_date: "2026-10-31",
    });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                  Budgets & Burn Pace
                </h1>
                <Badge variant={utilizationPct > 90 ? "warning" : "positive"}>
                  {utilizationPct > 90 ? "Near Limit" : "Pacing Normal"}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Active allocation, daily velocity tracking, and exhaustion forecasts
              </p>
            </div>
          </div>
        </div>

        <Button
          size="sm"
          variant="primary"
          onClick={() => {
            setNewLimit(totalAllocated);
            setIsModalOpen(true);
          }}
          icon={<Plus className="w-4 h-4" />}
        >
          Adjust Monthly Budget
        </Button>
      </div>

      {/* Main Budget Progress Hero Card */}
      <Card className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Monthly Target
            </span>
            <p className="text-2xl font-bold font-mono text-white mt-1">
              {formatCurrency(totalAllocated)}
            </p>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Spent to Date
            </span>
            <p className="text-2xl font-bold font-mono text-slate-200 mt-1">
              {formatCurrency(totalSpent)}
            </p>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Remaining Envelope
            </span>
            <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">
              {formatCurrency(remaining)}
            </p>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Projected Month-End
            </span>
            <p className="text-2xl font-bold font-mono text-indigo-300 mt-1">
              {formatCurrency(projectedTotal)}
            </p>
          </div>
        </div>

        {/* Aggregate Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-400 font-medium">
            <span>Overall Utilization: {utilizationPct.toFixed(1)}%</span>
            <span>{formatCurrency(remaining)} remaining buffer</span>
          </div>
          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 flex">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                utilizationPct > 90 ? "bg-amber-500" : "bg-indigo-600"
              }`}
              style={{ width: `${utilizationPct}%` }}
            />
          </div>
        </div>

        {/* Velocity Context Statement */}
        <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              You are currently spending <strong>₹120/day slower</strong> than your ceiling pace.
            </span>
          </span>
          <span className="text-slate-500 font-mono text-[11px]">
            Forecast Exhaustion: {primaryBudget?.projected_exhaustion_date || "Within Period"}
          </span>
        </div>
      </Card>

      {/* Category Envelopes Grid */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Category Allocations
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => {
            const pct = Math.min(100, Math.round((cat.spent / cat.allocated) * 100));
            const isNearLimit = pct > 85;

            return (
              <Card key={cat.name} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    <h3 className="text-xs font-bold text-slate-200">{cat.name}</h3>
                  </div>
                  <Badge variant={isNearLimit ? "warning" : "neutral"} size="sm">
                    {pct}%
                  </Badge>
                </div>

                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-mono font-bold text-white">{formatCurrency(cat.spent)}</span>
                  <span className="text-slate-500 font-mono text-[11px]">
                    limit {formatCurrency(cat.allocated)}
                  </span>
                </div>

                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: isNearLimit ? "#F59E0B" : cat.color,
                    }}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Budget Adjustment Modal Dialog */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-label="Adjust Monthly Budget"
        >
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Adjust Monthly Budget Target</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">
                  Budget Name
                </label>
                <input
                  type="text"
                  value={budgetName}
                  onChange={(e) => setBudgetName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">
                  Monthly Limit (₹)
                </label>
                <input
                  type="number"
                  min="5000"
                  max="1000000"
                  step="1000"
                  value={newLimit}
                  onChange={(e) => setNewLimit(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="subtle"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={createBudgetMutation.isPending}
                  icon={<Sparkles className="w-3.5 h-3.5" />}
                >
                  {createBudgetMutation.isPending ? "Saving..." : "Save Target"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
