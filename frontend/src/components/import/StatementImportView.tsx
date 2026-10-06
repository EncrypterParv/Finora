"use client";

import React, { useState } from "react";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, RefreshCw, ArrowRight, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export const StatementImportView: React.FC = () => {
  const [step, setStep] = useState<"upload" | "review" | "complete">("upload");
  const [fileName, setFileName] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleSimulatedUpload = (name: string) => {
    setFileName(name);
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setStep("review");
    }, 1200);
  };

  const handleConfirmImport = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setStep("complete");
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                Statement Ingestion Portal
              </h1>
              <Badge variant="brand">Multi-Format</Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Import past banking history from CSV, Excel (XLSX), or PDF statements with automatic deduplication
            </p>
          </div>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold">
        <div
          className={`py-2 px-3 rounded-lg border ${
            step === "upload"
              ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
              : "bg-slate-900/60 border-slate-800 text-slate-400"
          }`}
        >
          1. Upload Statement
        </div>
        <div
          className={`py-2 px-3 rounded-lg border ${
            step === "review"
              ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
              : "bg-slate-900/60 border-slate-800 text-slate-400"
          }`}
        >
          2. Review & Deduplicate
        </div>
        <div
          className={`py-2 px-3 rounded-lg border ${
            step === "complete"
              ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
              : "bg-slate-900/60 border-slate-800 text-slate-400"
          }`}
        >
          3. Intelligence Integrated
        </div>
      </div>

      {/* Step 1: Upload Surface */}
      {step === "upload" && (
        <Card className="p-8 md:p-12 text-center space-y-6">
          <div className="border-2 border-dashed border-slate-700/80 rounded-2xl p-8 md:p-12 bg-slate-950/40 hover:border-indigo-500/80 transition cursor-pointer">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Drag & drop your bank statement file</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
              Supports CSV, XLSX, and standard Indian/Global bank PDF statements (up to 15MB)
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={isProcessing}
                onClick={() => handleSimulatedUpload("HDFC_Savings_2025-2026.csv")}
              >
                Sample: HDFC_Savings_2025.csv
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={isProcessing}
                onClick={() => handleSimulatedUpload("ICICI_Statement_Q3.xlsx")}
              >
                Sample: ICICI_Statement_Q3.xlsx
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Files are parsed securely in-memory. Zero credential or account leakage.</span>
          </div>
        </Card>
      )}

      {/* Step 2: Review Surface */}
      {step === "review" && (
        <Card className="p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">Statement Ingestion Summary</h3>
              <p className="text-xs text-slate-400">File: {fileName}</p>
            </div>
            <Badge variant="brand">Format Detected: Standard CSV</Badge>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Total Records</span>
              <span className="text-xl font-bold font-mono text-white mt-1 block">184</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">New Unique Transactions</span>
              <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">172</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Duplicate Signatures</span>
              <span className="text-xl font-bold font-mono text-amber-400 mt-1 block">12 skipped</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-2">
            <p className="font-semibold text-slate-200">Ingestion Invariants Guaranteed:</p>
            <ul className="list-disc pl-4 space-y-1 text-slate-400">
              <li>Automatic merchant resolution (Swiggy, Netflix, Amazon mapped cleanly).</li>
              <li>SHA-256 fingerprinting guarantees zero double-counting against existing accounts.</li>
              <li>Historical behavioral baseline and burn rates will update immediately.</li>
            </ul>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="subtle" size="sm" onClick={() => setStep("upload")}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={isProcessing}
              onClick={handleConfirmImport}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? "animate-spin" : ""}`} />}
            >
              {isProcessing ? "Normalizing & Storing..." : "Confirm & Import 172 Transactions"}
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Complete Surface */}
      {step === "complete" && (
        <Card className="p-8 md:p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Import Successfully Completed</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            172 new canonical transactions have been integrated into your Financial Calendar, Budget tracking, and ML behaviour profile.
          </p>
          <div className="pt-4">
            <Button size="md" variant="primary" onClick={() => setStep("upload")}>
              Import Another File
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
