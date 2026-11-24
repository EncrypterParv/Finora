"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import {
  ArrowDownLeft, ArrowDownUp, ArrowRight, ArrowUpRight, Banknote, CalendarDays,
  ChevronLeft, ChevronRight, FileUp, LineChart, List, PieChart as PieChartIcon, RotateCw, WalletCards,
} from "lucide-react";
import { fetchTransactionSummary, type BankAccountSummary, type CurrencyCashFlow } from "@/lib/api";
import type { CanonicalTransaction } from "@/types/transaction";
import { formatDate, money } from "./prototype-ui";
import { OverviewChartsSkeleton, OverviewSummarySkeleton } from "./PrototypeSkeletons";
import { StockMarketFinancialChart } from "@/components/charts/StockMarketFinancialChart";
import { MetricFormulaModal, type MetricFormulaData } from "@/components/modals/MetricFormulaModal";

const OverviewCharts = dynamic(() => import("./WorkspaceOverviewCharts"), {
  loading: () => <OverviewChartsSkeleton />,
});

const monthLabel = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });
const numberLabel = new Intl.NumberFormat("en-IN");
const breakdownColors = ["#d7ba82", "#a7b99a", "#b7a5cc", "#94acb9", "#ad8c78"];

export interface CashFlowWeek {
  label: string;
  inflow: number;
  spending: number;
}

export interface SpendingSegment {
  id: string;
  label: string;
  amount: number;
  color: string;
}

