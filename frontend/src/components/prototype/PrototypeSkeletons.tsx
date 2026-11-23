import type { ReactNode } from "react";
import "./workspace-overview.css";

function Block({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`prototype-skeleton ${className}`} />;
}

function PageHeaderSkeleton() {
  return <div className="mb-7" aria-hidden="true"><Block className="h-8 w-56" /><Block className="mt-3 h-4 w-[min(34rem,90%)]" /></div>;
}

function LoadingStatus({ children }: { children: ReactNode }) {
  return <span className="sr-only" role="status" aria-live="polite">{children}</span>;
}

export function OverviewChartsSkeleton() {
  return <div className="workspace-analysis" aria-hidden="true">
    <div className="workspace-card workspace-chart"><Block className="h-5 w-28" /><Block className="mt-6 h-44 w-full" /></div>
    <div className="workspace-card workspace-chart"><Block className="h-5 w-32" /><Block className="mx-auto mt-5 size-36 rounded-full" /></div>
  </div>;
}

export function OverviewSummarySkeleton() {
  return <div aria-busy="true" className="workspace-overview-loading">
    <LoadingStatus>Loading monthly overview</LoadingStatus>
    <OverviewFiguresSkeleton />
    <OverviewChartsSkeleton />
  </div>;
}

function OverviewFiguresSkeleton() {
  return <div className="workspace-metrics" aria-hidden="true">
    {[0, 1, 2, 3].map((item) => <div key={item} className="workspace-card workspace-metric"><Block className="h-4 w-20" /><Block className="mt-4 h-8 w-24" /><Block className="mt-4 h-8 w-full" /></div>)}
  </div>;
}

export function WorkspaceLoadingSkeleton({ insideShell = false }: { insideShell?: boolean } = {}) {
  return <div className={insideShell ? "min-h-[55vh]" : "finora-prototype min-h-screen bg-[#f5f4f0] p-4 md:pl-[268px] md:pr-8 md:pt-8"} data-section="overview" aria-busy="true">
    <LoadingStatus>Loading your workspace</LoadingStatus>
    {!insideShell && <>
      <aside aria-hidden="true" className="prototype-skeleton-sidebar fixed inset-y-0 left-0 hidden w-[244px] flex-col gap-7 p-6 md:flex">
        <Block className="h-8 w-32" />
        <div className="space-y-4">{[0, 1, 2, 3, 4, 5, 6].map((item) => <Block key={item} className="h-10 w-full" />)}</div>
        <Block className="mt-auto h-10 w-full" />
      </aside>
      <div className="prototype-skeleton-panel mb-6 hidden h-14 items-center justify-between px-5 md:flex" aria-hidden="true"><Block className="h-5 w-24" /><Block className="h-4 w-36" /></div>
    </>}
    <PageHeaderSkeleton />
    <div className="workspace-overview-loading"><OverviewFiguresSkeleton /><OverviewChartsSkeleton /></div>
    <div className="prototype-skeleton-panel mt-6 p-5 md:p-6" aria-hidden="true"><div className="flex items-center justify-between"><Block className="h-5 w-44" /><Block className="h-4 w-24" /></div><div className="mt-5 divide-y divide-[#e5e4de]">{[0, 1, 2, 3, 4].map((item) => <div key={item} className="flex items-center justify-between gap-4 py-4"><div className="min-w-0 flex-1"><Block className="h-4 w-3/5" /><Block className="mt-2 h-3 w-2/5" /></div><Block className="h-4 w-20" /></div>)}</div></div>
  </div>;
}

export function SectionLoadingSkeleton() {
  return <div aria-busy="true"><LoadingStatus>Opening this workspace section</LoadingStatus><PageHeaderSkeleton /><div className="grid gap-4 md:grid-cols-2" aria-hidden="true">{[0, 1, 2, 3].map((item) => <div key={item} className="prototype-skeleton-panel p-5"><Block className="h-4 w-32" /><Block className="mt-5 h-7 w-40" /><Block className="mt-3 h-3 w-full" /><Block className="mt-2 h-3 w-4/5" /></div>)}</div></div>;
}

export function CollectionLoadingSkeleton({ label }: { label: string }) {
  return <div aria-busy="true"><LoadingStatus>{label}</LoadingStatus><div className="grid gap-4 lg:grid-cols-2" aria-hidden="true">{[0, 1, 2, 3].map((item) => <div key={item} className="prototype-skeleton-panel p-5"><div className="flex justify-between"><Block className="h-5 w-36" /><Block className="h-9 w-20" /></div><Block className="mt-5 h-8 w-40" /><Block className="mt-3 h-3 w-full" /><Block className="mt-3 h-2 w-full rounded-full" /><Block className="mt-4 h-3 w-3/4" /></div>)}</div></div>;
}

export function TransactionsLoadingSkeleton() {
  return <div className="prototype-skeleton-panel p-5" aria-busy="true"><LoadingStatus>Loading transactions</LoadingStatus><div aria-hidden="true" className="divide-y divide-[#e5e4de]">{[0, 1, 2, 3, 4, 5].map((item) => <div key={item} className="flex items-center gap-3 py-4"><Block className="hidden h-4 w-16 sm:block" /><div className="min-w-0 flex-1"><Block className="h-4 w-3/5" /><Block className="mt-2 h-3 w-2/5" /></div><Block className="h-4 w-20" /><Block className="h-9 w-9 rounded-md" /></div>)}</div></div>;
}

export function CalendarLoadingSkeleton() {
  return <div className="prototype-skeleton-panel p-4 md:p-5" aria-busy="true"><LoadingStatus>Loading your calendar</LoadingStatus><div aria-hidden="true"><div className="flex justify-between"><Block className="h-10 w-44" /><Block className="h-10 w-48" /></div><div className="mt-5 grid grid-cols-7 gap-2">{Array.from({ length: 35 }, (_, item) => <Block key={item} className="aspect-square rounded-md" />)}</div></div></div>;
}

export function InsightsLoadingSkeleton() {
  return <div aria-busy="true"><LoadingStatus>Calculating your insights</LoadingStatus><div aria-hidden="true" className="grid gap-4 lg:grid-cols-2"><div className="prototype-skeleton-panel p-5 md:p-6"><Block className="h-5 w-48" /><Block className="mt-6 h-10 w-40" /><Block className="mt-5 h-3 w-full" /><Block className="mt-6 h-3 w-4/5" /><Block className="mt-3 h-3 w-3/5" /></div><div className="prototype-skeleton-panel p-5 md:p-6"><Block className="h-5 w-44" /><Block className="mt-6 h-10 w-32" />{[0, 1, 2].map((item) => <Block key={item} className="mt-4 h-3 w-full" />)}</div></div><div aria-hidden="true" className="prototype-skeleton-panel mt-4 p-5"><Block className="h-5 w-40" />{[0, 1, 2].map((item) => <div key={item} className="mt-5"><Block className="h-4 w-2/3" /><Block className="mt-2 h-3 w-full" /></div>)}</div></div>;
}
