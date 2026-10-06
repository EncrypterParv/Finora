"use client";

import React, { useState } from "react";
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
import { CalendarViewResponse } from "@/types/calendar";
import { CanonicalTransaction, TransactionDetail } from "@/types/transaction";

// Rich initial dataset representing continuous realistic banking history
const initialTransactions: CanonicalTransaction[] = [
  {
    id: "tx-1",
    user_id: "user-1",
    account_id: "acc-1",
    occurred_at: "2026-10-01T09:15:00Z",
    amount: 125000.0,
    currency: "INR",
    transaction_type: "CREDIT",
    raw_description: "ACH CREDIT SALARY TECH CORP INDIA PVT LTD",
    merchant_name: "TechCorp Payroll",
    category_name: "Income",
    reference_id: "NEFT-HSBC-SAL-202610",
    source: "BANK_API",
    created_at: "2026-10-01T09:15:00Z",
  },
  {
    id: "tx-2",
    user_id: "user-1",
    account_id: "acc-1",
    occurred_at: "2026-10-02T14:32:00Z",
    amount: 450.0,
    currency: "INR",
    transaction_type: "DEBIT",
    raw_description: "UPI/AHMED-KUMAR/TRANSFER@okhdfcbank",
    merchant_name: "Ahmed Kumar",
    category_name: "Personal",
    reference_id: "UPI-AK-1002",
    source: "BANK_API",
    created_at: "2026-10-02T14:32:00Z",
  },
  {
    id: "tx-3",
    user_id: "user-1",
    account_id: "acc-1",
    occurred_at: "2026-10-02T18:20:00Z",
    amount: 850.0,
    currency: "INR",
    transaction_type: "DEBIT",
    raw_description: "BBPS ELECTRICITY BILL TATA POWER MUMBAI",
    merchant_name: "Electricity",
    category_name: "Bills & Utilities",
    reference_id: "BBPS-ELE-202610",
    source: "BANK_API",
    created_at: "2026-10-02T18:20:00Z",
  },
  {
    id: "tx-4",
    user_id: "user-1",
    account_id: "acc-1",
    occurred_at: "2026-10-03T20:15:00Z",
    amount: 2800.0,
    currency: "INR",
    transaction_type: "DEBIT",
    raw_description: "POS TOIT BREWPUB INDIRANAGAR BANGALORE IN",
    merchant_name: "Toit Brewpub",
    category_name: "Food & Dining",
    reference_id: "POS-DIN-1004",
    source: "BANK_API",
    created_at: "2026-10-03T20:15:00Z",
  },
  {
    id: "tx-5",
    user_id: "user-1",
    account_id: "acc-1",
    occurred_at: "2026-10-03T23:45:00Z",
    amount: 650.0,
    currency: "INR",
    transaction_type: "DEBIT",
    raw_description: "UBER INDIA RIDES PVT LTD BANGALORE",
    merchant_name: "Uber Premier",
    category_name: "Transportation",
    reference_id: "UBR-90129",
    source: "BANK_API",
    created_at: "2026-10-03T23:45:00Z",
  },
  {
    id: "tx-6",
    user_id: "user-1",
    account_id: "acc-1",
    occurred_at: "2026-10-04T11:30:00Z",
    amount: 1200.0,
    currency: "INR",
    transaction_type: "DEBIT",
    raw_description: "BLUE TOKAI COFFEE ROASTERS KORAMANGALA",
    merchant_name: "Blue Tokai Coffee",
    category_name: "Food & Dining",
    reference_id: "BT-9902",
    source: "BANK_API",
    created_at: "2026-10-04T11:30:00Z",
  },
  {
    id: "tx-7",
    user_id: "user-1",
    account_id: "acc-1",
    occurred_at: "2026-10-05T04:30:00Z",
    amount: 649.0,
    currency: "INR",
    transaction_type: "DEBIT",
    raw_description: "SI NETFLIX ENTERTAINMENT SERVICES IN",
    merchant_name: "Netflix Subscription",
    category_name: "Entertainment",
    reference_id: "SI-NFLX-202610",
    source: "BANK_API",
    created_at: "2026-10-05T04:30:00Z",
  },
  {
    id: "tx-8",
    user_id: "user-1",
    account_id: "acc-1",
    occurred_at: "2026-10-06T13:10:00Z",
    amount: 450.0,
    currency: "INR",
    transaction_type: "DEBIT",
    raw_description: "UPI/SWIGGY/ORDER-49201@icici",
    merchant_name: "Swiggy Daily",
    category_name: "Food & Dining",
    reference_id: "UPI-SWG-1008",
    source: "BANK_API",
    created_at: "2026-10-06T13:10:00Z",
  },
];

