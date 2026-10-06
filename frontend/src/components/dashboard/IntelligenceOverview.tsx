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
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface IntelligenceOverviewProps {
  onNavigateToCalendar?: () => void;
  onNavigateToGoals?: () => void;
}

export const IntelligenceOverview: React.FC<IntelligenceOverviewProps> = ({
  onNavigateToCalendar,
  onNavigateToGoals,
}) => {
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
              82 <span className="text-xs font-normal text-slate-400">/ 100</span>
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
            <p className="text-xl font-bold font-mono text-white mt-1">₹1,48,500</p>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
              <ShieldAlert className="w-3 h-3" /> Safe runway
            </span>
          </Card>

          <Card className="p-4">
            <span className="text-[11px] text-slate-400 font-medium">Monthly Inflow</span>
            <p className="text-xl font-bold font-mono text-emerald-400 mt-1">+₹1,25,000</p>
            <span className="text-[10px] text-slate-500 mt-1 block">Salary credited</span>
          </Card>

          <Card className="p-4">
            <span className="text-[11px] text-slate-400 font-medium">Month-to-Date Spend</span>
            <p className="text-xl font-bold font-mono text-slate-100 mt-1">-₹28,450</p>
            <span className="text-[10px] text-slate-500 mt-1 block">56.9% of budget</span>
          </Card>

          <Card className="p-4">
            <span className="text-[11px] text-slate-400 font-medium">Effective Savings Rate</span>
            <p className="text-xl font-bold font-mono text-indigo-300 mt-1">34.2%</p>
            <span className="text-[10px] text-indigo-400 mt-1 block">+4.1% vs last month</span>
          </Card>

          <Card className="p-4">
            <span className="text-[11px] text-slate-400 font-medium">Runway Capacity</span>
            <p className="text-xl font-bold font-mono text-amber-300 mt-1">94 Days</p>
            <span className="text-[10px] text-slate-500 mt-1 block">At ₹1,577 daily burn</span>
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
              <span className="text-xs font-bold text-slate-200">Dining & Delivery Acceleration</span>
              <Badge variant="warning">+18.4%</Badge>
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Food delivery orders increased from 1.2x to 2.8x per week, largely concentrated after 8:00 PM.
            </p>
          </Card>

          <Card className="p-4 border-l-4 border-l-purple-500 bg-slate-900/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">Weekend Spend Concentration</span>
              <Badge variant="brand">46.2% of Total</Badge>
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Nearly half of all discretionary expenses occurred across Friday evening to Sunday night.
            </p>
          </Card>

          <Card className="p-4 border-l-4 border-l-emerald-500 bg-slate-900/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">Utilities & Fixed Overheads</span>
              <Badge variant="positive">Stable</Badge>
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Recurring bills (Electricity, Broadband, Subscriptions) remained consistent within ±₹120 of baseline.
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
                <span className="text-2xl font-bold font-mono text-indigo-200">₹46,500</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Monthly Target</span>
                <span className="text-sm font-semibold font-mono text-slate-300">₹50,000</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              At your current daily velocity of <strong className="text-amber-400">₹1,577/day</strong>, you are on track to finish the month within your ₹50,000 budget with a projected buffer of <strong className="text-emerald-400">₹3,500</strong>.
            </p>
          </div>
        </Card>

        {/* Why (Drivers) */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-slate-400" />
              4. Why (Primary Driving Factors)
            </h3>
          </div>

          <ul className="space-y-2.5 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
              <span><strong>Swiggy & Dining Out:</strong> Contributes 34.5% of overall outflow (₹9,800 MTD).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
              <span><strong>Weekend Splurges:</strong> Friday-Sunday evenings account for 2.4x higher velocity than weekdays.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
              <span><strong>Scheduled Subscriptions:</strong> Netflix, Spotify, and AWS cloud recurring debits settled seamlessly on the 5th.</span>
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
          <span className="text-xs text-slate-500">Quantified Impact</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5 flex flex-col justify-between hoverable">
            <div>
              <div className="flex items-center justify-between pb-2">
                <Badge variant="warning">High Impact</Badge>
                <span className="text-xs font-mono font-bold text-emerald-400">+₹3,500/mo</span>
              </div>
              <h4 className="text-sm font-bold text-white mt-1">Cap Weekend Dining at ₹2,500</h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Allocating a dedicated weekend entertainment envelope will prevent discretionary impulse spillover into weekdays.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-800">
              <Button size="sm" variant="secondary" className="w-full" onClick={onNavigateToCalendar}>
                View on Calendar
              </Button>
            </div>
          </Card>

          <Card className="p-5 flex flex-col justify-between hoverable">
            <div>
              <div className="flex items-center justify-between pb-2">
                <Badge variant="brand">FIRE Accelerator</Badge>
                <span className="text-xs font-mono font-bold text-indigo-300">-18 Months</span>
              </div>
              <h4 className="text-sm font-bold text-white mt-1">Increase Monthly SIP by ₹5,000</h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Redirecting month-end budget surplus into index funds compounds your timeline to financial independence by 1.5 years.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-800">
              <Button size="sm" variant="secondary" className="w-full" onClick={onNavigateToGoals}>
                Explore Scenario
              </Button>
            </div>
          </Card>

          <Card className="p-5 flex flex-col justify-between hoverable">
            <div>
              <div className="flex items-center justify-between pb-2">
                <Badge variant="neutral">Optimization</Badge>
                <span className="text-xs font-mono font-bold text-slate-300">₹649/mo</span>
              </div>
              <h4 className="text-sm font-bold text-white mt-1">Audit Idle Subscriptions</h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Multiple recurring media platforms detected with less than 2 observed sessions in the prior 45 days.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-800">
              <Button size="sm" variant="subtle" className="w-full">
                Review Subscriptions
              </Button>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};