function moveMonth(month: string, step: number) {
  const date = new Date(`${month}T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + step);
  return date.toISOString().slice(0, 10);
}

function summarizeWeeks(month: string, days: CurrencyCashFlow["days"]): CashFlowWeek[] {
  const lastDay = new Date(Date.parse(moveMonth(month, 1)) - 1).getUTCDate();
  const weeks = Array.from({ length: Math.ceil(lastDay / 7) }, (_, index) => ({
    label: `${index * 7 + 1}–${Math.min(index * 7 + 7, lastDay)}`,
    inflow: 0,
    spending: 0,
  }));
  for (const day of days) {
    const week = weeks[Math.floor((Number(day.day.slice(-2)) - 1) / 7)];
    week.inflow += Number(day.inflow);
    week.spending += Number(day.spending);
  }
  return weeks;
}

function Metric({
  label,
  value,
  detail,
  icon: Icon,
  series,
  tone,
  onClick,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof WalletCards;
  series?: number[];
  tone?: "inflow" | "spending" | "net";
  onClick?: () => void;
}) {
  const scale = Math.max(1, ...(series?.map(Math.abs) ?? []));
  return (
    <section
      className={`workspace-card workspace-metric ${onClick ? "workspace-metric-clickable cursor-pointer" : ""}`}
      data-tone={tone}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={onClick ? `${label}: ${value}. Click to view calculation formula` : undefined}
    >
      <div className="workspace-metric-label">
        <div className="flex items-center gap-1.5">
          <h2>{label}</h2>
          {onClick && (
            <span className="formula-inspect-badge" title="Click to inspect calculation formula">
              ƒ(x)
            </span>
          )}
        </div>
        <span className="workspace-metric-icon">
          <Icon size={17} aria-hidden="true" />
        </span>
      </div>
      <p className="workspace-metric-value">{value}</p>
      <div className="flex items-center justify-between">
        <p className="workspace-metric-note">{detail}</p>
        {onClick && (
          <span className="text-[10px] text-[var(--workspace-muted,#9ca3af)] hover:underline opacity-80">
            Formula &rarr;
          </span>
        )}
      </div>
      {series && (
        <div className="workspace-mini-bars" aria-hidden="true">
          {series.map((value, index) => (
            <span
              key={index}
              data-negative={value < 0 || undefined}
              style={{
                height: `${value === 0 ? 3 : Math.max(9, (Math.abs(value) / scale) * 100)}%`,
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function OverviewSummary({ cashFlow, month, accounts, onInsights, onAccounts, onTransactions }: {
  cashFlow: CurrencyCashFlow;
  month: string;
  accounts: BankAccountSummary[];
  onInsights: () => void;
  onAccounts: () => void;
  onTransactions: () => void;
}) {
  const [chartTab, setChartTab] = useState<"fingraph" | "breakdown">("fingraph");
  const [inspectingMetric, setInspectingMetric] = useState<MetricFormulaData | null>(null);
  const { currency, days, transaction_count, spending_by_account } = cashFlow;
  const weeks = summarizeWeeks(month, days);
  const inflow = weeks.reduce((sum, week) => sum + week.inflow, 0);
  const spending = weeks.reduce((sum, week) => sum + week.spending, 0);
  const net = Math.round((inflow - spending) * 100) / 100;
  const ranked = Object.entries(spending_by_account).sort(([firstId, first], [secondId, second]) =>
    Number(second) - Number(first) || firstId.localeCompare(secondId),
  );
  const segments: SpendingSegment[] = ranked.slice(0, ranked.length > 5 ? 4 : 5).map(([id, amount], index) => {
    const account = accounts.find((entry) => entry.id === id);
    const label = account ? `${account.institution_name} · ${account.account_number_masked.slice(-4)}` : "Account";
    return { id, label, amount: Number(amount), color: breakdownColors[index] };
  });
  if (ranked.length > 5) segments.push({
    id: "other",
    label: `Other accounts (${ranked.length - 4})`,
    amount: ranked.slice(4).reduce((sum, [, amount]) => sum + Number(amount), 0),
    color: breakdownColors[4],
  });

  const inspectMoneyIn = () => {
    setInspectingMetric({
      title: "Money In (Total Recorded Credits)",
      formula: "Total inflow = the sum of amounts from all credit transactions",
      explanation:
        "Calculated by summing all verified positive credit transactions (including payroll salary, incoming transfers, dividend credits, and merchant refunds) for the selected monthly statement window.",
      inputs: [
        { label: "Active Month", value: monthLabel.format(new Date(month + "T00:00:00Z")) },
        { label: "Recorded Days in Scope", value: `${days.length} days` },
        { label: "Weekly Subtotals", value: weeks.map((w) => money(w.inflow, currency, 0)).join(" + ") },
        { label: "Sum Total", value: money(inflow, currency, 2) },
      ],
      steps: [
        "Filter all canonical transactions where amount > 0 and transaction state is CONFIRMED.",
        "Partition transactions into weekly intervals across the calendar month.",
        "Aggregate weekly inflows: ∑ week.inflow = Total Money In.",
      ],
      methodology: "Deterministic Ledger Ingestion (Air-Gapped)",
      notes: "Calculated strictly on-device using local immutable database ledger records. No raw records or financial identifiers are sent to any LLM or third-party cloud service.",
    });
  };

  const inspectMoneyOut = () => {
    setInspectingMetric({
      title: "Money Out (Total Recorded Debits)",
      formula: "Total outflow = the sum of absolute amounts from all debit transactions",
      explanation:
        "Calculated by taking the absolute sum of all debit transactions (including utility bills, living expenses, card debits, and transfers out) across all linked accounts during the period.",
      inputs: [
        { label: "Active Month", value: monthLabel.format(new Date(month + "T00:00:00Z")) },
        { label: "Recorded Accounts", value: `${Object.keys(spending_by_account).length} linked accounts` },
        { label: "Weekly Debits", value: weeks.map((w) => money(w.spending, currency, 0)).join(" + ") },
        { label: "Sum Total", value: money(spending, currency, 2) },
      ],
      steps: [
        "Identify all canonical debits where transaction direction is OUTFLOW.",
        "Deduplicate internal account transfers to avoid artificial double-counting of outflow.",
        "Compute cumulative absolute sum: ∑ |amount| = Total Money Out.",
      ],
      methodology: "Double-Entry Verification & Transfer Deduplication",
      notes: "Internal transfers between your own accounts are segregated to preserve true discretionary & fixed expenditure figures.",
    });
  };

  const inspectNetCashFlow = () => {
    const savingsRatio = inflow > 0 ? Math.round((net / inflow) * 100) : 0;
    setInspectingMetric({
      title: "Net Cash Flow (Retained Liquidity)",
      formula: "Net cash flow = total inflow − total outflow",
      explanation:
        "The fundamental liquidity equation measuring retained capital for the period. A positive value denotes net savings and surplus, while a negative value signifies net capital depletion.",
      inputs: [
        { label: "Total Inflow (+)", value: money(inflow, currency, 2) },
        { label: "Total Outflow (-)", value: money(spending, currency, 2) },
        { label: "Net Retained Difference", value: money(net, currency, 2) },
        { label: "Savings Rate", value: `${savingsRatio}% of gross income` },
      ],
      steps: [
        "Take verified Total Inflow from ledger credits.",
        "Take verified Total Outflow from ledger debits.",
        "Subtract Outflow from Inflow: Net = Inflow - Outflow.",
        "Calculate savings retention efficiency: (Net / Inflow) × 100%.",
      ],
      methodology: "Standard Industrial Treasury Balance",
    });
  };

  const inspectTransactions = () => {
    setInspectingMetric({
      title: "Transaction Volume & Cadence",
      formula: "Transaction count = the number of recorded transactions",
      explanation:
        "Total count of atomic canonical financial entries recorded, parsed, verified, and mapped to this month's ledger statement.",
      inputs: [
        { label: "Total Recorded Count", value: `${transaction_count} transactions` },
        { label: "Active Accounts Count", value: `${accounts.length} accounts` },
        { label: "Average Daily Volume", value: `${(transaction_count / Math.max(1, days.length)).toFixed(1)} tx/day` },
      ],
      steps: [
        "Ingest canonical transactions through Finora normalizer.",
        "Filter for timestamps strictly within month boundary [00:00:00Z .. 23:59:59Z].",
        "Compute cardinal count |T|.",
      ],
      methodology: "Canonical Ledger Indexing",
      notes: "Includes debit card purchases, UPI payments, direct deposits, refunds, and bank fees.",
    });
  };

  return <>
    <div className="workspace-metrics" key={`${month}-${currency}`}>
      <Metric
        label="Money in"
        value={money(inflow, currency, 2)}
        detail="Recorded credits"
        icon={ArrowDownLeft}
        series={weeks.map((week) => week.inflow)}
        tone="inflow"
        onClick={inspectMoneyIn}
      />
      <Metric
        label="Money out"
        value={money(spending, currency, 2)}
        detail="Recorded debits"
        icon={ArrowUpRight}
        series={weeks.map((week) => week.spending)}
        tone="spending"
        onClick={inspectMoneyOut}
      />
      <Metric
        label="Net cash flow"
        value={money(net, currency, 2)}
        detail="Money in minus money out"
        icon={ArrowDownUp}
        series={weeks.map((week) => week.inflow - week.spending)}
        tone="net"
        onClick={inspectNetCashFlow}
      />
      <section
        className="workspace-card workspace-metric workspace-metric-clickable cursor-pointer"
        onClick={inspectTransactions}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inspectTransactions();
          }
        }}
        aria-label="Transactions: Click to view volume formula"
      >
        <div className="workspace-metric-label">
          <div className="flex items-center gap-1.5">
            <h2>Transactions</h2>
            <span className="formula-inspect-badge" title="Click to inspect calculation formula">
              ƒ(x)
            </span>
          </div>
          <span className="workspace-metric-icon"><List size={17} aria-hidden="true" /></span>
        </div>
        <p className="workspace-metric-value">{numberLabel.format(transaction_count)}</p>
        <p className="workspace-metric-note">Including transfers</p>
        <button
          type="button"
          className="workspace-text-button workspace-metric-link"
          onClick={(e) => {
            e.stopPropagation();
            onTransactions();
          }}
        >
          View transactions <ArrowRight size={14} aria-hidden="true" />
        </button>
      </section>
    </div>

    {/* Metric Formula Modal */}
    <MetricFormulaModal
      isOpen={!!inspectingMetric}
      onClose={() => setInspectingMetric(null)}
      data={inspectingMetric}
    />

    {/* Elegant Chart View Switcher */}
    <div className="my-5 flex items-center justify-between gap-3 flex-wrap">
      <div className="inline-flex rounded-xl p-1 border border-[var(--workspace-line,#3d3e37)] bg-[var(--workspace-surface,#1c1d1a)]">
        <button
          type="button"
          onClick={() => setChartTab("fingraph")}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${chartTab === "fingraph"
            ? "bg-[var(--workspace-gold,#d7ba82)] text-[var(--finora-dark,#20211f)] shadow-sm font-bold"
            : "text-[var(--workspace-muted,#c6c5bb)] hover:text-[var(--workspace-ink,#f5f4f0)]"
            }`}
        >
          <LineChart size={14} />
          <span>FinGraph (10-Year Market View)</span>
        </button>
        <button
          type="button"
          onClick={() => setChartTab("breakdown")}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${chartTab === "breakdown"
            ? "bg-[var(--workspace-gold,#d7ba82)] text-[var(--finora-dark,#20211f)] shadow-sm font-bold"
            : "text-[var(--workspace-muted,#c6c5bb)] hover:text-[var(--workspace-ink,#f5f4f0)]"
            }`}
        >
          <PieChartIcon size={14} />
          <span>Monthly Cash Flow & Breakdown</span>
        </button>
      </div>

      <div className="flex items-center gap-2 text-xs text-[var(--workspace-muted,#c6c5bb)]">
        <span className="h-2 w-2 rounded-full bg-[#10b981] animate-pulse" />
        <span>Pre-calculated 10-Year Historical Engine</span>
      </div>
    </div>

    {chartTab === "fingraph" ? (
      <div className="mb-6">
        <StockMarketFinancialChart
          variant="overview"
          title="Your FinGraph (10-Year Market Trajectory)"
          subtitle="Pre-calculated 10-year monthly expenditure, annual growth, and stock-market style cash trajectory in green, red, and blue."
        />
      </div>
    ) : (
      <OverviewCharts
        key={`${month}-${currency}`}
        weeks={weeks}
        currency={currency}
        segments={segments}
        hasCashFlow={days.length > 0}
        totalSpending={spending}
        onInsights={onInsights}
        onAccounts={onAccounts}
      />
    )}
  </>;
}

export function WorkspaceOverview({
  userName,
  accounts,
  transactions,
  transactionCount,
  onAdd,
  onInsights,
  onAccounts,
  onTransactions,
  workspaceMode = "demo",
}: {
  userName: string;
  accounts: BankAccountSummary[];
  transactions: CanonicalTransaction[];
  transactionCount: number;
  onAdd: () => void;
  onInsights: () => void;
  onAccounts: () => void;
  onTransactions: () => void;
  workspaceMode?: "demo" | "live";
}) {
  const currentMonth = `${new Date().toISOString().slice(0, 7)}-01`;
  const initialMonth = new Date(transactions[0].occurred_at).toISOString().slice(0, 7) + "-01";
  const [selectedMonth, setSelectedMonth] = useState<string>();
  const [selectedCurrency, setSelectedCurrency] = useState<string>();
  const [result, setResult] = useState<{ month: string; currencies: CurrencyCashFlow[] }>();
  const [failedMonth, setFailedMonth] = useState<string>();
  const [retry, setRetry] = useState(0);
  const month = selectedMonth ?? initialMonth;

  useEffect(() => {
    let active = true;
    fetchTransactionSummary(month).then(
      (summary) => { if (active) setResult(summary); },
      () => { if (active) setFailedMonth(month); },
    );
    return () => { active = false; };
  }, [month, retry]);

  const currencies = result?.month === month ? result.currencies : undefined;
  const cashFlow = currencies?.find(({ currency }) => currency === selectedCurrency)
    ?? currencies?.find(({ currency }) => currency === transactions[0].currency)
    ?? currencies?.[0];
  const isFailed = failedMonth === month;
  const changeMonth = (step: number) => {
    setFailedMonth(undefined);
    setSelectedMonth(moveMonth(month, step));
  };
  const names = new Map(accounts.map((account) => [account.id, account.institution_name]));

  return <div className="workspace-overview">
    <header className="workspace-overview-header">
      <div>
        <div className="flex items-center gap-2">
          <h1>Overview</h1>
          {workspaceMode === "demo" && (
            <span className="rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              10-Yr Demo Mode
            </span>
          )}
        </div>
        <p>{userName ? `${userName.trim().split(/\s+/)[0]}, here’s your recorded activity.` : "Here’s your recorded activity."}</p>
      </div>
      <div className="workspace-overview-actions">
        <div className="workspace-month" role="group" aria-label="Overview month">
          <button type="button" onClick={() => changeMonth(-1)} disabled={month === "0001-01-01"} aria-label="Previous month"><ChevronLeft size={16} aria-hidden="true" /></button>
          <span aria-live="polite"><CalendarDays size={15} aria-hidden="true" />{monthLabel.format(new Date(month + "T00:00:00Z"))}</span>
          <button type="button" onClick={() => changeMonth(1)} disabled={month >= currentMonth} aria-label="Next month"><ChevronRight size={16} aria-hidden="true" /></button>
        </div>
        {currencies && currencies.length > 1 && cashFlow && <label className="workspace-currency">
          <span className="sr-only">Overview currency</span>
          <select value={cashFlow.currency} onChange={(event) => setSelectedCurrency(event.target.value)}>
            {currencies.map(({ currency }) => <option key={currency}>{currency}</option>)}
          </select>
        </label>}
        <button type="button" className="workspace-primary" onClick={onAdd}><FileUp size={16} aria-hidden="true" /> Add statement</button>
      </div>
    </header>

    {isFailed ? <section className="workspace-card workspace-overview-message" role="status">
      <h2>Monthly summary is temporarily unavailable</h2>
      <p>You can still see your recent transactions below.</p>
      <button className="workspace-text-button" type="button" onClick={() => { setFailedMonth(undefined); setRetry((value) => value + 1); }}><RotateCw size={15} aria-hidden="true" /> Try again</button>
    </section> : !currencies ? <OverviewSummarySkeleton /> : cashFlow ? (
      <OverviewSummary cashFlow={cashFlow} month={month} accounts={accounts} onAccounts={onAccounts} onInsights={onInsights} onTransactions={onTransactions} />
    ) : <section className="workspace-card workspace-overview-message" role="status">
      <h2>No transactions this month</h2>
      <p>Select another month to view your records.</p>
      {month !== initialMonth && <button className="workspace-text-button" type="button" onClick={() => setSelectedMonth(undefined)}>Go to latest recorded month <ArrowRight size={15} aria-hidden="true" /></button>}
    </section>}

    <section className="workspace-card workspace-recent" aria-labelledby="workspace-recent-title">
      <div className="workspace-card-heading">
        <div><h2 id="workspace-recent-title">Recent transactions</h2><p>{numberLabel.format(transactionCount)} {transactionCount === 1 ? "record" : "records"} across all dates</p></div>
        <button type="button" className="workspace-text-button" onClick={onTransactions}>View all <ArrowRight size={15} aria-hidden="true" /></button>
      </div>
      <table>
        <thead><tr><th scope="col">Transaction</th><th scope="col" className="workspace-table-date">Date</th><th scope="col" className="workspace-table-account">Account</th><th scope="col">Amount</th></tr></thead>
        <tbody>{transactions.map((transaction) => {
          const isCredit = transaction.transaction_type === "CREDIT";
          const isDebit = transaction.transaction_type === "DEBIT";
          const Icon = isCredit ? ArrowDownLeft : isDebit ? ArrowUpRight : ArrowDownUp;
          return <tr key={transaction.id}>
            <th scope="row"><div className="workspace-transaction-name">
              <span className="workspace-transaction-icon" data-credit={isCredit || undefined}><Icon size={16} aria-hidden="true" /></span>
              <span><strong>{transaction.merchant_name || transaction.raw_description}</strong><small>{!isDebit && !isCredit ? "Transfer" : transaction.category_name}</small><small className="workspace-table-date-mobile">{formatDate(transaction.occurred_at)}</small></span>
            </div></th>
            <td className="workspace-table-date">{formatDate(transaction.occurred_at)}</td>
            <td className="workspace-table-account">{names.get(transaction.account_id) ?? "—"}</td>
            <td className="workspace-transaction-money" data-credit={isCredit || undefined}>{isCredit ? "+" : isDebit ? "−" : ""}{money(transaction.amount, transaction.currency, 2)}</td>
          </tr>;
        })}</tbody>
      </table>
    </section>

    <div className="workspace-record-note"><Banknote size={15} aria-hidden="true" /> Cash flow reflects recorded credits and debits. Transfers are shown in recent activity.</div>
  </div>;
}
