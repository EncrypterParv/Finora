"use client";

import React from "react";
import { formatCurrency } from "@/lib/utils";
import { PieChart, AlertCircle, CheckCircle2, TrendingUp, Sparkles, Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export const BudgetView: React.FC = () => {
  const categories = [
    { name: "Food & Dining", allocated: 12000, spent: 8900, color: "#F59E0B" },
    { name: "Entertainment & Leisure", allocated: 6000, spent: 4100, color: "#8B5CF6" },
    { name: "Bills & Utilities", allocated: 8000, spent: 7800, color: "#EF4444" },
    { name: "Transportation", allocated: 5000, spent: 2200, color: "#3B82F6" },
    { name: "Shopping", allocated: 9000, spent: 5450, color: "#EC4899" },
    { name: "Personal & Health", allocated: 10000, spent: 0, color: "#10B981" },
  ];

  const totalAllocated = 50000;
  const totalSpent = 28450;
  const remaining = totalAllocated - totalSpent;
  const projectedTotal = 46500;

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
                <Badge variant="positive">Pacing Normal</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Active allocation, daily velocity tracking, and exhaustion forecasts
              </p>
            </div>
          </div>
        </div>

        <Button size="sm" variant="primary" icon={<Plus className="w-4 h-4" />}>
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
            <span>Overall Utilization: {((totalSpent / totalAllocated) * 100).toFixed(1)}%</span>
            <span>{formatCurrency(remaining)} remaining for 24 days</span>
          </div>
          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 flex">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${(totalSpent / totalAllocated) * 100}%` }}
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
          <span className="text-slate-500 font-mono text-[11px]">Buffer: ₹3,500</span>
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
    </div>
  );
};
