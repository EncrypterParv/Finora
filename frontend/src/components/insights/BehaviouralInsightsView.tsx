"use client";

import React from "react";
import { formatCurrency } from "@/lib/utils";
import { Sparkles, AlertTriangle, ShieldCheck, Flame, Brain, BarChart2, Activity } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export const BehaviouralInsightsView: React.FC = () => {
  const anomalies = [
    {
      id: "anom-1",
      merchant: "Toit Brewpub Bangalore",
      amount: 3800,
      occurred_at: "2026-10-03T20:15:00Z",
      confidence: 0.94,
      reason: "Transaction amount ₹3,800 is 2.8x standard deviations above your 30-day dining average (₹1,350).",
    },
    {
      id: "anom-2",
      merchant: "Late Night Swiggy Order",
      amount: 1450,
      occurred_at: "2026-10-06T23:45:00Z",
      confidence: 0.88,
      reason: "Unusual transaction timing (11:45 PM) with sub-category variance.",
    },
  ];

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
          <p className="text-2xl font-bold font-mono text-purple-400">46.2%</p>
          <span className="text-[10px] text-slate-500">Normal benchmark: &lt; 35%</span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Impulse Index
          </span>
          <p className="text-2xl font-bold font-mono text-amber-400">0.24</p>
          <span className="text-[10px] text-slate-500">Sub-₹500 micro-orders</span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Category Entropy
          </span>
          <p className="text-2xl font-bold font-mono text-indigo-300">0.78</p>
          <span className="text-[10px] text-slate-500">Discretionary dispersion</span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Runway Multiplier
          </span>
          <p className="text-2xl font-bold font-mono text-emerald-400">3.1x</p>
          <span className="text-[10px] text-slate-500">Monthly expense buffer</span>
        </Card>
      </div>

      {/* Anomaly Detection Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Detected Statistical Anomalies ({anomalies.length})
          </h2>
          <Badge variant="warning" size="sm">Z-Score &gt; 2.5</Badge>
        </div>

        <div className="space-y-3">
          {anomalies.map((anom) => (
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
          ))}
        </div>
      </div>
    </div>
  );
};
