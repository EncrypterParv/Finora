"use client";

import React, { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { Target, TrendingUp, Sparkles, Plus, Calendar, ShieldCheck, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export const GoalsView: React.FC = () => {
  const [additionalMonthlySavings, setAdditionalMonthlySavings] = useState<number>(5000);

  // Base goal parameters
  const currentCorpus = 420000;
  const targetCorpus = 2500000;
  const baseMonthlySIP = 18000;
  const expectedReturnPct = 12.0;

  // Simple compound projection estimation
  const monthsSaved = Math.round((additionalMonthlySavings / (baseMonthlySIP + additionalMonthlySavings)) * 48);
  const baseYears = 7.2;
  const projectedYears = Math.max(1.5, baseYears - monthsSaved / 12).toFixed(1);

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

        <Button size="sm" variant="primary" icon={<Plus className="w-4 h-4" />}>
          New Milestone Goal
        </Button>
      </div>

      {/* Primary Goal Spotlight Card */}
      <Card className="p-6 md:p-8 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border-indigo-900/40 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Badge variant="brand" size="sm" className="mb-2">
              Primary Goal · Retirement & Independence
            </Badge>
            <h2 className="text-xl md:text-2xl font-bold text-white">
              Financial Independence (FIRE)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Freedom from active wage dependency at 12% annual diversified equity growth
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block">Projected Completion</span>
            <span className="text-xl md:text-2xl font-bold font-mono text-indigo-300">
              October 2033
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
            <span className="text-[10px] text-slate-500">16.8% of target</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 block font-medium">Target Corpus</span>
            <span className="text-lg font-bold font-mono text-white mt-1 block">
              {formatCurrency(targetCorpus)}
            </span>
            <span className="text-[10px] text-slate-500">25x annual expenses</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 block font-medium">Current Monthly SIP</span>
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
              className="w-full accent-indigo-500 cursor-pointer"
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
    </div>
  );
};
