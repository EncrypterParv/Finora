import React from "react";
import { CalendarEventBlock } from "@/types/calendar";
import { formatCurrency } from "@/lib/utils";

interface TransactionEventBlockProps {
  event: CalendarEventBlock;
  onClick?: (id: string) => void;
}

export const TransactionEventBlockView: React.FC<TransactionEventBlockProps> = ({
  event,
  onClick,
}) => {
  const isDebit = event.transaction_type === "DEBIT";

  return (
    <div
      onClick={() => onClick?.(event.id)}
      className={`group relative flex items-center justify-between p-2.5 my-1 rounded-lg border cursor-pointer transition-all duration-150 hover:shadow-md ${
        isDebit
          ? "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-100"
          : "bg-emerald-950/30 border-emerald-900/50 hover:border-emerald-700 text-emerald-300"
      }`}
      style={{
        borderLeftWidth: "4px",
        borderLeftColor: event.category_color || (isDebit ? "#EF4444" : "#10B981"),
      }}
    >
      <div className="flex items-center space-x-2.5 min-w-0">
        <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">
          {event.time_label}
        </span>
        <div className="truncate">
          <p className="text-xs font-medium text-slate-200 truncate group-hover:text-white">
            {event.merchant_name}
          </p>
          <p className="text-[10px] text-slate-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: event.category_color }} />
            {event.category_name}
          </p>
        </div>
      </div>

      <div className="text-right pl-2 shrink-0">
        <span
          className={`text-xs font-semibold font-mono ${
            isDebit ? "text-slate-100" : "text-emerald-400"
          }`}
        >
          {isDebit ? "-" : "+"}
          {formatCurrency(event.amount, event.currency)}
        </span>
      </div>
    </div>
  );
};
