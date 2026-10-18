"use client";

import React, { useEffect } from "react";
import { TransactionDetail } from "@/types/transaction";
import { formatCurrency } from "@/lib/utils";
import {
  X,
  Sparkles,
  AlertTriangle,
  Calendar,
  Hash,
  FileText,
  ShieldCheck,
  Receipt,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useTransactionDetailQuery } from "@/hooks/useFinancialData";

interface TransactionDetailDrawerProps {
  transactionId?: string | null;
  transaction?: TransactionDetail | null;
  onClose: () => void;
}

export const TransactionDetailDrawer: React.FC<TransactionDetailDrawerProps> = ({
  transactionId,
  transaction: propTransaction,
  onClose,
}) => {
  // If transactionId is supplied, query the backend for full predictive context
  const activeId = transactionId || propTransaction?.id || null;
  const { data: fetchedTx, isLoading } = useTransactionDetailQuery(activeId);

  const tx = fetchedTx || propTransaction;

  // Escape key closes the drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!activeId) return null;

  const isDebit = tx ? tx.transaction_type === "DEBIT" : true;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm flex justify-end transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Transaction Details"
    >
      <div
        className="w-full sm:w-[420px] bg-slate-900 border-l border-slate-800 shadow-2xl p-6 flex flex-col justify-between overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading && !tx ? (
          <div className="space-y-6 pt-4">
            <div className="flex justify-between items-center">
              <LoadingSkeleton height="h-6" width="w-32" />
              <LoadingSkeleton height="h-6" width="w-6" />
            </div>
            <LoadingSkeleton height="h-20" />
            <LoadingSkeleton height="h-32" />
            <LoadingSkeleton height="h-40" />
          </div>
        ) : tx ? (
          <div className="space-y-6">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-indigo-400" />
                <h2 className="text-xs font-bold tracking-wider uppercase text-slate-400">
                  Transaction Intelligence
                </h2>
              </div>
              <button
                onClick={onClose}
                aria-label="Close transaction details"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Hero Amount & Merchant */}
            <div className="py-4 text-center space-y-2">
              <span className="text-xs text-slate-400 font-medium block">
                {tx.merchant_name}
              </span>
              <p
                className={`text-3xl md:text-4xl font-bold font-mono ${
                  isDebit ? "text-slate-100" : "text-emerald-400"
                }`}
              >
                {isDebit ? "-" : "+"}
                {formatCurrency(tx.amount, tx.currency)}
              </p>
              <div className="flex items-center justify-center gap-2 pt-1">
                <Badge variant="neutral" size="sm">
                  {tx.category_name}
                </Badge>
                <Badge variant={isDebit ? "neutral" : "positive"} size="sm">
                  {tx.transaction_type}
                </Badge>
              </div>
            </div>

            {/* Anomaly Detection Banner (if detected) */}
            {tx.is_anomaly && (
              <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  Statistical Anomaly Flagged
                </div>
                <p className="leading-relaxed text-[11px] text-amber-300/90">
                  {tx.anomaly_reason || "This transaction exceeds typical spending limits for this category."}
                </p>
              </div>
            )}

            {/* Predictive & Behavioural Intelligence Box */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/40 via-slate-800/60 to-slate-900 border border-indigo-900/40 space-y-3.5">
              <div className="flex items-center justify-between text-indigo-300 text-xs font-semibold uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  Budget & Pacing Impact
                </span>
                <Badge variant="brand" size="sm">Live Model</Badge>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Monthly Budget Spent:</span>
                  <span className="font-mono text-slate-200 font-medium">
                    {formatCurrency(tx.monthly_budget_spent || 28450)} / {formatCurrency(tx.monthly_budget_allocated || 50000)}
                  </span>
                </div>

                <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${Math.min(100, tx.monthly_budget_utilization_pct || 56.9)}%` }}
                  />
                </div>

                <div className="flex justify-between pt-1">
                  <span className="text-slate-400">Projected Month-End Spend:</span>
                  <span className="font-mono text-indigo-200 font-medium">
                    {formatCurrency(tx.projected_monthly_spend || 46500)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400">Recommended Daily Cap:</span>
                  <span className="font-mono text-emerald-400 font-medium">
                    {formatCurrency(tx.recommended_daily_spend || 1200)}/day
                  </span>
                </div>
              </div>
            </div>

            {/* Canonical Technical Audit Metadata */}
            <div className="space-y-2.5 text-xs">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Canonical Ledger Metadata
              </h3>

              <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Timestamp
                </span>
                <span className="font-mono text-slate-200">
                  {new Date(tx.occurred_at).toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400 flex items-center gap-2">
                  <Hash className="w-3.5 h-3.5 text-slate-500" />
                  Reference ID
                </span>
                <span className="font-mono text-slate-300 truncate max-w-[200px]">
                  {tx.reference_id}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  Raw Description
                </span>
                <span className="font-mono text-[11px] text-slate-400 truncate max-w-[200px]" title={tx.raw_description}>
                  {tx.raw_description}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400 flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                  Ingestion Source
                </span>
                <Badge variant="neutral" size="sm">
                  {tx.source}
                </Badge>
              </div>

              {tx.tax_info && (
                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-slate-300 space-y-1">
                  <p className="text-[11px] font-semibold text-slate-400">GST / Tax Invoice</p>
                  <p>Rate: {tx.tax_info.gst_rate_pct}%</p>
                  <p>Invoice #: {tx.tax_info.tax_invoice_number || "N/A"}</p>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Drawer Action Footer */}
        <div className="pt-6 mt-6 border-t border-slate-800">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            Close Detail View
          </button>
        </div>
      </div>
    </div>
  );
};
