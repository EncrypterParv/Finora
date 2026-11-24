"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowDownRight,
  BarChart2,
  Calendar,
  CandlestickChart,
  LineChart,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  getDemo10YearMonthlyRecords,
  MonthlyFinancialRecord,
} from "@/lib/demo-data";
import { useTheme } from "@/components/providers/ThemeProvider";
import { money } from "../prototype/prototype-ui";
import { MetricFormulaModal, type MetricFormulaData } from "@/components/modals/MetricFormulaModal";

export type Timeframe = "1Y" | "3Y" | "5Y" | "10Y" | "ALL";
export type ChartMode = "flow" | "trajectory" | "candlestick" | "volume";

const CHART_WIDTH = 960;
const CHART_PADDING = { top: 25, right: 30, bottom: 45, left: 65 };

interface StockMarketFinancialChartProps {
  records?: MonthlyFinancialRecord[];
  title?: string;
  subtitle?: string;
  compact?: boolean;
  variant?: "overview" | "panel";
}

export function StockMarketFinancialChart({
  records: initialRecords,
  title = "10-Year Financial Records & Market Trajectory",
  subtitle = "Dynamic multi-year cash velocity with stock-market grade trend curves, candlestick volatility, and volume momentum.",
  compact = false,
  variant = "panel",
}: StockMarketFinancialChartProps) {
  const { theme } = useTheme();

  const allRecords = useMemo(
    () => initialRecords ?? getDemo10YearMonthlyRecords(),
    [initialRecords]
  );

  const [timeframe, setTimeframe] = useState<Timeframe>("10Y");
  const [chartMode, setChartMode] = useState<ChartMode>("flow");
  const [showSMA, setShowSMA] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [inspectingMetric, setInspectingMetric] = useState<MetricFormulaData | null>(null);

  // Context-aware theme styling (Neutral Dark / AMOLED pure black / Fin warm stone)
  const isAmoled = theme === "amoled";
  const isDarkContext =
    theme === "dark" || theme === "amoled" || (variant === "overview" && theme === "fin");

  // Filter records based on selected timeframe
  const filteredRecords = useMemo(() => {
    const total = allRecords.length;
    switch (timeframe) {
      case "1Y":
        return allRecords.slice(Math.max(0, total - 12));
      case "3Y":
        return allRecords.slice(Math.max(0, total - 36));
      case "5Y":
        return allRecords.slice(Math.max(0, total - 60));
      case "10Y":
      case "ALL":
      default:
        return allRecords;
    }
  }, [allRecords, timeframe]);

  // Aggregate stats for the active timeframe
  const stats = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    let maxInflow = 0;
    let maxOutflow = 0;
    let peakMonth = "";
    let spikeMonth = "";

    filteredRecords.forEach((r) => {
      totalIn += r.inflow;
      totalOut += r.outflow;
      if (r.inflow > maxInflow) {
        maxInflow = r.inflow;
        peakMonth = r.monthLabel;
      }
      if (r.outflow > maxOutflow) {
        maxOutflow = r.outflow;
        spikeMonth = r.monthLabel;
      }
    });

    const netRetained = totalIn - totalOut;
    const savingsRate = totalIn > 0 ? (netRetained / totalIn) * 100 : 0;
    const startBal = filteredRecords[0]?.cumulativeBalance ?? 0;
    const endBal =
      filteredRecords[filteredRecords.length - 1]?.cumulativeBalance ?? 0;
    const netGrowthPct =
      startBal > 0 ? ((endBal - startBal) / startBal) * 100 : 0;

    return {
      totalIn,
      totalOut,
      netRetained,
      savingsRate,
      maxInflow,
      maxOutflow,
      peakMonth,
      spikeMonth,
      startBal,
      endBal,
      netGrowthPct,
      monthlyAvgInflow: totalIn / Math.max(1, filteredRecords.length),
      monthlyAvgOutflow: totalOut / Math.max(1, filteredRecords.length),
    };
  }, [filteredRecords]);

  // Active or hovered record
  const activeRecord =
    hoveredIndex !== null && filteredRecords[hoveredIndex]
      ? filteredRecords[hoveredIndex]
      : filteredRecords[filteredRecords.length - 1] ?? null;

  // Chart dimensions & scaling
  const width = CHART_WIDTH;
  const height = compact ? 280 : 360;
  const padding = CHART_PADDING;
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  // Calculate scales per mode to prevent squashed lines
  const { maxVal, minVal } = useMemo(() => {
    let highest = 1000;
    let lowest = 0;

    if (chartMode === "trajectory") {
      // Scale against cumulative balance
      filteredRecords.forEach((r) => {
        highest = Math.max(highest, r.cumulativeBalance);
        lowest = Math.min(lowest, r.cumulativeBalance);
      });
      return {
        maxVal: highest * 1.08,
        minVal: Math.max(0, lowest * 0.9),
      };
    }

    if (chartMode === "candlestick") {
      // Scale against high and low
      let candLowest = Infinity;
      filteredRecords.forEach((r) => {
        highest = Math.max(highest, r.high);
        candLowest = Math.min(candLowest, r.low);
      });
      return {
        maxVal: highest * 1.05,
        minVal: Math.max(0, candLowest * 0.95),
      };
    }

    // "flow" and "volume" modes compare monthly inflow and outflow
    filteredRecords.forEach((r) => {
      highest = Math.max(highest, r.inflow, r.outflow);
    });
    return {
      maxVal: highest * 1.12,
      minVal: 0,
    };
  }, [filteredRecords, chartMode]);

  const getX = (index: number) => {
    if (filteredRecords.length <= 1) return padding.left;
    return padding.left + (index / (filteredRecords.length - 1)) * graphWidth;
  };

  const getY = (val: number) => {
    const range = Math.max(1, maxVal - minVal);
    const normalized = (val - minVal) / range;
    return height - padding.bottom - normalized * graphHeight;
  };

  // Generate SVG path for a given metric
  const createPath = (accessor: (r: MonthlyFinancialRecord) => number) => {
    if (filteredRecords.length === 0) return "";
    return filteredRecords.reduce((acc, r, i) => {
      const x = getX(i);
      const y = getY(accessor(r));
      return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, "");
  };

  // Generate smooth area path
  const createAreaPath = (accessor: (r: MonthlyFinancialRecord) => number) => {
    if (filteredRecords.length === 0) return "";
    const line = createPath(accessor);
    const firstX = getX(0);
    const lastX = getX(filteredRecords.length - 1);
    const baseY = height - padding.bottom;
    return `${line} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
  };

  // 6-Month Simple Moving Average (SMA) of Inflow
  const windowSize = 6;
  const range = Math.max(1, maxVal - minVal);
  const n = filteredRecords.length;
  const smaPoints = filteredRecords.map((_, i) => {
    const sliceStart = Math.max(0, i - windowSize + 1);
    const slice = filteredRecords.slice(sliceStart, i + 1);
    const metricToAverage =
      chartMode === "trajectory" ? (item: MonthlyFinancialRecord) => item.cumulativeBalance : (item: MonthlyFinancialRecord) => item.inflow;
    const avg =
      slice.reduce((sum, item) => sum + metricToAverage(item), 0) / slice.length;
    const x = n <= 1 ? padding.left : padding.left + (i / (n - 1)) * graphWidth;
    const normalized = (avg - minVal) / range;
    const y = height - padding.bottom - normalized * graphHeight;
    return { x, y };
  });

  const smaPath = smaPoints.reduce(
    (acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
    ""
  );

  // Colors & Aesthetic Tokens (True neutral charcoal dark, pure #000000 amoled, warm stone fin)
  const cardBgClass = isAmoled
    ? "bg-[#000000] border-[#1a1a1a] text-[#ffffff]"
    : isDarkContext
    ? variant === "overview" && theme === "fin"
      ? "bg-[#252622] border-[#3d3e37] text-[#f5f4f0]"
      : "bg-[#14151a] border-[#262833] text-[#f3f4f6]"
    : "bg-white border-[#e5e4de] text-[#20211f]";

  const subCardBgClass = isAmoled
    ? "bg-[#060606] border-[#1a1a1a]"
    : isDarkContext
    ? variant === "overview" && theme === "fin"
      ? "bg-[#1c1d1a] border-[#3d3e37]"
      : "bg-[#1c1d22] border-[#26272e]"
    : "bg-[#faf9f5] border-[#e5e4de]";

  const textMutedClass = isAmoled
    ? "text-[#a1a1aa]"
    : isDarkContext
    ? "text-[#9ca3af]"
    : "text-[#575953]";

  const gridStroke = isAmoled
    ? "#1a1a1a"
    : isDarkContext
    ? variant === "overview" && theme === "fin"
      ? "#3d3e37"
      : "#26272e"
    : "#eeede8";

  const axisTextFill = isAmoled
    ? "#a1a1aa"
    : isDarkContext
    ? variant === "overview" && theme === "fin"
      ? "#c6c5bb"
      : "#94a3b8"
    : "#888982";

  // Financial Semantics: Green (Inflow), Red (Spend), Blue (Wealth), Gold (SMA)
  const colorInflow = isDarkContext ? "#34d399" : "#10b981";
  const colorOutflow = isDarkContext ? "#fb7185" : "#f43f5e";
  const colorWealth = isDarkContext ? "#38bdf8" : "#0284c7";
  const colorSMA = isDarkContext ? "#fbbf24" : "#d97706";

  const inspectInflow = () => {
    setInspectingMetric({
      title: "Cumulative Inflow (Multi-Horizon Aggregate)",
      formula: "\\text{Aggregate Inflow} = \\sum_{m=1}^{M} \\text{inflow}_m",
      explanation:
        "The cumulative sum of all salary deposits, freelance revenue, capital dividends, and liquidity injections recorded across the selected observation timeframe.",
      inputs: [
        { label: "Selected Horizon", value: `${timeframe} (${filteredRecords.length} months)` },
        { label: "Monthly Average Inflow", value: money(stats.monthlyAvgInflow) },
        { label: "Peak Inflow Month", value: `${stats.peakMonth} (${money(stats.maxInflow)})` },
        { label: "Total Aggregate Inflow", value: money(stats.totalIn) },
      ],
      steps: [
        "Index all recorded months within the selected window.",
        "Sum individual monthly credit totals: ∑ inflow(m).",
        "Compute arithmetic moving average over active interval: Total / M.",
      ],
      methodology: "Historical Multi-Period Aggregate",
      notes: "Calculated strictly on-device without exposing statements to cloud LLMs.",
    });
  };

  const inspectSpend = () => {
    setInspectingMetric({
      title: "Cumulative Spend (Multi-Horizon Aggregate)",
      formula: "\\text{Aggregate Outflow} = \\sum_{m=1}^{M} \\text{outflow}_m",
      explanation:
        "The cumulative sum of living expenses, utilities, debt obligations, discretionary purchases, and card debits over the selected multi-year period.",
      inputs: [
        { label: "Selected Horizon", value: `${timeframe} (${filteredRecords.length} months)` },
        { label: "Monthly Average Outflow", value: money(stats.monthlyAvgOutflow) },
        { label: "Spike Outflow Month", value: `${stats.spikeMonth} (${money(stats.maxOutflow)})` },
        { label: "Total Aggregate Spend", value: money(stats.totalOut) },
      ],
      steps: [
        "Sum all monthly debits across verified statements.",
        "Detect outlier spending spikes using quartile inter-month spread.",
        "Compute overall burn velocity: Total Spend / M.",
      ],
      methodology: "Multi-Horizon Outflow Indexing",
    });
  };

  const inspectRetained = () => {
    setInspectingMetric({
      title: "Net Retained Capital & Savings Efficiency",
      formula: "\\text{Net Retained} = \\sum \\text{Inflow} - \\sum \\text{Outflow}, \\quad S_r = \\frac{\\text{Net Retained}}{\\sum \\text{Inflow}} \\times 100\\%",
      explanation:
        "The ultimate financial health metric measuring real retained wealth generated across the timeframe. The savings rate Sr signifies what fraction of incoming liquidity converted into accumulated balance.",
      inputs: [
        { label: "Total Inflow (+)", value: money(stats.totalIn) },
        { label: "Total Spend (-)", value: money(stats.totalOut) },
        { label: "Net Retained Capital", value: money(stats.netRetained) },
        { label: "Savings Rate (Sr)", value: `${stats.savingsRate.toFixed(1)}%` },
        { label: "Net Wealth Growth %", value: `${stats.netGrowthPct >= 0 ? "+" : ""}${stats.netGrowthPct.toFixed(1)}%` },
      ],
      steps: [
        "Subtract aggregate expenditure from aggregate income.",
        "Divide retained surplus by gross income to obtain structural savings efficiency.",
        "Assess compound balance trajectory from start month to terminal month.",
      ],
      methodology: "Treasury Solvency & Compounding Analysis",
    });
  };

  return (
    <section
      className={`stock-financial-chart rounded-2xl border p-5 md:p-6 shadow-sm transition-all ${cardBgClass}`}
    >
      {/* Header & Metric Tickers */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-inherit pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="flex h-2 w-2 rounded-full animate-pulse"
              style={{ backgroundColor: colorInflow }}
            />
            <span
              className="font-mono text-[11px] font-bold uppercase tracking-wider"
              style={{ color: colorInflow }}
            >
              10-YEAR DEMO FINANCIAL RECORD (2017–2026)
            </span>
          </div>
          <h2 className="mt-1 text-xl font-bold tracking-tight">{title}</h2>
          <p className={`mt-0.5 text-xs ${textMutedClass}`}>{subtitle}</p>
        </div>

        {/* Dynamic Stock-Market Stat Badges with Click-to-Formula */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Green Inflow Ticker */}
          <button
            type="button"
            onClick={inspectInflow}
            title="Click to view calculation formula for Inflow"
            className={`group rounded-lg border px-3 py-1.5 text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${
              isDarkContext
                ? "border-emerald-900/50 bg-emerald-950/30 text-emerald-400 hover:border-emerald-700/60"
                : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-400"
            }`}
          >
            <div className="flex items-center justify-between gap-1.5">
              <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider">
                <ArrowDownRight size={12} className="rotate-180" />
                Total Inflow (Credits)
              </span>
              <span className="font-mono text-[9px] px-1 rounded bg-emerald-500/10 border border-emerald-500/20 group-hover:bg-emerald-500/20">
                ƒ(x)
              </span>
            </div>
            <p className="font-mono text-sm font-bold tabular-nums">
              {money(stats.totalIn)}
            </p>
          </button>

          {/* Red Outflow Ticker */}
          <button
            type="button"
            onClick={inspectSpend}
            title="Click to view calculation formula for Outflow"
            className={`group rounded-lg border px-3 py-1.5 text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${
              isDarkContext
                ? "border-rose-900/50 bg-rose-950/30 text-rose-400 hover:border-rose-700/60"
                : "border-rose-200 bg-rose-50 text-rose-800 hover:border-rose-400"
            }`}
          >
            <div className="flex items-center justify-between gap-1.5">
              <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider">
                <ArrowDownRight size={12} />
                Total Spend (Debits)
              </span>
              <span className="font-mono text-[9px] px-1 rounded bg-rose-500/10 border border-rose-500/20 group-hover:bg-rose-500/20">
                ƒ(x)
              </span>
            </div>
            <p className="font-mono text-sm font-bold tabular-nums">
              {money(stats.totalOut)}
            </p>
          </button>

          {/* Blue Net Retained Ticker */}
          <button
            type="button"
            onClick={inspectRetained}
            title="Click to view calculation formula for Net Retained & Savings Rate"
            className={`group rounded-lg border px-3 py-1.5 text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${
              isDarkContext
                ? "border-sky-900/50 bg-sky-950/30 text-sky-400 hover:border-sky-700/60"
                : "border-sky-200 bg-sky-50 text-sky-800 hover:border-sky-400"
            }`}
          >
            <div className="flex items-center justify-between gap-1.5">
              <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider">
                <Zap size={12} />
                Net Retained ({stats.savingsRate.toFixed(1)}%)
              </span>
              <span className="font-mono text-[9px] px-1 rounded bg-sky-500/10 border border-sky-500/20 group-hover:bg-sky-500/20">
                ƒ(x)
              </span>
            </div>
            <p className="font-mono text-sm font-bold tabular-nums">
              {money(stats.netRetained)}
            </p>
          </button>
        </div>
      </div>

      {/* Chart Toolbar (Timeframes & Visual Modes) */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        {/* Timeframe Selector */}
        <div className={`flex items-center gap-1 rounded-lg border p-1 ${subCardBgClass}`}>
          {(["1Y", "3Y", "5Y", "10Y", "ALL"] as Timeframe[]).map((tf) => {
            const isActive = timeframe === tf;
            const activeClass = isAmoled
              ? "bg-white text-black font-bold shadow-sm"
              : isDarkContext
              ? variant === "overview" && theme === "fin"
                ? "bg-[#d7ba82] text-[#20211f] font-bold shadow-sm"
                : "bg-white text-[#090a0f] font-bold shadow-sm"
              : "bg-[#20211f] text-white font-medium shadow-sm";

            return (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`rounded-md px-2.5 py-1 text-xs transition-all ${
                  isActive ? activeClass : `${textMutedClass} hover:opacity-100`
                }`}
              >
                {tf === "ALL" ? "All 10Y" : tf}
              </button>
            );
          })}
        </div>

        {/* Chart View Modes */}
        <div className="flex items-center gap-1.5">
          <div className={`flex items-center gap-1 rounded-lg border p-1 ${subCardBgClass}`}>
            <button
              type="button"
              onClick={() => setChartMode("flow")}
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                chartMode === "flow"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : `${textMutedClass} hover:opacity-100`
              }`}
              title="Monthly Inflow vs Outflow Cash Curves"
            >
              <LineChart size={13} />
              <span className="hidden sm:inline">Cash Flow</span>
            </button>
            <button
              type="button"
              onClick={() => setChartMode("trajectory")}
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                chartMode === "trajectory"
                  ? "bg-sky-600 text-white shadow-sm"
                  : `${textMutedClass} hover:opacity-100`
              }`}
              title="10-Year Cumulative Wealth Trajectory Curve"
            >
              <TrendingUp size={13} />
              <span className="hidden sm:inline">Wealth Trajectory</span>
            </button>
            <button
              type="button"
              onClick={() => setChartMode("candlestick")}
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                chartMode === "candlestick"
                  ? "bg-amber-600 text-white shadow-sm"
                  : `${textMutedClass} hover:opacity-100`
              }`}
              title="Stock Market Monthly Candlestick Volatility"
            >
              <CandlestickChart size={13} />
              <span className="hidden sm:inline">Candlesticks</span>
            </button>
            <button
              type="button"
              onClick={() => setChartMode("volume")}
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                chartMode === "volume"
                  ? "bg-purple-600 text-white shadow-sm"
                  : `${textMutedClass} hover:opacity-100`
              }`}
              title="Monthly Inflow vs Outflow Volume Bars"
            >
              <BarChart2 size={13} />
              <span className="hidden sm:inline">Volume Bars</span>
            </button>
          </div>

          {/* SMA Toggle */}
          <button
            type="button"
            onClick={() => setShowSMA((prev) => !prev)}
            className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
              showSMA
                ? isDarkContext
                  ? "border-amber-500/50 bg-amber-950/40 text-amber-300"
                  : "border-amber-300 bg-amber-50 text-amber-900"
                : `${subCardBgClass} ${textMutedClass}`
            }`}
            title="Toggle 6-Month Moving Average Trendline"
          >
            SMA (6M)
          </button>
        </div>
      </div>

      {/* Floating Active Month HUD Badge */}
      {activeRecord && (
        <div
          className={`mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 text-xs ${subCardBgClass}`}
        >
          <div className="flex items-center gap-2">
            <Calendar size={14} className={textMutedClass} />
            <span className="font-semibold">{activeRecord.monthLabel}</span>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                activeRecord.isBullish
                  ? isDarkContext
                    ? "bg-emerald-950 text-emerald-300"
                    : "bg-emerald-100 text-emerald-800"
                  : isDarkContext
                  ? "bg-rose-950 text-rose-300"
                  : "bg-rose-100 text-rose-800"
              }`}
            >
              {activeRecord.isBullish ? "▲ Surplus Month" : "▼ Drawdown Month"}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 font-mono text-[11px]">
            <div>
              <span className={textMutedClass}>Inflow: </span>
              <strong style={{ color: colorInflow }}>
                +{money(activeRecord.inflow)}
              </strong>
            </div>
            <div>
              <span className={textMutedClass}>Spend: </span>
              <strong style={{ color: colorOutflow }}>
                −{money(activeRecord.outflow)}
              </strong>
            </div>
            <div>
              <span className={textMutedClass}>Net Cash: </span>
              <strong style={{ color: colorWealth }}>
                {money(activeRecord.net)}
              </strong>
            </div>
            <div>
              <span className={textMutedClass}>10Y Reserve: </span>
              <strong className="font-bold">
                {money(activeRecord.cumulativeBalance)}
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* Interactive SVG Chart Container */}
      <div className="relative mt-4 w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full cursor-crosshair overflow-visible"
          onMouseLeave={() => setHoveredIndex(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clientX = e.clientX - rect.left;
            const ratio = (clientX / rect.width) * width;
            const xOffset = ratio - padding.left;
            const index = Math.round(
              (xOffset / graphWidth) * (filteredRecords.length - 1)
            );
            if (index >= 0 && index < filteredRecords.length) {
              setHoveredIndex(index);
            }
          }}
        >
          <defs>
            {/* Green Inflow Gradient */}
            <linearGradient id="finInflowGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colorInflow} stopOpacity={0.28} />
              <stop offset="100%" stopColor={colorInflow} stopOpacity={0.0} />
            </linearGradient>

            {/* Red Outflow Gradient */}
            <linearGradient id="finOutflowGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colorOutflow} stopOpacity={0.22} />
              <stop offset="100%" stopColor={colorOutflow} stopOpacity={0.0} />
            </linearGradient>

            {/* Blue Wealth Reserve Gradient */}
            <linearGradient id="finWealthGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colorWealth} stopOpacity={0.32} />
              <stop offset="100%" stopColor={colorWealth} stopOpacity={0.0} />
            </linearGradient>
          </defs>

          {/* Grid lines (horizontal) */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
            const y = height - padding.bottom - pct * graphHeight;
            const val = minVal + pct * (maxVal - minVal);
            return (
              <g key={pct}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke={gridStroke}
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill={axisTextFill}
                  className="text-[9px] font-mono"
                >
                  {val >= 100000
                    ? `₹${(val / 100000).toFixed(1)}L`
                    : `₹${(val / 1000).toFixed(0)}k`}
                </text>
              </g>
            );
          })}

          {/* Year & Month Markers (X-Axis) */}
          {filteredRecords.map((r, i) => {
            const showLabel =
              filteredRecords.length <= 12
                ? true
                : filteredRecords.length <= 36
                ? i % 3 === 0
                : i % 12 === 0;

            if (!showLabel) return null;
            const x = getX(i);
            return (
              <g key={r.monthKey}>
                <line
                  x1={x}
                  y1={height - padding.bottom}
                  x2={x}
                  y2={height - padding.bottom + 5}
                  stroke={gridStroke}
                />
                <text
                  x={x}
                  y={height - padding.bottom + 18}
                  textAnchor="middle"
                  fill={axisTextFill}
                  className="text-[9px] font-medium"
                >
                  {filteredRecords.length <= 12 ? r.monthLabel.split(" ")[0] : r.year}
                </text>
              </g>
            );
          })}

          {/* MODE 1: CASH FLOW CURVES (INFLOW & OUTFLOW PROPERLY SCALED) */}
          {chartMode === "flow" && (
            <>
              {/* Inflow Area & Stroke */}
              <path d={createAreaPath((r) => r.inflow)} fill="url(#finInflowGrad)" />
              <path
                d={createPath((r) => r.inflow)}
                fill="none"
                stroke={colorInflow}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Outflow Area & Stroke */}
              <path d={createAreaPath((r) => r.outflow)} fill="url(#finOutflowGrad)" />
              <path
                d={createPath((r) => r.outflow)}
                fill="none"
                stroke={colorOutflow}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Net Surplus Line */}
              <path
                d={createPath((r) => Math.max(0, r.net))}
                fill="none"
                stroke={colorWealth}
                strokeWidth={1.8}
                strokeDasharray="3 3"
                strokeLinecap="round"
              />
            </>
          )}

          {/* MODE 2: CUMULATIVE 10-YEAR WEALTH TRAJECTORY */}
          {chartMode === "trajectory" && (
            <>
              <path
                d={createAreaPath((r) => r.cumulativeBalance)}
                fill="url(#finWealthGrad)"
              />
              <path
                d={createPath((r) => r.cumulativeBalance)}
                fill="none"
                stroke={colorWealth}
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {/* MODE 3: STOCK MARKET CANDLESTICKS */}
          {chartMode === "candlestick" && (
            <>
              {filteredRecords.map((r, i) => {
                const x = getX(i);
                const barWidth = Math.max(3, graphWidth / filteredRecords.length - 2);
                const yHigh = getY(r.high);
                const yLow = getY(r.low);
                const yOpen = getY(r.open);
                const yClose = getY(r.close);
                const candleColor = r.isBullish ? colorInflow : colorOutflow;

                const topY = Math.min(yOpen, yClose);
                const candleHeight = Math.max(2, Math.abs(yClose - yOpen));

                return (
                  <g key={r.monthKey}>
                    <line
                      x1={x}
                      y1={yHigh}
                      x2={x}
                      y2={yLow}
                      stroke={candleColor}
                      strokeWidth={1.2}
                    />
                    <rect
                      x={x - barWidth / 2}
                      y={topY}
                      width={barWidth}
                      height={candleHeight}
                      fill={candleColor}
                      rx={1}
                      fillOpacity={0.85}
                    />
                  </g>
                );
              })}
            </>
          )}

          {/* MODE 4: INFLOW VS OUTFLOW VOLUME HISTOGRAM */}
          {chartMode === "volume" && (
            <>
              {filteredRecords.map((r, i) => {
                const x = getX(i);
                const barWidth = Math.max(2.5, (graphWidth / filteredRecords.length) * 0.4);
                const yIn = getY(r.inflow);
                const yOut = getY(r.outflow);
                const baseY = height - padding.bottom;

                return (
                  <g key={r.monthKey}>
                    {/* Inflow Bar */}
                    <rect
                      x={x - barWidth}
                      y={yIn}
                      width={barWidth - 0.5}
                      height={Math.max(2, baseY - yIn)}
                      fill={colorInflow}
                      fillOpacity={0.85}
                      rx={1}
                    />
                    {/* Outflow Bar */}
                    <rect
                      x={x}
                      y={yOut}
                      width={barWidth - 0.5}
                      height={Math.max(2, baseY - yOut)}
                      fill={colorOutflow}
                      fillOpacity={0.85}
                      rx={1}
                    />
                  </g>
                );
              })}
            </>
          )}

          {/* Moving Average Line (SMA) */}
          {showSMA && (
            <path
              d={smaPath}
              fill="none"
              stroke={colorSMA}
              strokeWidth={2}
              strokeDasharray="4 3"
              strokeOpacity={0.9}
            />
          )}

          {/* Interactive Scrubbing Crosshair & Dot */}
          {hoveredIndex !== null && filteredRecords[hoveredIndex] && (
            <>
              <line
                x1={getX(hoveredIndex)}
                y1={padding.top}
                x2={getX(hoveredIndex)}
                y2={height - padding.bottom}
                stroke={isDarkContext ? "#94a3b8" : "#64748b"}
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <circle
                cx={getX(hoveredIndex)}
                cy={getY(
                  chartMode === "trajectory"
                    ? filteredRecords[hoveredIndex].cumulativeBalance
                    : filteredRecords[hoveredIndex].inflow
                )}
                r={4.5}
                fill={chartMode === "trajectory" ? colorWealth : colorInflow}
                stroke="#ffffff"
                strokeWidth={2}
              />
              {chartMode === "flow" && (
                <circle
                  cx={getX(hoveredIndex)}
                  cy={getY(filteredRecords[hoveredIndex].outflow)}
                  r={4.5}
                  fill={colorOutflow}
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              )}
            </>
          )}
        </svg>
      </div>

      {/* Legend & Methodology Footer */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-inherit pt-3 text-[11px]">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: colorInflow }}
            />
            Inflow Credits
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: colorOutflow }}
            />
            Spend Debits
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: colorWealth }}
            />
            {chartMode === "trajectory" ? "10Y Cumulative Growth" : "Net Surplus"}
          </span>
          {showSMA && (
            <span className="flex items-center gap-1.5">
              <span
                className="h-0.5 w-3"
                style={{ backgroundColor: colorSMA }}
              />
              SMA (6-Month Momentum)
            </span>
          )}
        </div>

        <span className={`font-mono text-[10px] ${textMutedClass}`}>
          Sampled {filteredRecords.length} Continuous Monthly Cycles • Zero Cloud Leakage
        </span>
      </div>

      {/* Metric Formula Modal */}
      <MetricFormulaModal
        isOpen={!!inspectingMetric}
        onClose={() => setInspectingMetric(null)}
        data={inspectingMetric}
      />
    </section>
  );
}
