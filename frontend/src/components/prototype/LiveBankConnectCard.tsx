"use client";

import React, { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  FileUp,
  Lock,
  RotateCw,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { createBankAccount } from "@/lib/api";

interface LiveBankConnectCardProps {
  onConnected?: () => void;
  onAddStatement: () => void;
  onSwitchToDemo?: () => void;
  title?: string;
  description?: string;
}

const SUPPORTED_BANKS = [
  { name: "HDFC Bank", type: "SAVINGS", code: "HDFC", icon: "🏛️" },
  { name: "State Bank of India", type: "SAVINGS", code: "SBI", icon: "🏦" },
  { name: "ICICI Bank", type: "CURRENT", code: "ICICI", icon: "🏢" },
  { name: "Axis Bank", type: "CREDIT", code: "AXIS", icon: "💳" },
];

export function LiveBankConnectCard({
  onConnected,
  onAddStatement,
  onSwitchToDemo,
  title = "Connect Your Bank Account to Activate Live Intelligence",
  description = "The Live Version runs strictly on-device over your verified accounts. Because no bank account is connected yet, your live workspace is currently empty.",
}: LiveBankConnectCardProps) {
  const [connectingBank, setConnectingBank] = useState<string | null>(null);
  const [successBank, setSuccessBank] = useState<string | null>(null);

  const handleInstantConnect = async (bankName: string, type: "SAVINGS" | "CURRENT" | "CREDIT") => {
    setConnectingBank(bankName);
    try {
      const deterministicLast4 = String(1000 + ((bankName.charCodeAt(0) * 137) % 8999));
      await createBankAccount({
        institution_name: bankName,
        account_type: type,
        last_four: deterministicLast4,
      });
      setSuccessBank(bankName);
      setTimeout(() => {
        onConnected?.();
      }, 700);
    } catch {
      // If error occurs, fallback to opening statement add flow
      onAddStatement();
    } finally {
      setConnectingBank(null);
    }
  };

  return (
    <section className="live-bank-connect-card mx-auto max-w-4xl rounded-2xl border border-[#d5d4cc] dark:border-[#282d3f] bg-white dark:bg-[#12141c] p-6 md:p-10 shadow-sm transition-all">
      {/* Top Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eeede8] dark:border-[#232736] pb-5">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-[#2563eb] animate-pulse" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#2563eb] dark:text-[#60a5fa]">
            LIVE VERSION • BANK ACCOUNT REQUIRED
          </span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-[#cbd5e1] dark:border-[#2f364d] bg-[#f8fafc] dark:bg-[#181b26] px-3 py-1 text-[11px] text-[#475569] dark:text-[#cbd5e1]">
          <ShieldCheck size={14} className="text-[#16a34a] dark:text-[#34d399]" />
          <span>Kiteworks Zero-Trust Isolation Active</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="mt-6">
        <h2 className="text-2xl font-bold tracking-tight text-[#20211f] dark:text-[#f8fafc]">
          {title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#575953] dark:text-[#94a3b8]">
          {description}
        </p>

        {/* Bank Connection Options Grid */}
        <div className="mt-7">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#62645d] dark:text-[#cbd5e1]">
            Select Bank Adapter (Simulated Instant Connect):
          </span>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {SUPPORTED_BANKS.map((b) => {
              const isConnecting = connectingBank === b.name;
              const isDone = successBank === b.name;
              return (
                <button
                  key={b.name}
                  type="button"
                  onClick={() =>
                    handleInstantConnect(
                      b.name,
                      b.type as "SAVINGS" | "CURRENT" | "CREDIT"
                    )
                  }
                  disabled={Boolean(connectingBank)}
                  className="flex flex-col items-start rounded-xl border border-[#e5e4de] dark:border-[#282d3f] bg-[#fbfbf9] dark:bg-[#181b26] p-4 text-left transition-all hover:border-[#2563eb] dark:hover:border-[#3b82f6] hover:shadow-md disabled:opacity-60"
                >
                  <span className="text-2xl" aria-hidden="true">
                    {b.icon}
                  </span>
                  <strong className="mt-2 block text-sm font-semibold text-[#20211f] dark:text-[#f8fafc]">
                    {b.name}
                  </strong>
                  <span className="text-[11px] text-[#62645d] dark:text-[#94a3b8]">
                    {b.type === "CREDIT" ? "Credit Card" : `${b.type.toLowerCase()} account`}
                  </span>
                  <div className="mt-3 flex items-center gap-1 text-xs font-medium text-[#2563eb] dark:text-[#60a5fa]">
                    {isConnecting ? (
                      <>
                        <RotateCw size={12} className="animate-spin" /> Connecting…
                      </>
                    ) : isDone ? (
                      <>
                        <CheckCircle2 size={12} className="text-[#16a34a]" /> Connected!
                      </>
                    ) : (
                      <>
                        Connect <ArrowRight size={12} />
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onAddStatement}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#20211f] dark:bg-white px-5 py-2.5 text-sm font-semibold text-white dark:text-[#090a0f] shadow-sm hover:opacity-90 transition-opacity"
          >
            <FileUp size={16} />
            <span>Upload Bank Statement (CSV / PDF)</span>
          </button>

          {onSwitchToDemo && (
            <button
              type="button"
              onClick={onSwitchToDemo}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#cbd5e1] dark:border-[#2f364d] bg-white dark:bg-[#181b26] px-4 py-2.5 text-sm font-medium text-[#0f172a] dark:text-[#f8fafc] hover:bg-[#f8fafc] dark:hover:bg-[#232736] transition-colors"
            >
              <Zap size={16} className="text-amber-500" />
              <span>Preview 10-Year Demo Version</span>
            </button>
          )}
        </div>

        {/* Zero-Leakage & Privacy Note */}
        <div className="mt-8 rounded-xl border border-[#e5e4de] dark:border-[#232736] bg-[#fbfbf9] dark:bg-[#181b26] p-4 text-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#20211f] dark:text-[#f8fafc]">
            <Lock size={14} className="text-[#2563eb] dark:text-[#60a5fa]" />
            <span>How Finora Live Ingestion Works</span>
          </div>
          <p className="mt-1.5 leading-relaxed text-[#575953] dark:text-[#94a3b8]">
            In Live Mode, all bank accounts and statements are sanitized inside the local Kiteworks Zero-Trust Quarantine Perimeter. Your credentials and personal identifiers never leave your browser or server process. Once connected, the local ML engine automatically computes your 5-year and 10-year forecasts.
          </p>
        </div>
      </div>
    </section>
  );
}