const initialCalendarData: CalendarViewResponse = {
  mode: "month",
  start_date: "2026-10-01",
  end_date: "2026-10-31",
  total_period_debit: 48900.0,
  total_period_credit: 125000.0,
  average_daily_spend: 1577.42,
  predicted_month_end_burn: 49500.0,
  days: [
    {
      date: "2026-10-01",
      date_label: "Thu, Oct 01",
      total_debit: 0,
      total_credit: 125000.0,
      net_flow: 125000.0,
      transaction_count: 1,
      spending_intensity: 0.0,
      is_projected: false,
      events: [
        {
          id: "tx-1",
          time_label: "09:15",
          occurred_at: "2026-10-01T09:15:00Z",
          amount: 125000.0,
          currency: "INR",
          transaction_type: "CREDIT",
          merchant_name: "TechCorp Payroll",
          category_name: "Income",
          category_color: "#10B981",
          category_icon: "ArrowDownLeft",
          intensity_score: 0.1,
        },
      ],
    },
    {
      date: "2026-10-02",
      date_label: "Fri, Oct 02",
      total_debit: 1300.0,
      total_credit: 0,
      net_flow: -1300.0,
      transaction_count: 2,
      spending_intensity: 0.45,
      is_projected: false,
      events: [
        {
          id: "tx-2",
          time_label: "14:32",
          occurred_at: "2026-10-02T14:32:00Z",
          amount: 450.0,
          currency: "INR",
          transaction_type: "DEBIT",
          merchant_name: "Ahmed Kumar",
          category_name: "Personal",
          category_color: "#F43F5E",
          category_icon: "User",
          intensity_score: 0.15,
        },
        {
          id: "tx-3",
          time_label: "18:20",
          occurred_at: "2026-10-02T18:20:00Z",
          amount: 850.0,
          currency: "INR",
          transaction_type: "DEBIT",
          merchant_name: "Electricity",
          category_name: "Bills & Utilities",
          category_color: "#EF4444",
          category_icon: "Zap",
          intensity_score: 0.3,
        },
      ],
    },
    {
      date: "2026-10-03",
      date_label: "Sat, Oct 03",
      total_debit: 3450.0,
      total_credit: 0,
      net_flow: -3450.0,
      transaction_count: 2,
      spending_intensity: 0.85,
      is_projected: false,
      events: [
        {
          id: "tx-4",
          time_label: "20:15",
          occurred_at: "2026-10-03T20:15:00Z",
          amount: 2800.0,
          currency: "INR",
          transaction_type: "DEBIT",
          merchant_name: "Toit Brewpub",
          category_name: "Food & Dining",
          category_color: "#F59E0B",
          category_icon: "Utensils",
          intensity_score: 0.75,
        },
        {
          id: "tx-5",
          time_label: "23:45",
          occurred_at: "2026-10-03T23:45:00Z",
          amount: 650.0,
          currency: "INR",
          transaction_type: "DEBIT",
          merchant_name: "Uber Premier",
          category_name: "Transportation",
          category_color: "#3B82F6",
          category_icon: "Car",
          intensity_score: 0.2,
        },
      ],
    },
    {
      date: "2026-10-04",
      date_label: "Sun, Oct 04",
      total_debit: 1200.0,
      total_credit: 0,
      net_flow: -1200.0,
      transaction_count: 1,
      spending_intensity: 0.4,
      is_projected: false,
      events: [
        {
          id: "tx-6",
          time_label: "11:30",
          occurred_at: "2026-10-04T11:30:00Z",
          amount: 1200.0,
          currency: "INR",
          transaction_type: "DEBIT",
          merchant_name: "Blue Tokai Coffee",
          category_name: "Food & Dining",
          category_color: "#F59E0B",
          category_icon: "Utensils",
          intensity_score: 0.35,
        },
      ],
    },
    {
      date: "2026-10-05",
      date_label: "Mon, Oct 05",
      total_debit: 649.0,
      total_credit: 0,
      net_flow: -649.0,
      transaction_count: 1,
      spending_intensity: 0.2,
      is_projected: false,
      events: [
        {
          id: "tx-7",
          time_label: "04:30",
          occurred_at: "2026-10-05T04:30:00Z",
          amount: 649.0,
          currency: "INR",
          transaction_type: "DEBIT",
          merchant_name: "Netflix Subscription",
          category_name: "Entertainment",
          category_color: "#8B5CF6",
          category_icon: "Film",
          intensity_score: 0.2,
        },
      ],
    },
    {
      date: "2026-10-06",
      date_label: "Tue, Oct 06",
      total_debit: 450.0,
      total_credit: 0,
      net_flow: -450.0,
      transaction_count: 1,
      spending_intensity: 0.15,
      is_projected: false,
      events: [
        {
          id: "tx-8",
          time_label: "13:10",
          occurred_at: "2026-10-06T13:10:00Z",
          amount: 450.0,
          currency: "INR",
          transaction_type: "DEBIT",
          merchant_name: "Swiggy Daily",
          category_name: "Food & Dining",
          category_color: "#F59E0B",
          category_icon: "Utensils",
          intensity_score: 0.15,
        },
      ],
    },
    {
      date: "2026-10-07",
      date_label: "Wed, Oct 07",
      total_debit: 0,
      total_credit: 0,
      net_flow: 0,
      transaction_count: 0,
      spending_intensity: 0.0,
      is_projected: false,
      events: [],
    },
  ],
};

