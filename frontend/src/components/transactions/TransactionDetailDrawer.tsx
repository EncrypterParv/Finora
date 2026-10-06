import React from "react";
import { TransactionDetail } from "@/types/transaction";
import { formatCurrency } from "@/lib/utils";
import { X, Sparkles, AlertTriangle, TrendingUp, Calendar, Hash, FileText } from "lucide-react";

interface TransactionDetailDrawerProps {
  transaction: TransactionDetail | null;
  onClose: () => void;
}

export const TransactionDetailDrawer: React.FC<TransactionDetailDrawerProps> = ({
  transaction,
  onClose,
}) => {
  if (!transaction) return null;

  const isDebit = transaction.transaction_type === "DEBIT";

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-slate-900 border-l border-slate-800 shadow-2xl z-50 p-6 flex flex-col justify-between overflow-y-auto">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-400">
            Transaction Details
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hero Amount */}
        <div className="py-6 text-center">
          <p className="text-xs text-slate-400 font-medium">{transaction.merchant_name}</p>
          <p
            className={`text-3xl font-bold font-mono mt-1 ${
              isDebit ? "text-slate-100" : "text-emerald-400"
            }`}
          >
            {isDebit ? "-" : "+"}
            {formatCurrency(transaction.amount, transaction.currency)}
          </p>
          <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
            {transaction.category_name}
          </span>
        </div>

        {/* Predictive & Behavioural Intelligence Box */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/40 via-slate-800/60 to-slate-900 border border-indigo-900/40 my-4 space-y-3">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            Financial Intelligence Context
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Category Budget Utilization:</span>
              <span className="font-mono text-slate-200 font-medium">
                {transaction.monthly_budget_utilization_pct || 56.9}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Projected Monthly Spend:</span>
              <span className="font-mono text-slate-200 font-medium">
                {formatCurrency(transaction.projected_monthly_spend || 46500)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Recommended Daily Spend:</span>
              <span className="font-mono text-emerald-400 font-medium">
                {formatCurrency(transaction.recommended_daily_spend || 1200)}
              </span>
            </div>
          </div>
        </div>

        {/* Details List */}
        <div className="space-y-3 pt-2 text-xs">
          <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
            <span className="text-slate-400 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Timestamp
            </span>
            <span className="font-mono text-slate-200">
              {new Date(transaction.occurred_at).toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
            <span className="text-slate-400 flex items-center gap-2">
              <Hash className="w-3.5 h-3.5 text-slate-500" />
              Reference ID
            </span>
            <span className="font-mono text-slate-300 truncate max-w-[180px]">
              {transaction.reference_id}
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
            <span className="text-slate-400 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Source Ingestion
            </span>
            <span className="font-mono text-slate-300">
              {transaction.source}
            </span>
          </div>

          {transaction.tax_info && (
            <div className="p-3 bg-slate-800/40 rounded-lg text-slate-300 space-y-1">
              <p className="text-[11px] font-semibold text-slate-400">GST / Tax Info</p>
              <p>Rate: {transaction.tax_info.gst_rate_pct}%</p>
              <p>Invoice: {transaction.tax_info.tax_invoice_number || "N/A"}</p>
            </div>
          )}
        </div>
      </div>

      <div className="pt-6">
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
        >
          Close Detail View
        </button>
      </div>
    </div>
  );
};
