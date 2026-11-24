"use client";

import { useId, useSyncExternalStore } from "react";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTheme } from "@/components/providers/ThemeProvider";
import { money } from "./prototype-ui";
import type { CashFlowWeek, SpendingSegment } from "./WorkspaceOverview";

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
const compactAmount = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });
const percent = new Intl.NumberFormat("en-IN", { style: "percent", maximumFractionDigits: 1 });

function subscribeToMotion(callback: () => void) {
  const query = window.matchMedia(reducedMotionQuery);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

export default function WorkspaceOverviewCharts({ weeks, currency, segments, totalSpending, hasCashFlow, onInsights, onAccounts }: {
  weeks: CashFlowWeek[];
  currency: string;
  segments: SpendingSegment[];
  totalSpending: number;
  hasCashFlow: boolean;
  onInsights: () => void;
  onAccounts: () => void;
}) {
  const { theme } = useTheme();
  const fillId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const reduceMotion = useSyncExternalStore(subscribeToMotion, () => window.matchMedia(reducedMotionQuery).matches, () => true);

  const isAmoled = theme === "amoled";
  const isDark = theme === "dark" || isAmoled;
  const inflowColor = isDark ? "#ffffff" : "#d7ba82";
  const spendingColor = isDark ? "#34d399" : "#a7b99a";
  const gridStroke = isAmoled ? "#1a1a1a" : isDark ? "#26272e" : "#494941";
  const axisColor = isAmoled ? "#a1a1aa" : isDark ? "#94a3b8" : "#c6c5bb";
  const tooltipStyle = isAmoled
    ? { background: "#060606", border: "1px solid #1a1a1a", borderRadius: 8, color: "#ffffff" }
    : isDark
    ? { background: "#14151a", border: "1px solid #26272e", borderRadius: 8, color: "#f8fafc" }
    : { background: "#292a26", border: "1px solid #56554b", borderRadius: 8, color: "#f5f4f0" };

  return <div className="workspace-analysis">
    <section className="workspace-card workspace-chart" aria-labelledby="workspace-cash-flow-title">
      <div className="workspace-card-heading">
        <div><h2 id="workspace-cash-flow-title">Cash flow</h2><p>Credits and debits by week, in {currency}</p></div>
        <button type="button" className="workspace-text-button" onClick={onInsights}>Insights <ArrowUpRight size={15} aria-hidden="true" /></button>
      </div>
      {hasCashFlow ? <>
        <div className="workspace-chart-legend">
          <span><i className="workspace-legend-line" data-series="inflow" aria-hidden="true" />Money in</span>
          <span><i className="workspace-legend-line" data-series="spending" aria-hidden="true" />Money out</span>
        </div>
        <div className="workspace-cash-chart" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <AreaChart data={weeks} margin={{ top: 14, right: 14, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={fillId} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={inflowColor} stopOpacity={0.34} />
                  <stop offset="100%" stopColor={inflowColor} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={gridStroke} strokeDasharray="3 5" />
              <YAxis stroke={axisColor} tickLine={false} axisLine={false} tickFormatter={(value: number) => compactAmount.format(value)} fontSize={11} width={46} tickCount={5} allowDecimals={false} />
              <XAxis dataKey="label" stroke={axisColor} axisLine={false} tickLine={false} tickMargin={12} fontSize={11} />
              <Tooltip labelFormatter={(label) => `Days ${label}`} formatter={(value: number, name) => [money(value, currency, 2), name]} contentStyle={tooltipStyle} />
              <Area type="linear" dataKey="inflow" name="Money in" stroke={inflowColor} strokeWidth={2.5} fill={`url(#${fillId})`} isAnimationActive={!reduceMotion} animationDuration={680} />
              <Area type="linear" dataKey="spending" name="Money out" stroke={spendingColor} strokeWidth={2} strokeDasharray="6 4" fill="none" isAnimationActive={!reduceMotion} animationDuration={740} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <details className="workspace-chart-data">
          <summary>Weekly figures <ChevronDown size={14} aria-hidden="true" /></summary>
          <table>
            <thead><tr><th scope="col">Days</th><th scope="col">Money in</th><th scope="col">Money out</th></tr></thead>
            <tbody>{weeks.map((week) => <tr key={week.label}><th scope="row">{week.label}</th><td>{money(week.inflow, currency, 2)}</td><td>{money(week.spending, currency, 2)}</td></tr>)}</tbody>
          </table>
        </details>
      </> : <p className="workspace-chart-empty">No credits or debits in this period.</p>}
    </section>

    <section className="workspace-card workspace-chart" aria-labelledby="workspace-spending-title">
      <div className="workspace-card-heading">
        <div><h2 id="workspace-spending-title">Spending by account</h2><p>This month’s recorded debits</p></div>
        <button type="button" className="workspace-text-button" onClick={onAccounts}>Accounts <ArrowUpRight size={15} aria-hidden="true" /></button>
      </div>
      {segments.length ? <>
        <div className="workspace-spend-chart" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <PieChart>
              <Pie data={segments} dataKey="amount" nameKey="label" innerRadius="73%" outerRadius="94%" paddingAngle={segments.length > 1 ? 3 : 0} cornerRadius={4} stroke="none" isAnimationActive={!reduceMotion} animationDuration={820}>
                {segments.map((segment) => <Cell key={segment.id} fill={segment.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="workspace-spend-center"><span>Total spent</span><strong>{money(totalSpending, currency, 2)}</strong></div>
        </div>
        <ul className="workspace-spend-list">
          {segments.map((segment) => <li key={segment.id}>
            <span className="workspace-spend-name"><i style={{ background: segment.color }} aria-hidden="true" />{segment.label}</span>
            <strong>{money(segment.amount, currency, 2)}</strong>
            <small>{percent.format(segment.amount / totalSpending)}</small>
          </li>)}
        </ul>
      </> : <p className="workspace-chart-empty">No spending recorded this month.</p>}
    </section>
  </div>;
}
