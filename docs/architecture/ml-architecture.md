# Machine Learning & Behavioural Analytics Architecture — Finora

## 1. Intelligence Vision & Guiding Philosophy

Finora rejects "AI theater" (e.g. wrapping trivial sum queries in LLM prompts or training opaque neural networks on sparse tabular data).

Instead, our intelligence subsystem follows a **three-tier progressive architecture**:
1. **Tier 1: Deterministic & Statistical Modeling** (Rolling aggregates, EMA, rate-of-change, linear trendlines).
2. **Tier 2: Classic Machine Learning** (Isolation Forest for spending anomalies, Random Forest / GBDT for multi-variable category forecasting).
3. **Tier 3: Behavioural Rule & Recommendation Engine** (Actionable financial nudge generator).

---

## 2. ML Pipeline & Data Flow

```mermaid
flowchart LR
    Tx[Canonical transactions] --> Features[Feature extraction\nspend, time, category, cash flow]
    Features --> Forecast[Month-end forecast\nlinear trend and EMA]
    Tx --> Anomaly[Anomaly detector\ncategory baselines and Z-score]
    Tx --> Changes[Change detector\nactive 30 days vs prior 60]
    Features --> Gate{Basic sufficiency\n≥5 transactions across ≥7 days}
    Forecast --> Gate
    Anomaly --> Gate
    Changes --> Gate
    Gate -->|sufficient| Recs[Evidence-based recommendations]
    Gate -->|insufficient| Guidance[Honest import guidance]
    Recs --> Overview[Analytics overview]
    Guidance --> Overview

    Tx --> Redaction[Historical sampling privacy boundary\nmask descriptions and identifiers]
    Redaction --> Historical[Historical sampling output]
```

The redaction boundary shown applies to the historical sampling engine, which
sanitizes transaction dictionaries before analysis. The ordinary overview uses
canonical records for deterministic calculations and does not log raw transaction
descriptions or account references.

---

## 3. Feature Store Schema

| Feature Name | Type | Description |
| :--- | :--- | :--- |
| `burn_rate_daily_avg_30d` | `Decimal` | Average daily expenditure over the prior 30 days. |
| `weekend_spend_ratio` | `Float` | Percentage of total discretionary spending occurring on Sat/Sun. |
| `discretionary_spend_ratio`| `Float` | Dining, Shopping, Entertainment vs. Rent, Utilities, Groceries. |
| `impulse_index` | `Float (0-1.0)`| Proportion of unplanned transactions with high frequency & variance. |
| `savings_rate` | `Float` | `(Net Income - Total Spend) / Net Income`. |
| `runway_days` | `Integer` | Liquid account balance / average daily burn rate. |

---

## 4. Anomaly Detection & Forecasting Heuristics

- **Isolation Forest**: Trained per-user when transaction count > 50. Outlier score indicates unusual volume, odd time of day, or rare merchant.
- **Budget Exhaustion**:
  $$\text{Projected Exhaustion Day} = \frac{\text{Budget Limit} - \text{Current Spend}}{\text{Rolling 7-Day Average Daily Spend}} + \text{Current Day}$$
  If $\text{Projected Exhaustion Day} < \text{Days in Month}$, a budget breach alert is flagged.


---

## 5. Multi-Horizon Historical Engine & Kiteworks Zero-Trust Isolation

For detailed system diagrams, local RAG retrieval architecture, and the complete Kiteworks air-gapped quarantine perimeter specification, see [system-design-and-ml-rag.md](system-design-and-ml-rag.md).

- **Multi-Horizon Slicing**: Evaluates user financial data across 30 days, 1 year, 5 years, 10 years, and all-time connected history.
- **Kiteworks Privacy Gate**: Enforces `KW-FIN-ZERO-LEAKAGE-2026.1` zero-trust policy. All PII is sanitized and salted; zero data leaves the local in-process memory. Third-party cloud LLM inference is strictly blocked.
- **Empirical Bootstrap Sampling**: Computes 1,000 non-parametric bootstrap draws per horizon to deliver honest 80% and 95% empirical confidence intervals without cloud dependency.
