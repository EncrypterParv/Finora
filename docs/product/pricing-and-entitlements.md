# Pricing Architecture & Entitlements — Finora

## 1. Plan Structure & Capabilities Matrix

Finora uses a centralized, capability-driven entitlement model rather than scattered conditional checks.

| Feature Domain | Individual (Starter) | Individual Pro | Teams | Enterprise |
| :--- | :--- | :--- | :--- | :--- |
| **Financial Calendar** | Day / Week / Month Views | Full + Custom Ranges | Shared Team Calendars | Multi-entity Consolidation |
| **Historical Coverage**| 3 Months | 5 Years Historical | Unlimited | Multi-year Audit Archive |
| **Forecasting Engine** | Deterministic Linear (30d)| ML Exponential + Holt-Winters (90d)| Team Cash-Flow Projection| Enterprise Scenario Engine |
| **Connected Accounts** | Up to 2 Accounts | Unlimited Accounts | Unlimited | Custom Core-Banking Hooks |
| **Statement Ingestion**| CSV Uploads | CSV, XLSX, PDF Parsers | Bulk Multi-statement Upload| Direct SFTP & Automated Ingestion |
| **Anomaly Detection**  | Basic Thresholds | Isolation Forest ML Alerts | Team Fraud & Outlier Alerts | Continuous Security Auditing |
| **FIRE Goal Scenarios**| Single Goal | Unlimited Multi-scenario | Team Budget Milestones | Corporate Financial Planning |

---

## 2. Centralized Entitlement Code Contract

```typescript
export interface PlanCapabilities {
  maxAccounts: number;
  maxHistoricalMonths: number;
  advancedForecasting: boolean;
  pdfStatementImport: boolean;
  isolationForestAnomalies: boolean;
  multiGoalScenarios: boolean;
  teamCollaboration: boolean;
}

export const PLAN_CONFIGS: Record<PlanTier, PlanCapabilities> = {
  INDIVIDUAL: {
    maxAccounts: 2,
    maxHistoricalMonths: 3,
    advancedForecasting: false,
    pdfStatementImport: false,
    isolationForestAnomalies: false,
    multiGoalScenarios: false,
    teamCollaboration: false,
  },
  INDIVIDUAL_PRO: {
    maxAccounts: 999,
    maxHistoricalMonths: 60,
    advancedForecasting: true,
    pdfStatementImport: true,
    isolationForestAnomalies: true,
    multiGoalScenarios: true,
    teamCollaboration: false,
  },
  TEAMS: {
    maxAccounts: 999,
    maxHistoricalMonths: 120,
    advancedForecasting: true,
    pdfStatementImport: true,
    isolationForestAnomalies: true,
    multiGoalScenarios: true,
    teamCollaboration: true,
  },
  ENTERPRISE: {
    maxAccounts: 9999,
    maxHistoricalMonths: 999,
    advancedForecasting: true,
    pdfStatementImport: true,
    isolationForestAnomalies: true,
    multiGoalScenarios: true,
    teamCollaboration: true,
  },
};
```
