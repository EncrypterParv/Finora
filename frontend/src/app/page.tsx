"use client";

import React, { useState } from "react";
import { CalendarView } from "@/components/calendar/CalendarView";
import { TransactionDetailDrawer } from "@/components/transactions/TransactionDetailDrawer";
import { CalendarViewResponse } from "@/types/calendar";
import { TransactionDetail } from "@/types/transaction";
import { LayoutDashboard, Calendar as CalIcon, Target, UploadCloud, PieChart } from "lucide-react";

// Initial seed calendar demonstration data
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
          id: "tx-demo-1",
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
          id: "tx-demo-2",
          time_label: "14:32",
          occurred_at: "2026-10-02T14:32:00Z",
          amount: 450.0,
          currency: "INR",
          transaction_type: "DEBIT",
          merchant_name: "Ahmed Kumar",
          category_name: "Personal",
          category_color: "#EC4899",
          category_icon: "Tag",
          intensity_score: 0.15,
        },
        {
          id: "tx-demo-3",
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
          id: "tx-demo-4",
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
          id: "tx-demo-5",
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
          id: "tx-demo-6",
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
          id: "tx-demo-7",
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
          id: "tx-demo-8",
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

export default function HomePage() {
  const [selectedTx, setSelectedTx] = useState<TransactionDetail | null>(null);

  const handleSelectTransaction = (txId: string) => {
    // Find in demo
    let foundEvent = null;
    for (const d of initialCalendarData.days) {
      const match = d.events.find((e) => e.id === txId);
      if (match) {
        foundEvent = match;
        break;
      }
    }

    if (foundEvent) {
      setSelectedTx({
        id: foundEvent.id,
        user_id: "user-1",
        account_id: "acc-1",
        occurred_at: foundEvent.occurred_at,
        amount: foundEvent.amount,
        currency: foundEvent.currency,
        transaction_type: foundEvent.transaction_type,
        raw_description: foundEvent.merchant_name,
        merchant_name: foundEvent.merchant_name,
        category_name: foundEvent.category_name,
        reference_id: `REF-${foundEvent.id.toUpperCase()}`,
        source: "BANK_API",
        created_at: foundEvent.occurred_at,
        monthly_budget_allocated: 50000.0,
        monthly_budget_spent: 28450.0,
        monthly_budget_utilization_pct: 56.9,
        projected_monthly_spend: 46500.0,
        projected_budget_exhaustion_date: "2026-10-28",
        recommended_daily_spend: 1200.0,
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Navigation */}
      <nav className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
              FC
            </div>
            <span className="font-bold tracking-tight text-lg text-white">
              FinancialCall
            </span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Behaviour Intelligence
            </span>
          </div>

          <div className="flex items-center gap-1 md:gap-3 text-xs font-medium text-slate-400">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-white">
              <CalIcon className="w-3.5 h-3.5 text-indigo-400" />
              Calendar
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-800/60 hover:text-white transition">
              <LayoutDashboard className="w-3.5 h-3.5" />
              Dashboard
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-800/60 hover:text-white transition">
              <Target className="w-3.5 h-3.5" />
              FIRE Goals
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-800/60 hover:text-white transition">
              <UploadCloud className="w-3.5 h-3.5" />
              Import Statement
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1">
        <CalendarView
          calendarData={initialCalendarData}
          onSelectTransaction={handleSelectTransaction}
          onSyncBank={() => alert("Simulating HSBC Banking sync...")}
        />
      </main>

      {/* Detail Drawer */}
      <TransactionDetailDrawer
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
      />
    </div>
  );
}
