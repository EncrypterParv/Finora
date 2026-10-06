"use client";

import React, { useState } from "react";
import { CanonicalTransaction } from "@/types/transaction";
import { formatCurrency } from "@/lib/utils";
import { Search, Filter, ArrowDownLeft, ArrowUpRight, Tag, Calendar, Download } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface TransactionLedgerProps {
  transactions: CanonicalTransaction[];
  onSelectTransaction?: (id: string) => void;
}

export const TransactionLedger: React.FC<TransactionLedgerProps> = ({
  transactions,
  onSelectTransaction,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const categories = [
    "ALL",
    "Food & Dining",
    "Entertainment",
    "Bills & Utilities",
    "Transportation",
    "Income",
    "Personal",
  ];

  const filtered = transactions.filter((t) => {
    const matchesSearch =
      t.merchant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.raw_description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat =
      selectedCategory === "ALL" || t.category_name.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCat;
  });

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

        <Button size="sm" variant="secondary" icon={<Download className="w-3.5 h-3.5" />}>
          Export CSV
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
            className="w-full pl-9 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                selectedCategory === cat
                  ? "bg-indigo-600 text-white font-semibold"
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
              {filtered.map((tx) => {
                const isDebit = tx.transaction_type === "DEBIT";
                const dateObj = new Date(tx.occurred_at);

                return (
                  <tr
                    key={tx.id}
                    onClick={() => onSelectTransaction?.(tx.id)}
                    className="hover:bg-slate-800/40 cursor-pointer transition"
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

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 text-xs italic">
                    No transactions match the selected filter.
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
