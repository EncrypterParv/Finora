"use client";

import React from "react";
import {
  Calendar as CalendarIcon,
  CreditCard,
  LayoutDashboard,
  ListOrdered,
  PieChart,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FinoraMark } from "@/components/brand/FinoraMark";

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

const primaryNav = [
  { id: "overview" as NavSection, label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: "calendar" as NavSection, label: "Calendar", icon: <CalendarIcon className="h-4 w-4" /> },
  { id: "transactions" as NavSection, label: "Transactions", icon: <ListOrdered className="h-4 w-4" /> },
  { id: "budgets" as NavSection, label: "Budgets", icon: <PieChart className="h-4 w-4" /> },
  { id: "goals" as NavSection, label: "FIRE & Goals", icon: <Target className="h-4 w-4" /> },
  { id: "insights" as NavSection, label: "Insights", icon: <Sparkles className="h-4 w-4" /> },
];

const secondaryNav = [
  { id: "import" as NavSection, label: "Import", icon: <UploadCloud className="h-3.5 w-3.5" /> },
  { id: "pricing" as NavSection, label: "Plans", icon: <CreditCard className="h-3.5 w-3.5" /> },
];

export const AppShell: React.FC<AppShellProps> = ({
  activeSection,
  onNavigate,
  onSyncBank,
  isSyncing = false,
  children,
}) => {
  return (
    <div className="finora-shell min-h-screen bg-[#f7f6f2] text-[#1c2024]">
      <header className="sticky top-0 z-40 border-b border-[#e3e4df] bg-[#f7f6f2]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-[72px] w-full max-w-[1440px] items-center gap-5 px-5 md:px-8">
          <button
            type="button"
            onClick={() => onNavigate("overview")}
            className="shrink-0 rounded-[8px] text-left"
            aria-label="Go to Finora overview"
          >
            <FinoraMark size="md" />
          </button>

          <nav className="hidden min-w-0 flex-1 items-center justify-center lg:flex" aria-label="Primary navigation">
            <div className="flex items-center gap-1 rounded-[9px] border border-[#e3e4df] bg-white p-1">
              {primaryNav.map((item) => {
                const active = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onNavigate(item.id)}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-2 rounded-[6px] px-3 py-2 text-xs font-medium transition-colors ${
                      active
                        ? "bg-[#3546A8] text-white"
                        : "text-[#596168] hover:bg-[#f1f0eb] hover:text-[#1c2024]"
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <div className="hidden items-center gap-1 md:flex">
              {secondaryNav.map((item) => {
                const active = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onNavigate(item.id)}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-1.5 rounded-[6px] px-2.5 py-2 text-xs font-medium transition-colors ${
                      active
                        ? "bg-[#eef0ff] text-[#3546A8]"
                        : "text-[#596168] hover:bg-[#f1f0eb] hover:text-[#1c2024]"
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <Button
              size="sm"
              variant="secondary"
              onClick={onSyncBank}
              disabled={isSyncing}
              icon={<RefreshCw className={`h-3.5 w-3.5 text-[#3546A8] ${isSyncing ? "animate-spin" : ""}`} />}
              className="whitespace-nowrap"
            >
              {isSyncing ? "Syncing" : "Sync demo bank"}
            </Button>
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto border-t border-[#e3e4df] px-5 py-2 scrollbar-none lg:hidden" aria-label="Mobile navigation">
          {primaryNav.concat(secondaryNav).map((item) => {
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                aria-current={active ? "page" : undefined}
                className={`flex shrink-0 items-center gap-1.5 rounded-[6px] px-3 py-2 text-xs font-medium transition-colors ${
                  active
                    ? "bg-[#3546A8] text-white"
                    : "border border-[#e3e4df] bg-white text-[#596168] hover:text-[#1c2024]"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1440px] px-5 py-8 md:px-8 md:py-10">
        <div className="finora-enter">{children}</div>
      </main>

      <footer className="border-t border-[#e3e4df] bg-white/70">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-3 px-5 py-6 text-xs text-[#7a838a] md:flex-row md:items-center md:justify-between md:px-8">
          <p>© 2026 Finora. Financial decisions, made clearer.</p>
          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-[#2f6b45]" />
              Simulated banking mode
            </span>
            <span>Deterministic intelligence core</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
