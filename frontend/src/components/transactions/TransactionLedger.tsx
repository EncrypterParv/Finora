"use client";

import React, { useState } from "react";
import { CanonicalTransaction } from "@/types/transaction";
import { formatCurrency } from "@/lib/utils";
import {
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  Tag,
  Calendar,
  Download,
  ArrowUpDown,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTransactionsList } from "@/hooks/useFinancialData";

interface TransactionLedgerProps {
  onSelectTransaction?: (id: string) => void;
}

export const TransactionLedger: React.FC<TransactionLedgerProps> = ({
  onSelectTransaction,
}) => {
  const { data: transactions, isLoading, isError, refetch } = useTransactionsList(150, 0);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc" | "amount_desc" | "amount_asc">("date_desc");

  const categories = [
    "ALL",
    "Food & Dining",
    "Entertainment",
    "Bills & Utilities",
    "Transportation",
    "Shopping",
    "Income",
    "Personal",
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <LoadingSkeleton height="h-8" width="w-64" />
          <LoadingSkeleton height="h-8" width="w-32" />
        </div>
        <LoadingSkeleton height="h-12" />
        <LoadingSkeleton height="h-96" />
      </div>
    );
  }

  if (isError || !transactions) {
    return (
      <Card className="p-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-white">Unable to load transactions</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Failed to fetch normalized canonical records.
        </p>
        <Button size="sm" variant="secondary" onClick={() => refetch()} icon={<RefreshCw className="w-3.5 h-3.5" />}>
          Retry
        </Button>
      </Card>
    );
  }

  // Filter
  const filtered = transactions.filter((t) => {
    const matchesSearch =
      (t.merchant_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.raw_description || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat =
      selectedCategory === "ALL" ||
      (t.category_name || "").toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCat;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "date_desc") {
      return new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime();
    }
    if (sortBy === "date_asc") {
      return new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime();
    }
    if (sortBy === "amount_desc") {
      return b.amount - a.amount;
    }
    if (sortBy === "amount_asc") {
      return a.amount - b.amount;
    }
    return 0;
  });

  // Native CSV Export handler
  const handleExportCSV = () => {
    const headers = ["ID", "Timestamp", "Merchant", "Category", "Type", "Amount", "Currency", "Source", "Reference ID"];
    const rows = sorted.map((t) => [
      t.id,
      t.occurred_at,
      `"${(t.merchant_name || "").replace(/"/g, '""')}"`,
      `"${(t.category_name || "").replace(/"/g, '""')}"`,
      t.transaction_type,
      t.amount,
      t.currency,
      t.source,
      `"${t.reference_id}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Finora_Transactions_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              Transaction Ledger
            </h1>
            <Badge variant="neutral">{transactions.length} Total Records</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Normalized canonical records across all connected accounts and statements
          </p>
        </div>

        <Button
          size="sm"
          variant="secondary"
          onClick={handleExportCSV}
          icon={<Download className="w-3.5 h-3.5" />}
        >
          Export CSV ({sorted.length})
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by merchant or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 transition"
          />
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5" /> Sort:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
            <option value="amount_desc">Amount: High to Low</option>
            <option value="amount_asc">Amount: Low to High</option>
          </select>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                selectedCategory === cat
                  ? "bg-indigo-600 text-white font-semibold shadow-sm"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Table */}
      <Card className="p-0 overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Merchant & Description</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sorted.map((tx) => {
                const isDebit = tx.transaction_type === "DEBIT";
                const dateObj = new Date(tx.occurred_at);

                return (
                  <tr
                    key={tx.id}
                    onClick={() => onSelectTransaction?.(tx.id)}
                    onKeyDown={(e) => e.key === "Enter" && onSelectTransaction?.(tx.id)}
                    tabIndex={0}
                    role="button"
                    className="hover:bg-slate-800/40 cursor-pointer transition focus-visible:bg-slate-800/50 focus-visible:outline-none"
                  >
                    <td className="py-3.5 px-4 font-mono text-slate-400 whitespace-nowrap">
                      {dateObj.toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      <span className="text-slate-500">
                        {dateObj.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-100">{tx.merchant_name}</p>
                      <p className="text-[11px] text-slate-500 truncate max-w-xs">{tx.raw_description}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge variant="neutral" size="sm">
                        {tx.category_name}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                      {tx.source}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <span
                        className={`font-mono font-bold text-sm ${
                          isDebit ? "text-slate-100" : "text-emerald-400"
                        }`}
                      >
                        {isDebit ? "-" : "+"}
                        {formatCurrency(tx.amount, tx.currency)}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {sorted.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 text-xs italic">
                    No transactions match your search and filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
