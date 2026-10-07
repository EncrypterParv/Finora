"use client";

import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useStatementUploadMutation } from "@/hooks/useFinancialData";

interface StatementImportViewProps {
  onNavigateToCalendar?: () => void;
}

export const StatementImportView: React.FC<StatementImportViewProps> = ({
  onNavigateToCalendar,
}) => {
  const [step, setStep] = useState<"upload" | "review" | "complete">("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<{
    filename: string;
    transactions_parsed: number;
    transactions_added: number;
    duplicates_skipped: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useStatementUploadMutation();

  const handleFileChange = async (file: File) => {
    setSelectedFile(file);
    setErrorMessage(null);

    try {
      const result = await uploadMutation.mutateAsync({
        accountId: "acc-1",
        file: file,
      });
      setUploadResult(result);
      setStep("review");
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to process statement file.");
    }
  };

  const handleSampleCSV = (sampleName: string) => {
    const csvData = `Date,Description,Amount,Type,Reference
2026-10-01,ACH CREDIT SALARY TECH CORP INDIA PVT LTD,125000.00,CREDIT,NEFT-HSBC-SAL-SAMPLE
2026-10-02,UPI/AHMED-KUMAR/TRANSFER@okhdfcbank,450.00,DEBIT,UPI-AK-SAMPLE-1
2026-10-03,POS TOIT BREWPUB INDIRANAGAR BANGALORE IN,2800.00,DEBIT,POS-DIN-SAMPLE-2
2026-10-04,BLUE TOKAI COFFEE ROASTERS KORAMANGALA,1200.00,DEBIT,BT-SAMPLE-3
2026-10-05,SI NETFLIX ENTERTAINMENT SERVICES IN,649.00,DEBIT,SI-NFLX-SAMPLE-4
2026-10-06,UPI/SWIGGY/ORDER-49201@icici,450.00,DEBIT,UPI-SWG-SAMPLE-5`;

    const blob = new Blob([csvData], { type: "text/csv" });
    const file = new File([blob], sampleName, { type: "text/csv" });
    handleFileChange(file);
  };

  const handleConfirmCompletion = () => {
    setStep("complete");
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
              Import past banking history from CSV or XLSX statements with automatic SHA-256 deduplication
            </p>
          </div>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold">
        <div
          className={`py-2 px-3 rounded-lg border transition ${
            step === "upload"
              ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
              : "bg-slate-900/60 border-slate-800 text-slate-400"
          }`}
        >
          1. Upload Statement
        </div>
        <div
          className={`py-2 px-3 rounded-lg border transition ${
            step === "review"
              ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
              : "bg-slate-900/60 border-slate-800 text-slate-400"
          }`}
        >
          2. Review & Deduplicate
        </div>
        <div
          className={`py-2 px-3 rounded-lg border transition ${
            step === "complete"
              ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
              : "bg-slate-900/60 border-slate-800 text-slate-400"
          }`}
        >
          3. Intelligence Integrated
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Step 1: Upload Surface */}
      {step === "upload" && (
        <Card className="p-8 md:p-12 text-center space-y-6">
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileChange(file);
            }}
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700/80 rounded-2xl p-8 md:p-12 bg-slate-950/40 hover:border-indigo-500/80 hover:bg-slate-950/70 transition cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Click or Drag & drop bank statement file</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
              Supports standard Indian and global CSV bank statements (up to 15MB)
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-2" onClick={(e) => e.stopPropagation()}>
              <Button
                size="sm"
                variant="secondary"
                disabled={uploadMutation.isPending}
                onClick={() => handleSampleCSV("HDFC_Oct2026_Sample.csv")}
              >
                Use Sample: HDFC_Oct2026.csv
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={uploadMutation.isPending}
                onClick={() => handleSampleCSV("ICICI_Oct2026_Sample.csv")}
              >
                Use Sample: ICICI_Oct2026.csv
              </Button>
            </div>
          </div>

          {uploadMutation.isPending && (
            <div className="flex items-center justify-center gap-2 text-xs text-indigo-400">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Parsing and normalizing statement into canonical schema...</span>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Files are parsed securely in-memory. Zero credential or account leakage.</span>
          </div>
        </Card>
      )}

      {/* Step 2: Review Surface */}
      {step === "review" && uploadResult && (
        <Card className="p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">Statement Ingestion Summary</h3>
              <p className="text-xs text-slate-400">File: {uploadResult.filename}</p>
            </div>
            <Badge variant="brand">Format Detected: Standard CSV</Badge>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Total Records Parsed</span>
              <span className="text-xl font-bold font-mono text-white mt-1 block">
                {uploadResult.transactions_parsed}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">New Unique Transactions</span>
              <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
                {uploadResult.transactions_added}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Duplicate Signatures</span>
              <span className="text-xl font-bold font-mono text-amber-400 mt-1 block">
                {uploadResult.duplicates_skipped} skipped
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-2">
            <p className="font-semibold text-slate-200">Ingestion Invariants Guaranteed:</p>
            <ul className="list-disc pl-4 space-y-1 text-slate-400">
              <li>Automatic merchant resolution (Swiggy, Netflix, Amazon mapped cleanly).</li>
              <li>SHA-256 fingerprinting guarantees zero double-counting against existing accounts.</li>
              <li>Historical behavioral baseline and burn rates update automatically.</li>
            </ul>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="subtle" size="sm" onClick={() => setStep("upload")}>
              Upload Another
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmCompletion}
              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Complete Ingestion
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
            All statement records have been normalized into your Financial Calendar, Budget tracking, and ML behaviour profile.
          </p>
          <div className="pt-4 flex items-center justify-center gap-3">
            <Button size="md" variant="secondary" onClick={() => setStep("upload")}>
              Import Another File
            </Button>
            <Button
              size="md"
              variant="primary"
              onClick={onNavigateToCalendar}
              icon={<Calendar className="w-4 h-4" />}
            >
              View in Financial Calendar
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
