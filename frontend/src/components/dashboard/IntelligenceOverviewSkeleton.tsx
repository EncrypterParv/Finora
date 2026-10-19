import React from "react";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

const MetricSkeleton = () => (
  <div className="space-y-3">
    <LoadingSkeleton height="h-3" width="w-24" />
    <LoadingSkeleton height="h-7" width="w-32" />
    <LoadingSkeleton height="h-3" width="w-28" />
  </div>
);

const InsightSkeleton = () => (
  <div className="space-y-3">
    <div className="flex items-center justify-between gap-4">
      <LoadingSkeleton height="h-4" width="w-36" />
      <LoadingSkeleton height="h-5" width="w-14" />
    </div>
    <LoadingSkeleton height="h-3" width="w-full" />
    <LoadingSkeleton height="h-3" width="w-4/5" />
  </div>
);

export const IntelligenceOverviewSkeleton: React.FC = () => {
  return (
    <div
      className="space-y-8"
      role="status"
      aria-live="polite"
      aria-label="Loading financial overview"
    >
      <span className="sr-only">Loading financial overview</span>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div className="space-y-3">
          <LoadingSkeleton height="h-7" width="w-72" />
          <LoadingSkeleton height="h-3" width="w-96 max-w-full" />
        </div>
        <div className="space-y-2 md:text-right">
          <LoadingSkeleton height="h-3" width="w-28" />
          <LoadingSkeleton height="h-7" width="w-20" />
          <LoadingSkeleton height="h-3" width="w-32" />
        </div>
      </div>

      <section className="space-y-3" aria-label="Financial position loading">
        <LoadingSkeleton height="h-3" width="w-48" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          {Array.from({ length: 5 }, (_, index) => (
            <MetricSkeleton key={index} />
          ))}
        </div>
      </section>

      <section className="space-y-3" aria-label="Behavioural shifts loading">
        <div className="flex items-center justify-between gap-4">
          <LoadingSkeleton height="h-3" width="w-56" />
          <LoadingSkeleton height="h-3" width="w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }, (_, index) => (
            <InsightSkeleton key={index} />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="space-y-4" aria-label="Spending forecast loading">
          <LoadingSkeleton height="h-4" width="w-52" />
          <LoadingSkeleton height="h-32" />
          <LoadingSkeleton height="h-3" width="w-4/5" />
        </section>
        <section className="space-y-4" aria-label="Spending drivers loading">
          <LoadingSkeleton height="h-4" width="w-48" />
          <LoadingSkeleton height="h-32" />
          <LoadingSkeleton height="h-3" width="w-3/4" />
        </section>
      </div>
    </div>
  );
};
