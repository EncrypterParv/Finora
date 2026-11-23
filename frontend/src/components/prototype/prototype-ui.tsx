"use client";

import { ArrowRight } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

// Shared building blocks for the signed-in workspace screens, so every screen keeps the same look.

export function PageTitle({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="prototype-page-title mb-7 flex flex-wrap items-end justify-between gap-4"><div><span className="prototype-eyebrow">Your finances, in context</span><h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#777067]">{description}</p></div>{action && <div className="flex flex-wrap gap-2">{action}</div>}</div>;
}

export function EmptyPanel({ title, body, onAdd, actionLabel = "Add a bank statement" }: { title: string; body: string; onAdd?: () => void; actionLabel?: string }) {
  return <section className="rounded-xl border border-[#e8e4dc] bg-white px-6 py-9"><h2 className="text-lg font-semibold">{title}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[#766e65]">{body}</p>{onAdd && <button type="button" onClick={onAdd} className="prototype-inline-link mt-4 inline-flex items-center gap-1 text-sm font-medium">{actionLabel} <ArrowRight size={14} /></button>}</section>;
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-[#e8e4dc] bg-white ${className}`}>{children}</section>;
}

export function PrimaryButton({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" {...props} className={`prototype-primary-action inline-flex items-center justify-center gap-2 rounded-md bg-[#4e342e] px-3.5 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 ${className}`} />;
}

export function SecondaryButton({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" {...props} className={`prototype-secondary-action inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#ddd6cb] bg-white px-3.5 py-2.5 text-sm text-[#433b35] disabled:cursor-not-allowed disabled:opacity-50 ${className}`} />;
}

// Small icon-only button for row actions such as edit or delete; `label` is read by screen readers.
export function IconButton({ label, className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return <button type="button" aria-label={label} title={label} {...props} className={`prototype-icon-action grid h-10 w-10 shrink-0 place-items-center rounded-md text-[#8a7a6d] disabled:opacity-40 ${className}`}>{children}</button>;
}

export function Field({ label, hint, children, className = "" }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return <label className={`block text-xs font-medium text-[#655c54] ${className}`}>{label}{children}{hint && <span className="mt-1 block font-normal text-[#8b7d71]">{hint}</span>}</label>;
}

export const inputClass = "prototype-field mt-1.5 block min-h-11 w-full rounded-md border border-[#ddd6cb] bg-white px-3 text-sm font-normal";

export function ErrorNote({ message }: { message: string }) {
  return <p role="alert" className="mt-4 rounded-md bg-[#fdebec] p-3 text-sm text-[#9f2f2d]">{message}</p>;
}

export function SuccessNote({ message }: { message: string }) {
  return <p role="status" className="mt-4 rounded-md bg-[#edf5ed] p-3 text-sm text-[#3e6545]">{message}</p>;
}

// Inline "are you sure?" strip shown in place, instead of a pop-up dialog.
export function ConfirmStrip({ message, confirmLabel, onConfirm, onCancel, working }: { message: ReactNode; confirmLabel: string; onConfirm: () => void; onCancel: () => void; working?: boolean }) {
  return <div role="alertdialog" aria-live="polite" className="mt-3 rounded-lg border border-[#ead7d2] bg-[#fdf6f4] p-3.5 text-sm">
    <p className="leading-6 text-[#6d3a32]">{message}</p>
    <div className="mt-3 flex flex-wrap gap-2">
      <button type="button" onClick={onConfirm} disabled={working} className="prototype-danger-action inline-flex min-h-10 items-center rounded-md bg-[#9f2f2d] px-3.5 text-sm font-medium text-white disabled:opacity-60">{working ? "Deleting…" : confirmLabel}</button>
      <button type="button" onClick={onCancel} disabled={working} className="inline-flex min-h-10 items-center rounded-md border border-[#ddd6cb] bg-white px-3.5 text-sm">Keep it</button>
    </div>
  </div>;
}

// Straight progress track. `tone` signals state: on track, close to the limit, or over it.
export function ProgressBar({ value, tone = "steady", label }: { value: number; tone?: "steady" | "caution" | "over" | "done"; label: string }) {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return <div className="prototype-progress" data-tone={tone} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(clamped)}><span style={{ width: `${clamped}%` }} /></div>;
}

// The API sends money as strings (e.g. "1250.00"); turn them into numbers before doing maths.
export function toNumber(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

// Whole rupees print without decimals (₹420); anything with paise prints both digits (₹474.50).
export function money(value: unknown, currency = "INR", fractionDigits = 0): string {
  const amount = toNumber(value);
  const minimumFractionDigits = fractionDigits > 0 && !Number.isInteger(amount) ? fractionDigits : 0;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: fractionDigits, minimumFractionDigits }).format(amount);
}

// Today's date in the person's own timezone, as yyyy-mm-dd.
export function todayIso(): string {
  const now = new Date();
  return toIso(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function toIso(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// Formats a yyyy-mm-dd (or full ISO) value without shifting it across timezones.
export function formatDate(value: string | null | undefined, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }): string {
  if (!value) return "";
  // A timestamp without a timezone (e.g. "2026-11-14T00:00:00") is UTC from the API; mark it so the
  // browser doesn't read it as local time and shift it to the previous day.
  const hasZone = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(value);
  const date = new Date(value.length === 10 ? `${value}T00:00:00Z` : hasZone ? value : `${value}Z`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", { ...options, timeZone: "UTC" });
}
