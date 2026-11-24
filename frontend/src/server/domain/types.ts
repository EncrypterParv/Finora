/**
 * Finora Domain Types & DTOs
 * Strongly typed representation of core financial entities and contracts.
 */

export type TransactionType = "DEBIT" | "CREDIT" | "TRANSFER";
export type TransactionSource = "BANK_API" | "CSV" | "XLSX" | "PDF" | "IMAGE" | "MANUAL";
export type AccountType = "SAVINGS" | "CURRENT" | "CREDIT" | "INVESTMENT";

export interface DomainUser {
  id: string;
  authUserId: string;
  email: string;
  fullName: string;
  currency: string;
  preferences?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface DomainBankAccount {
  id: string;
  userId: string;
  institutionName: string;
  accountNumberMasked: string;
  accountType: AccountType | string;
  currentBalance: number;
  currency: string;
  adapterType: string;
  lastSyncedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DomainTransaction {
  id: string;
  userId: string;
  accountId: string;
  categoryId?: string | null;
  merchantId?: string | null;
  occurredAt: Date;
  amount: number;
  currency: string;
  transactionType: TransactionType;
  rawDescription: string;
  merchantName?: string;
  categoryName?: string;
  balanceBefore?: number | null;
  balanceAfter?: number | null;
  referenceId: string;
  source: TransactionSource;
  dedupHash: string;
  taxInfo?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface DomainBudget {
  id: string;
  userId: string;
  name: string;
  period: "MONTHLY" | "CUSTOM";
  totalLimit: number;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  allocatedAmount?: number;
  currentSpend?: number;
}

export interface DomainFinancialGoal {
  id: string;
  userId: string;
  title: string;
  goalType: string;
  targetAmount: number;
  currentSaved: number;
  monthlyContribution: number;
  targetDate: Date;
  expectedAnnualReturnPct: number;
  status: "ACTIVE" | "COMPLETED" | "PAUSED";
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionFilter {
  userId: string;
  accountId?: string;
  startDate?: Date;
  endDate?: Date;
  transactionType?: TransactionType;
  searchQuery?: string;
  limit?: number;
  offset?: number;
}

export interface TransactionSummaryAggregate {
  totalDebits: number;
  totalCredits: number;
  netCashFlow: number;
  currency: string;
  transactionCount: number;
  periodStart: Date;
  periodEnd: Date;
}
