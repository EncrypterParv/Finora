"use client";

import React, { useState } from "react";
import { PLAN_CONFIGS, PlanTier } from "@/lib/entitlements";
import { Check, Sparkles, ShieldCheck, Zap, Users, Building } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export const PricingView: React.FC = () => {
  const [selectedBilling, setSelectedBilling] = useState<"monthly" | "annual">("annual");
  const [activePlan, setActivePlan] = useState<PlanTier>("INDIVIDUAL_PRO");

  const plans: {
    id: PlanTier;
    title: string;
    priceMonthly: number;
    priceAnnual: number;
    description: string;
    badge?: string;
    icon: React.ReactNode;
    features: string[];
  }[] = [
    {
      id: "INDIVIDUAL",
      title: "Individual Starter",
      priceMonthly: 0,
      priceAnnual: 0,
      description: "Essential temporal tracking and basic monthly budget envelopes.",
      icon: <Zap className="w-5 h-5 text-slate-400" />,
      features: [
        "Financial Calendar (Day / Week / Month)",
        "Up to 2 connected bank accounts",
        "3 months historical statement analysis",
        "Deterministic linear spend forecast (30 days)",
        "Single financial milestone goal",
        "Standard CSV statement ingestion",
      ],
    },
    {
      id: "INDIVIDUAL_PRO",
      title: "Individual Pro",
      priceMonthly: 599,
      priceAnnual: 499,
      description: "Deep behavioural machine learning, multi-scenario FIRE modeling, and PDF ingestion.",
      badge: "Most Popular",
      icon: <Sparkles className="w-5 h-5 text-indigo-400" />,
      features: [
        "Everything in Starter, plus:",
        "Unlimited connected bank accounts",
        "5 years full historical modelling",
        "Exponential smoothing & 90-day forecast",
        "Isolation Forest spending anomaly alerts",
        "Dynamic FIRE scenario simulator",
        "Full CSV, XLSX, and bank PDF parsing",
        "Actionable behavioural nudges",
      ],
    },
    {
      id: "TEAMS",
      title: "FinancialCall for Teams",
      priceMonthly: 1999,
      priceAnnual: 1599,
      description: "Collaborative financial calendars and shared budgets for households and small teams.",
      icon: <Users className="w-5 h-5 text-emerald-400" />,
      features: [
        "Everything in Pro, plus:",
        "Shared team & family calendars",
        "Multi-member role-based permissions",
        "Aggregated household cash-flow forecast",
        "Collaborative budget milestone envelopes",
        "Audit trail & exportable reports",
      ],
    },
    {
      id: "ENTERPRISE",
      title: "FinancialCall Enterprise",
      priceMonthly: 4999,
      priceAnnual: 3999,
      description: "Dedicated security, compliance reporting, custom bank hooks, and multi-entity governance.",
      icon: <Building className="w-5 h-5 text-purple-400" />,
      features: [
        "Everything in Teams, plus:",
        "Unlimited historical archive",
        "Custom core-banking & SFTP data hooks",
        "SOC 2 / ISO 27001 compliance reporting",
        "Dedicated computational capacity & SLA",
        "Enterprise SSO & SAML enforcement",
      ],
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <Badge variant="brand" size="md">
          Transparent Capabilities
        </Badge>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
          Predictable Plans for Every Financial Journey
        </h1>
        <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
          Upgrade your analysis depth, historical modeling span, and scenario simulation capabilities. No dark patterns or artificial limits.
        </p>

        {/* Billing switcher */}
        <div className="pt-2 flex items-center justify-center gap-3">
          <span
            className={`text-xs font-semibold cursor-pointer ${
              selectedBilling === "monthly" ? "text-white" : "text-slate-400"
            }`}
            onClick={() => setSelectedBilling("monthly")}
          >
            Monthly Billing
          </span>
          <button
            onClick={() => setSelectedBilling(selectedBilling === "monthly" ? "annual" : "monthly")}
            className="w-11 h-6 bg-slate-800 rounded-full p-1 transition flex items-center"
          >
            <div
              className={`w-4 h-4 rounded-full bg-indigo-500 transition-transform ${
                selectedBilling === "annual" ? "translate-x-5" : ""
              }`}
            />
          </button>
          <span
            className={`text-xs font-semibold cursor-pointer flex items-center gap-1.5 ${
              selectedBilling === "annual" ? "text-white" : "text-slate-400"
            }`}
            onClick={() => setSelectedBilling("annual")}
          >
            Annual Billing
            <Badge variant="positive" size="sm">Save 20%</Badge>
          </span>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((p) => {
          const isCurrent = activePlan === p.id;
          const price = selectedBilling === "annual" ? p.priceAnnual : p.priceMonthly;

          return (
            <Card
              key={p.id}
              className={`p-5 flex flex-col justify-between relative ${
                isCurrent
                  ? "border-indigo-500 bg-slate-900/90 shadow-xl shadow-indigo-500/10 ring-1 ring-indigo-500/50"
                  : "bg-slate-900/60"
              }`}
            >
              {p.badge && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white uppercase tracking-wider shadow">
                  {p.badge}
                </span>
              )}

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60">
                    {p.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-tight">{p.title}</h3>
                    {isCurrent && (
                      <span className="text-[10px] text-emerald-400 font-medium">
                        Active Workspace Tier
                      </span>
                    )}
                  </div>
                </div>

                <div className="py-2">
                  <span className="text-2xl font-bold font-mono text-white">
                    {price === 0 ? "Free" : `₹${price}`}
                  </span>
                  {price > 0 && (
                    <span className="text-xs text-slate-400 font-medium"> / month</span>
                  )}
                </div>

                <p className="text-xs text-slate-400 mt-1 min-h-[36px] leading-relaxed">
                  {p.description}
                </p>

                {/* Features List */}
                <ul className="space-y-2.5 mt-5 text-xs text-slate-300">
                  {p.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                      <span className="leading-snug">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-800">
                <Button
                  size="sm"
                  variant={isCurrent ? "secondary" : "primary"}
                  className="w-full"
                  onClick={() => setActivePlan(p.id)}
                >
                  {isCurrent ? "Current Plan" : "Select Tier"}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
