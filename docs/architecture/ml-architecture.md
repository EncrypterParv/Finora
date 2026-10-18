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
flowchart TD
    subgraph DataIngestion [Canonical Transactions]
        TxStream[(Canonical Transactions\nAmount, Time, Merchant, Category)]
    end

    subgraph FeatureEngineering [Feature Extraction Engine]
        F1[Rolling Spend Velocity\n7-day, 30-day, 90-day EMA]
        F2[Temporal Patterns\nDay-of-Week, Hour-of-Day, Weekend Ratio]
        F3[Merchant & Category Entropy\nConcentration & Frequency Scores]
        F4[Income vs Expense Dynamics\nSavings Rate, Burn Velocity]
    end

    subgraph IntelligenceEngines [Analytical & ML Models]
        M_Forecaster[Spending & Cash Flow Forecaster\nLinear Regression + EMA Trends]
        M_Exhaustion[Budget Exhaustion Predictor\nMonte Carlo / Burn Projection]
        M_Anomaly[Anomaly & Outlier Detector\nIsolation Forest + Z-Score]
        M_Goal[Goal Projection & Scenario Engine\nCompound Interest Simulation]
    end

    subgraph OutputSurfaces [User Experience & Nudges]
        UI_Score[Financial Behaviour Score: 0-100]
        UI_Calendar[Calendar Predicted Daily Burn]
        UI_Alerts[Unusual Transaction Alerts]
        UI_Nudges[Actionable Next-Step Recommendations]
    end

    TxStream --> FeatureEngineering
    FeatureEngineering --> IntelligenceEngines
    IntelligenceEngines --> OutputSurfaces
```

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
