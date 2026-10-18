"use client";

import React from "react";
import {
  LayoutDashboard,
  Calendar as CalIcon,
  ListOrdered,
  Target,
  PieChart,
  UploadCloud,
  CreditCard,
  Sparkles,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export type NavSection =
  | "overview"
  | "calendar"
  | "transactions"
  | "budgets"
  | "goals"
  | "insights"
  | "import"
  | "pricing";

interface AppShellProps {
  activeSection: NavSection;
  onNavigate: (section: NavSection) => void;
  onSyncBank?: () => void;
  isSyncing?: boolean;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  activeSection,
  onNavigate,
  onSyncBank,
  isSyncing = false,
  children,
}) => {
  const primaryNav = [
    { id: "overview" as NavSection, label: "Overview", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "calendar" as NavSection, label: "Calendar", icon: <CalIcon className="w-4 h-4" /> },
    { id: "transactions" as NavSection, label: "Transactions", icon: <ListOrdered className="w-4 h-4" /> },
    { id: "budgets" as NavSection, label: "Budgets & Burn", icon: <PieChart className="w-4 h-4" /> },
    { id: "goals" as NavSection, label: "FIRE & Goals", icon: <Target className="w-4 h-4" /> },
    { id: "insights" as NavSection, label: "Behavioural ML", icon: <Sparkles className="w-4 h-4" /> },
  ];

  const secondaryNav = [
    { id: "import" as NavSection, label: "Import", icon: <UploadCloud className="w-3.5 h-3.5" /> },
    { id: "pricing" as NavSection, label: "Plans", icon: <CreditCard className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Universal Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/90 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-500/20">
              FC
            </div>
            <div className="flex flex-col">
              <span className="font-bold tracking-tight text-sm md:text-base text-white leading-tight">
                Finora
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                Behaviour Intelligence
              </span>
            </div>
          </div>

          {/* Primary Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-900/90 border border-slate-800/80 p-1 rounded-xl">
            {primaryNav.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  <span className={isActive ? "text-white" : "text-slate-400"}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Actions & Utilities */}
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            {/* Secondary links */}
            <div className="hidden md:flex items-center gap-1">
              {secondaryNav.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition ${
                    activeSection === item.id
                      ? "text-indigo-400 bg-indigo-500/10"
                      : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            {/* Simulated HSBC Sync Button */}
            <Button
              size="sm"
              variant="secondary"
              onClick={onSyncBank}
              disabled={isSyncing}
              icon={<RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isSyncing ? "animate-spin" : ""}`} />}
              className="text-xs"
            >
              {isSyncing ? "Syncing..." : "Sync HSBC"}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="lg:hidden border-t border-slate-800/60 px-4 py-2 flex items-center gap-2 overflow-x-auto scrollbar-none">
          {primaryNav.concat(secondaryNav).map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition ${
                  isActive
                    ? "bg-indigo-600 text-white font-semibold"
                    : "text-slate-400 bg-slate-900 border border-slate-800 hover:text-white"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Surface */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <p>© 2026 Finora — Financial Behaviour Intelligence</p>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Zero Real Credentials Stored
            </span>
            <span>•</span>
            <span>Simulated Banking Mode</span>
            <span>•</span>
            <span>Deterministic ML Core</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
