"use client";

import React, { useState, useEffect, Suspense } from "react";
import { AppShell, NavSection } from "@/components/layout/AppShell";
import { IntelligenceOverview } from "@/components/dashboard/IntelligenceOverview";
import { CalendarView } from "@/components/calendar/CalendarView";
import { TransactionLedger } from "@/components/transactions/TransactionLedger";
import { BudgetView } from "@/components/budgets/BudgetView";
import { GoalsView } from "@/components/goals/GoalsView";
import { BehaviouralInsightsView } from "@/components/insights/BehaviouralInsightsView";
import { StatementImportView } from "@/components/import/StatementImportView";
import { PricingView } from "@/components/pricing/PricingView";
import { TransactionDetailDrawer } from "@/components/transactions/TransactionDetailDrawer";
import { useBankSyncMutation } from "@/hooks/useFinancialData";
import { PlanTier } from "@/lib/entitlements";

function AppHomeContent() {
  const [activeSection, setActiveSection] = useState<NavSection>("overview");
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<PlanTier>("INDIVIDUAL_PRO");
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const bankSyncMutation = useBankSyncMutation();

  // Synchronize navigation state with browser URL search params
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") as NavSection | null;
      const txParam = params.get("tx");

      if (
        tabParam &&
        [
          "overview",
          "calendar",
          "transactions",
          "budgets",
          "goals",
          "insights",
          "import",
          "pricing",
        ].includes(tabParam)
      ) {
        setActiveSection(tabParam);
      }

      if (txParam) {
        setSelectedTxId(txParam);
      }

      // Handle popstate for back/forward navigation
      const handlePopState = () => {
        const currentParams = new URLSearchParams(window.location.search);
        const currentTab = (currentParams.get("tab") as NavSection) || "overview";
        setActiveSection(currentTab);
        setSelectedTxId(currentParams.get("tx"));
      };

      window.addEventListener("popstate", handlePopState);
      return () => window.removeEventListener("popstate", handlePopState);
    }
  }, []);

  const handleNavigate = (section: NavSection) => {
    setActiveSection(section);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("tab", section);
      window.history.pushState({}, "", `?${params.toString()}`);
    }
  };

  const handleSelectTransaction = (txId: string) => {
    setSelectedTxId(txId);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("tx", txId);
      window.history.pushState({}, "", `?${params.toString()}`);
    }
  };

  const handleCloseDrawer = () => {
    setSelectedTxId(null);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.delete("tx");
      const newQuery = params.toString() ? `?${params.toString()}` : window.location.pathname;
      window.history.pushState({}, "", newQuery);
    }
  };

  const handleBankSync = async () => {
    try {
      const result = await bankSyncMutation.mutateAsync({
        accountId: "acc-1",
        institutionId: "hsbc_demo",
      });
      setSyncFeedback(
        `Synced with HSBC: ${result.transactions_added} new transactions ingested.`
      );
      setTimeout(() => setSyncFeedback(null), 4000);
    } catch {
      setSyncFeedback("Simulated HSBC sync completed.");
      setTimeout(() => setSyncFeedback(null), 3000);
    }
  };

  return (
    <AppShell
      activeSection={activeSection}
      onNavigate={handleNavigate}
      onSyncBank={handleBankSync}
      isSyncing={bankSyncMutation.isPending}
    >
      {syncFeedback && (
        <div className="mb-6 p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-200 flex items-center justify-between animate-in fade-in">
          <span>✓ {syncFeedback}</span>
          <button
            onClick={() => setSyncFeedback(null)}
            className="text-emerald-400 hover:text-white text-xs font-bold px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Dynamic Screen Routing based on active section */}
      {activeSection === "overview" && (
        <IntelligenceOverview
          onNavigateToCalendar={() => handleNavigate("calendar")}
          onNavigateToGoals={() => handleNavigate("goals")}
          onNavigateToImport={() => handleNavigate("import")}
        />
      )}

      {activeSection === "calendar" && (
        <CalendarView
          onSelectTransaction={handleSelectTransaction}
          onSyncBank={handleBankSync}
          isSyncing={bankSyncMutation.isPending}
        />
      )}

      {activeSection === "transactions" && (
        <TransactionLedger onSelectTransaction={handleSelectTransaction} />
      )}

      {activeSection === "budgets" && <BudgetView />}

      {activeSection === "goals" && <GoalsView />}

      {activeSection === "insights" && <BehaviouralInsightsView />}

      {activeSection === "import" && (
        <StatementImportView
          onNavigateToCalendar={() => handleNavigate("calendar")}
        />
      )}

      {activeSection === "pricing" && (
        <PricingView
          currentPlan={currentPlan}
          onSelectPlan={(tier) => setCurrentPlan(tier)}
        />
      )}

      {/* Slide-over Transaction Detail Drawer with Progressive Disclosure */}
      <TransactionDetailDrawer
        transactionId={selectedTxId}
        onClose={handleCloseDrawer}
      />
    </AppShell>
  );
}

export default function AppHome() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <AppHomeContent />
    </Suspense>
  );
}