export default function AppHome() {
  const [activeSection, setActiveSection] = useState<NavSection>("overview");
  const [selectedTx, setSelectedTx] = useState<TransactionDetail | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const handleSelectTransaction = (txId: string) => {
    const found = initialTransactions.find((t) => t.id === txId);
    if (found) {
      setSelectedTx({
        ...found,
        monthly_budget_allocated: 50000.0,
        monthly_budget_spent: 28450.0,
        monthly_budget_utilization_pct: 56.9,
        projected_monthly_spend: 46500.0,
        projected_budget_exhaustion_date: "2026-10-28",
        recommended_daily_spend: 1200.0,
      });
    }
  };

  const handleSimulateSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, 1200);
  };

  return (
    <AppShell
      activeSection={activeSection}
      onNavigate={setActiveSection}
      onSyncBank={handleSimulateSync}
      isSyncing={isSyncing}
    >
      {/* Dynamic Screen Routing based on active section */}
      {activeSection === "overview" && (
        <IntelligenceOverview
          onNavigateToCalendar={() => setActiveSection("calendar")}
          onNavigateToGoals={() => setActiveSection("goals")}
        />
      )}

      {activeSection === "calendar" && (
        <CalendarView
          calendarData={initialCalendarData}
          onSelectTransaction={handleSelectTransaction}
          onSyncBank={handleSimulateSync}
          isSyncing={isSyncing}
        />
      )}

      {activeSection === "transactions" && (
        <TransactionLedger
          transactions={initialTransactions}
          onSelectTransaction={handleSelectTransaction}
        />
      )}

      {activeSection === "budgets" && <BudgetView />}

      {activeSection === "goals" && <GoalsView />}

      {activeSection === "insights" && <BehaviouralInsightsView />}

      {activeSection === "import" && <StatementImportView />}

      {activeSection === "pricing" && <PricingView />}

      {/* Slide-over Transaction Detail Drawer with Progressive Disclosure */}
      <TransactionDetailDrawer
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
      />
    </AppShell>
  );
}
