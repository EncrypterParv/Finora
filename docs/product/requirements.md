# Product Requirements Document (PRD) — Finora

## 1. Problem Statement & Mission

Traditional personal finance apps treat user spending as a passive accounting ledger: list of numbers, simple category pie charts, and retrospective notifications after overspending has already occurred.

**Finora transforms financial tracking into an active behavioural intelligence and decision engine.** By fusing a **Financial Calendar** (representing the temporal reality of cash flow) with **predictive ML analytics** and **FIRE goal projection**, it actively shapes positive financial habits.

---

## 2. Core User Personas

1. **The Modern Professional (Aarav, 26)**: Earns a healthy tech salary but experiences "phantom wealth" and month-end cash crunches due to micro-transactions, food delivery, and weekend entertainment. Needs proactive daily burn context and calendar visualization.
2. **The Goal-Oriented Planner (Priya, 31)**: Actively striving towards buying a house and early financial independence. Needs scenario modeling ("If I cut ₹10k from dining out, how many months earlier do I reach my goal?").

---

## 3. Product Feature Matrix

| Feature Domain | Capability | MVP Scope | Post-MVP Vision |
| :--- | :--- | :--- | :--- |
| **Financial Calendar** | Day / Week / Month Views | Full interactive time-axis calendar with event blocks and daily spending totals | Google / Apple Calendar 2-way sync |
| **Bank Integration** | Account & Balance Aggregation | Simulated HSBC Demo Adapter with realistic streaming data | Plaid / Setu / Account Aggregator (AA) integrations |
| **Statement Import** | Historical Parsing | CSV, XLSX, PDF parser with auto-deduplication | OCR for scanned physical receipts |
| **Behaviour Analytics** | Financial Score & Burn Rate | 7d/30d velocity, weekend ratio, impulse index | Peer cohort comparative benchmarking |
| **Forecasting & ML** | End-of-month Forecast | Deterministic linear + Holt-Winters projection, Isolation Forest anomalies | Context-aware agentic nudges |
| **Financial Goals** | Target & Scenario Planning | Emergency fund, Retirement, House goals with dynamic time-to-goal calculator | Auto-invest rule automation |
