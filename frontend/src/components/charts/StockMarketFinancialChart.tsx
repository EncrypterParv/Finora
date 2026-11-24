"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowDownRight,
  BarChart2,
  Calendar,
  CandlestickChart,
  LineChart,
  Zap,
} from "lucide-react";
import {
  getDemo10YearMonthlyRecords,
  MonthlyFinancialRecord,
} from "@/lib/demo-data";
import { money } from "../prototype/prototype-ui";

type Timeframe = "1Y" | "3Y" | "5Y" | "10Y" | "ALL";
type ChartMode = "trend" | "candlestick" | "volume";

const CHART_WIDTH = 960;
const CHART_PADDING = { top: 25, right: 30, bottom: 45, left: 65 };

interface StockMarketFinancialChartProps {
  records?: MonthlyFinancialRecord[];
  title?: string;
  subtitle?: string;
  compact?: boolean;
}

export function StockMarketFinancialChart({
  records: initialRecords,
  title = "10-Year Financial Records & Market-Style Trajectory",
  subtitle = "Dynamic multi-year cash velocity with stock-market grade candlestick and volume momentum.",
  compact = false,
}: StockMarketFinancialChartProps) {
  const allRecords = useMemo(
    () => initialRecords ?? getDemo10YearMonthlyRecords(),
    [initialRecords]
  );

  const [timeframe, setTimeframe] = useState<Timeframe>("10Y");
  const [chartMode, setChartMode] = useState<ChartMode>("trend");
  const [showSMA, setShowSMA] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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

  // Key aggregate stats for the active timeframe
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

  // Calculate scales
  const maxVal = useMemo(() => {
    let highest = 1000;
    filteredRecords.forEach((r) => {
      if (chartMode === "trend") {
        highest = Math.max(highest, r.inflow, r.outflow, r.cumulativeBalance);
      } else if (chartMode === "candlestick") {
        highest = Math.max(highest, r.high, r.inflow);
      } else {
        highest = Math.max(highest, r.inflow, r.outflow);
      }
    });
    return highest * 1.08;
  }, [filteredRecords, chartMode]);

  const minVal = useMemo(() => {
    if (chartMode === "candlestick") {
      let lowest = Infinity;
      filteredRecords.forEach((r) => {
        lowest = Math.min(lowest, r.low);
      });
      return Math.max(0, lowest * 0.9);
    }
    return 0;
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

  // 12-Month Simple Moving Average (SMA) of Inflow/Net
  const windowSize = 6;
  const range = Math.max(1, maxVal - minVal);
  const n = filteredRecords.length;
  const smaPoints = filteredRecords.map((_, i) => {
    const sliceStart = Math.max(0, i - windowSize + 1);
    const slice = filteredRecords.slice(sliceStart, i + 1);
    const avg =
      slice.reduce((sum, item) => sum + item.inflow, 0) / slice.length;
    const x = n <= 1 ? padding.left : padding.left + (i / (n - 1)) * graphWidth;
    const normalized = (avg - minVal) / range;
    const y = height - padding.bottom - normalized * graphHeight;
    return { x, y };
  });

  const smaPath = smaPoints.reduce(
    (acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
    ""
  );

  return (
    <section className="stock-financial-chart rounded-2xl border border-[#e5e4de] dark:border-[#232736] bg-white dark:bg-[#12141c] p-5 md:p-6 shadow-sm transition-all">
      {/* Header & Metric Tickers */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#eeede8] dark:border-[#232736] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-[#10b981] animate-pulse" />
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#10b981] dark:text-[#34d399]">
              LIVE 10-YEAR FINANCIAL TIMELINE (DEMO ENGINE)
            </span>
          </div>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-[#20211f] dark:text-[#f8fafc]">
            {title}
          </h2>
          <p className="mt-0.5 text-xs text-[#575953] dark:text-[#94a3b8]">{subtitle}</p>
        </div>

        {/* Dynamic Stock-Market Stat Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Green Inflow Ticker */}
          <div className="rounded-lg border border-[#d1fae5] dark:border-[#064e3b] bg-[#ecfdf5] dark:bg-[#064e3b]/30 px-3 py-1.5">
            <span className="flex items-center gap-1 text-[10px] font-semibold text-[#047857] dark:text-[#6ee7b7]">
              <ArrowDownRight size={12} className="rotate-180 text-[#10b981]" />
              TOTAL INFLOW (CREDITS)
            </span>
            <p className="font-mono text-sm font-bold text-[#065f46] dark:text-[#34d399] tabular-nums">
              {money(stats.totalIn)}
            </p>
          </div>

          {/* Red Outflow Ticker */}
          <div className="rounded-lg border border-[#fee2e2] dark:border-[#7f1d1d] bg-[#fef2f2] dark:bg-[#7f1d1d]/30 px-3 py-1.5">
            <span className="flex items-center gap-1 text-[10px] font-semibold text-[#b91c1c] dark:text-[#fca5a5]">
              <ArrowDownRight size={12} className="text-[#ef4444]" />
              TOTAL SPEND (DEBITS)
            </span>
            <p className="font-mono text-sm font-bold text-[#991b1b] dark:text-[#f87171] tabular-nums">
              {money(stats.totalOut)}
            </p>
          </div>

          {/* Blue Net Retained Ticker */}
          <div className="rounded-lg border border-[#dbeafe] dark:border-[#1e3a8a] bg-[#eff6ff] dark:bg-[#1e3a8a]/30 px-3 py-1.5">
            <span className="flex items-center gap-1 text-[10px] font-semibold text-[#1d4ed8] dark:text-[#93c5fd]">
              <Zap size={12} className="text-[#3b82f6]" />
              NET WEALTH RETAINED
            </span>
            <p className="font-mono text-sm font-bold text-[#1e40af] dark:text-[#60a5fa] tabular-nums">
              {money(stats.netRetained)} ({stats.savingsRate.toFixed(1)}%)
            </p>
          </div>
        </div>
      </div>

      {/* Chart Toolbar (Timeframes & Visual Modes) */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        {/* Timeframe Selector */}
        <div className="flex items-center gap-1 rounded-lg border border-[#e5e4de] dark:border-[#282d3f] bg-[#fbfbf9] dark:bg-[#181b26] p-1">
          {(["1Y", "3Y", "5Y", "10Y", "ALL"] as Timeframe[]).map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => setTimeframe(tf)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                timeframe === tf
                  ? "bg-[#20211f] text-white shadow-sm dark:bg-white dark:text-[#090a0f] dark:font-semibold"
                  : "text-[#575953] hover:text-[#20211f] dark:text-[#94a3b8] dark:hover:text-white"
              }`}
            >
              {tf === "ALL" ? "All 10Y" : tf}
            </button>
          ))}
        </div>

        {/* Chart View Modes */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 rounded-lg border border-[#e5e4de] dark:border-[#282d3f] bg-[#fbfbf9] dark:bg-[#181b26] p-1">
            <button
              type="button"
              onClick={() => setChartMode("trend")}
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                chartMode === "trend"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-[#575953] hover:text-[#20211f] dark:text-[#94a3b8]"
              }`}
              title="Multi-Curve Cash Flow Area Graph"
            >
              <LineChart size={13} />
              <span className="hidden sm:inline">Trend Curve</span>
            </button>
            <button
              type="button"
              onClick={() => setChartMode("candlestick")}
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                chartMode === "candlestick"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-[#575953] hover:text-[#20211f] dark:text-[#94a3b8]"
              }`}
              title="Financial Trading Candlesticks"
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
                  : "text-[#575953] hover:text-[#20211f] dark:text-[#94a3b8]"
              }`}
              title="Inflow vs Outflow Cash Volume"
            >
              <BarChart2 size={13} />
              <span className="hidden sm:inline">Cash Volume</span>
            </button>
          </div>

          {/* SMA Toggle */}
          <button
            type="button"
            onClick={() => setShowSMA((prev) => !prev)}
            className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
              showSMA
                ? "border-amber-400 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-300"
                : "border-[#e5e4de] dark:border-[#282d3f] text-[#62645d] dark:text-[#94a3b8]"
            }`}
            title="Toggle 6-Month Moving Average Line"
          >
            SMA (6M)
          </button>
        </div>
      </div>

      {/* Floating Active Month HUD Badge */}
      {activeRecord && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e5e4de] dark:border-[#232736] bg-[#fbfbf9] dark:bg-[#181b26] p-3 text-xs">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-[#62645d] dark:text-[#94a3b8]" />
            <span className="font-semibold text-[#20211f] dark:text-[#f8fafc]">
              {activeRecord.monthLabel}
            </span>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                activeRecord.isBullish
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
              }`}
            >
              {activeRecord.isBullish ? "▲ Surplus Month" : "▼ Drawdown Month"}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 font-mono text-[11px]">
            <div>
              <span className="text-[#62645d] dark:text-[#94a3b8]">Inflow: </span>
              <strong className="text-[#16a34a] dark:text-[#34d399]">
                +{money(activeRecord.inflow)}
              </strong>
            </div>
            <div>
              <span className="text-[#62645d] dark:text-[#94a3b8]">Spend: </span>
              <strong className="text-[#dc2626] dark:text-[#f87171]">
                −{money(activeRecord.outflow)}
              </strong>
            </div>
            <div>
              <span className="text-[#62645d] dark:text-[#94a3b8]">Net Retained: </span>
              <strong className="text-[#2563eb] dark:text-[#60a5fa]">
                {money(activeRecord.net)}
              </strong>
            </div>
            <div>
              <span className="text-[#62645d] dark:text-[#94a3b8]">Portfolio Reserve: </span>
              <strong className="text-[#20211f] dark:text-[#f8fafc]">
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
            <linearGradient id="inflowGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>

            {/* Red Outflow Gradient */}
            <linearGradient id="outflowGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.30" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
            </linearGradient>

            {/* Blue Cumulative Reserve Gradient */}
            <linearGradient id="reserveGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
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
                  stroke="currentColor"
                  strokeOpacity={0.08}
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-[#888982] dark:fill-[#64748b] text-[9px] font-mono"
                >
                  {val >= 100000
                    ? `₹${(val / 100000).toFixed(1)}L`
                    : `₹${(val / 1000).toFixed(0)}k`}
                </text>
              </g>
            );
          })}

          {/* Year Markers (X-Axis) */}
          {filteredRecords.map((r, i) => {
            // Show label every 6 or 12 months
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
                  stroke="currentColor"
                  strokeOpacity={0.2}
                />
                <text
                  x={x}
                  y={height - padding.bottom + 18}
                  textAnchor="middle"
                  className="fill-[#62645d] dark:fill-[#94a3b8] text-[9px] font-medium"
                >
                  {filteredRecords.length <= 12 ? r.monthLabel.split(" ")[0] : r.year}
                </text>
              </g>
            );
          })}

          {/* MODE 1: AREA & TREND CURVES */}
          {chartMode === "trend" && (
            <>
              {/* Green Inflow Area & Stroke */}
              <path d={createAreaPath((r) => r.inflow)} fill="url(#inflowGrad)" />
              <path
                d={createPath((r) => r.inflow)}
                fill="none"
                stroke="#10b981"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Red Outflow Area & Stroke */}
              <path d={createAreaPath((r) => r.outflow)} fill="url(#outflowGrad)" />
              <path
                d={createPath((r) => r.outflow)}
                fill="none"
                stroke="#ef4444"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Blue Cumulative Reserve Line */}
              <path
                d={createPath((r) => r.cumulativeBalance)}
                fill="none"
                stroke="#3b82f6"
                strokeWidth={2.5}
                strokeDasharray="2 2"
                strokeLinecap="round"
              />
            </>
          )}

          {/* MODE 2: STOCK MARKET CANDLESTICKS */}
          {chartMode === "candlestick" && (
            <>
              {filteredRecords.map((r, i) => {
                const x = getX(i);
                const barWidth = Math.max(3, graphWidth / filteredRecords.length - 2);
                const yHigh = getY(r.high);
                const yLow = getY(r.low);
                const yOpen = getY(r.open);
                const yClose = getY(r.close);
                const candleColor = r.isBullish ? "#10b981" : "#ef4444";

                const topY = Math.min(yOpen, yClose);
                const candleHeight = Math.max(2, Math.abs(yClose - yOpen));

                return (
                  <g key={r.monthKey}>
                    {/* Wick */}
                    <line
                      x1={x}
                      y1={yHigh}
                      x2={x}
                      y2={yLow}
                      stroke={candleColor}
                      strokeWidth={1.2}
                    />
                    {/* Candle Body */}
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

          {/* MODE 3: INFLOW VS OUTFLOW VOLUME HISTOGRAM */}
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
                    {/* Inflow Bar (Green) */}
                    <rect
                      x={x - barWidth}
                      y={yIn}
                      width={barWidth - 0.5}
                      height={Math.max(2, baseY - yIn)}
                      fill="#10b981"
                      fillOpacity={0.8}
                      rx={1}
                    />
                    {/* Outflow Bar (Red) */}
                    <rect
                      x={x}
                      y={yOut}
                      width={barWidth - 0.5}
                      height={Math.max(2, baseY - yOut)}
                      fill="#ef4444"
                      fillOpacity={0.8}
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
              stroke="#f59e0b"
              strokeWidth={1.8}
              strokeDasharray="4 2"
              strokeOpacity={0.85}
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
                stroke="#64748b"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              {/* Inflow Dot */}
              <circle
                cx={getX(hoveredIndex)}
                cy={getY(filteredRecords[hoveredIndex].inflow)}
                r={4}
                fill="#10b981"
                stroke="#ffffff"
                strokeWidth={2}
              />
              {/* Outflow Dot */}
              <circle
                cx={getX(hoveredIndex)}
                cy={getY(filteredRecords[hoveredIndex].outflow)}
                r={4}
                fill="#ef4444"
                stroke="#ffffff"
                strokeWidth={2}
              />
            </>
          )}
        </svg>
      </div>

      {/* Legend & Methodology Footer */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#eeede8] dark:border-[#232736] pt-3 text-[11px] text-[#62645d] dark:text-[#94a3b8]">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#10b981]" />
            Monthly Inflow (Credits)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#ef4444]" />
            Monthly Outflow (Debits)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#3b82f6]" />
            Net Wealth Reserve
          </span>
          {showSMA && (
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-3 bg-[#f59e0b]" />
              6-Month Moving Average (SMA)
            </span>
          )}
        </div>

        <span className="font-mono text-[10px]">
          Sampled: {filteredRecords.length} Monthly Statements • 10-Yr Continuous Series
        </span>
      </div>
    </section>
  );
}
