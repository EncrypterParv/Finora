export type PlanTier = "INDIVIDUAL" | "INDIVIDUAL_PRO" | "TEAMS" | "ENTERPRISE";

export interface PlanCapabilities {
  tierName: string;
  badgeLabel: string;
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
    tierName: "Individual Starter",
    badgeLabel: "Starter",
    maxAccounts: 2,
    maxHistoricalMonths: 3,
    advancedForecasting: false,
    pdfStatementImport: false,
    isolationForestAnomalies: false,
    multiGoalScenarios: false,
    teamCollaboration: false,
  },
  INDIVIDUAL_PRO: {
    tierName: "Individual Pro",
    badgeLabel: "Pro",
    maxAccounts: 999,
    maxHistoricalMonths: 60,
    advancedForecasting: true,
    pdfStatementImport: true,
    isolationForestAnomalies: true,
    multiGoalScenarios: true,
    teamCollaboration: false,
  },
  TEAMS: {
    tierName: "Finora for Teams",
    badgeLabel: "Teams",
    maxAccounts: 999,
    maxHistoricalMonths: 120,
    advancedForecasting: true,
    pdfStatementImport: true,
    isolationForestAnomalies: true,
    multiGoalScenarios: true,
    teamCollaboration: true,
  },
  ENTERPRISE: {
    tierName: "Finora Enterprise",
    badgeLabel: "Enterprise",
    maxAccounts: 9999,
    maxHistoricalMonths: 999,
    advancedForecasting: true,
    pdfStatementImport: true,
    isolationForestAnomalies: true,
    multiGoalScenarios: true,
    teamCollaboration: true,
  },
};

export function getPlanCapabilities(tier: PlanTier = "INDIVIDUAL_PRO"): PlanCapabilities {
  return PLAN_CONFIGS[tier] || PLAN_CONFIGS.INDIVIDUAL;
}
