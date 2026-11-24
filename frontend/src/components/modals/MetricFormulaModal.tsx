"use client";

import React, { useEffect, useRef } from "react";
import {
  CheckCircle2,
  ShieldCheck,
  X,
} from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";

export interface MetricFormulaData {
  title: string;
  value?: string;
  unit?: string;
  category?: string;
  formula: string;
  simplifiedEquation?: string;
  inputs: {
    label: string;
    value: string;
    note?: string;
  }[];
  explanation: string;
  methodology?: string;
  steps?: string[];
  notes?: string;
  privacyNote?: string;
}

interface MetricFormulaModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: MetricFormulaData | null;
}

export function MetricFormulaModal({
  isOpen,
  onClose,
  data,
}: MetricFormulaModalProps) {
  const { theme } = useTheme();
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    // Focus close button on open
    const timer = setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timer);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !data) return null;

  const isAmoled = theme === "amoled";
  const isDark = theme === "dark" || isAmoled;
  const isFin = theme === "fin";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="formula-modal-title"
    >
      {/* Blurred Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Surface */}
      <div
        ref={modalRef}
        className={`relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border shadow-2xl transition-all animate-in zoom-in-95 duration-200 ${
          isAmoled
            ? "border-[#222222] bg-[#050505] text-[#ffffff]"
            : isDark
            ? "border-[#262833] bg-[#121318] text-[#f3f4f6]"
            : "border-[#e5e4de] bg-white text-[#20211f]"
        }`}
      >
        {/* Header Bar */}
        <div
          className={`flex items-center justify-between border-b px-6 py-4.5 ${
            isAmoled
              ? "border-[#1c1c1c] bg-[#0a0a0a]"
              : isDark
              ? "border-[#22242e] bg-[#161820]"
              : "border-[#eeede8] bg-[#faf9f5]"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-lg font-serif text-sm font-bold ${
                isAmoled
                  ? "bg-[#1f1f1f] text-white"
                  : isDark
                  ? "bg-[#252836] text-white"
                  : "bg-[#f0e9da] text-[#755727]"
              }`}
            >
              ƒ(x)
            </span>
            <div>
              <p
                className={`text-[10px] font-bold uppercase tracking-widest ${
                  isFin ? "text-[#755727]" : "text-[#10b981]"
                }`}
              >
                {data.category || "Financial Calculation Engine"}
              </p>
              <h2
                id="formula-modal-title"
                className="text-base font-semibold tracking-tight"
              >
                {data.title}
              </h2>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className={`rounded-lg p-1.5 transition-colors ${
              isDark
                ? "text-slate-400 hover:bg-white/10 hover:text-white"
                : "text-stone-500 hover:bg-stone-200 hover:text-stone-900"
            }`}
            aria-label="Close formula details"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="max-h-[75vh] overflow-y-auto p-6 space-y-6">
          {/* Result Highlight */}
          <div
            className={`rounded-xl border p-4 flex items-center justify-between gap-4 ${
              isAmoled
                ? "border-[#1f1f1f] bg-[#0c0c0c]"
                : isDark
                ? "border-[#22242e] bg-[#171922]"
                : "border-[#e5e4de] bg-[#fbfbf9]"
            }`}
          >
            <div>
              <span className="text-xs text-stone-500 dark:text-slate-400 font-medium">
                Current Calculated Value
              </span>
              <p className="mt-0.5 text-2xl font-bold font-mono tracking-tight tabular-nums">
                {data.value}
                {data.unit && (
                  <span className="ml-1 text-sm font-sans font-normal text-stone-500">
                    {data.unit}
                  </span>
                )}
              </p>
            </div>
            <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 size={13} />
              <span>Verified Exact</span>
            </div>
          </div>

          {/* Mathematical Formula Box */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500 mb-2">
              Mathematical Formula
            </h3>
            <div
              className={`rounded-xl border p-4 font-mono text-sm leading-relaxed ${
                isAmoled
                  ? "border-[#262626] bg-[#000000] text-emerald-400"
                  : isDark
                  ? "border-[#282d3f] bg-[#0e0f14] text-emerald-300"
                  : "border-[#e5e4de] bg-[#faf9f5] text-[#755727]"
              }`}
            >
              <div className="font-semibold text-base mb-1">{data.formula}</div>
              {data.simplifiedEquation && (
                <p className="text-xs opacity-80 mt-1">
                  Simplified: {data.simplifiedEquation}
                </p>
              )}
            </div>
          </div>

          {/* Dynamic Inputs Table */}
          {data.inputs && data.inputs.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500 mb-2">
                Active Variable Inputs
              </h3>
              <div
                className={`divide-y rounded-xl border text-xs overflow-hidden ${
                  isAmoled
                    ? "border-[#222222] divide-[#1f1f1f] bg-[#0a0a0a]"
                    : isDark
                    ? "border-[#232736] divide-[#1f2230] bg-[#151720]"
                    : "border-[#e5e4de] divide-[#eeede8] bg-[#ffffff]"
                }`}
              >
                {data.inputs.map((inp, idx) => (
                  <div
                    key={idx}
                    className="flex flex-wrap items-center justify-between gap-2 p-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    <div>
                      <span className="font-medium text-stone-700 dark:text-slate-300">
                        {inp.label}
                      </span>
                      {inp.note && (
                        <p className="text-[11px] text-stone-400 dark:text-slate-500">
                          {inp.note}
                        </p>
                      )}
                    </div>
                    <span className="font-mono font-bold text-stone-900 dark:text-white tabular-nums">
                      {inp.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Explanation & Financial Logic */}
          <div className="space-y-3 text-xs leading-relaxed text-stone-600 dark:text-slate-300">
            <div>
              <h3 className="font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500 mb-1">
                How It Works
              </h3>
              <p>{data.explanation}</p>
            </div>

            {data.steps && data.steps.length > 0 && (
              <div>
                <h3 className="font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500 mb-1">
                  Computation Steps
                </h3>
                <ol className="list-decimal list-inside space-y-1 text-stone-600 dark:text-slate-300">
                  {data.steps.map((st, i) => (
                    <li key={i}>{st}</li>
                  ))}
                </ol>
              </div>
            )}

            {data.methodology && (
              <div>
                <h3 className="font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500 mb-1">
                  Accounting & Statistical Methodology
                </h3>
                <p className="text-stone-500 dark:text-slate-400">
                  {data.methodology}
                </p>
              </div>
            )}
          </div>

          {/* Privacy & Air-Gap Guarantee */}
          <div
            className={`rounded-xl border p-3.5 flex items-start gap-3 text-xs ${
              isAmoled
                ? "border-[#222222] bg-[#090909] text-stone-400"
                : isDark
                ? "border-[#262836] bg-[#141620] text-slate-400"
                : "border-[#e5e4de] bg-[#fbfbf9] text-[#575953]"
            }`}
          >
            <ShieldCheck size={18} className="text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-stone-900 dark:text-slate-200 block font-semibold">
                Air-Gapped Local Computation
              </strong>
              <p className="mt-0.5 text-[11px] leading-relaxed">
                {data.privacyNote ||
                  "Derived strictly on-device using local Python deterministic rules and statistical non-parametric bootstrap sampling. Raw financial rows never leave your machine."}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`flex items-center justify-end border-t px-6 py-3.5 ${
            isAmoled
              ? "border-[#1c1c1c] bg-[#080808]"
              : isDark
              ? "border-[#22242e] bg-[#141620]"
              : "border-[#eeede8] bg-[#faf9f5]"
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
              isAmoled
                ? "bg-white text-black hover:bg-slate-200"
                : isDark
                ? "bg-white text-slate-900 hover:bg-slate-200"
                : isFin
                ? "bg-[#20211f] text-white hover:bg-[#343530]"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
