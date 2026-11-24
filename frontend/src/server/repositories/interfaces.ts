import {
  DomainUser,
  DomainBankAccount,
  DomainTransaction,
  DomainBudget,
  DomainFinancialGoal,
  TransactionFilter,
  TransactionSummaryAggregate,
} from "../domain/types";

export interface IUserRepository {
  findById(id: string): Promise<DomainUser | null>;
  findByEmail(email: string): Promise<DomainUser | null>;
  findByAuthUserId(authUserId: string): Promise<DomainUser | null>;
  create(user: Omit<DomainUser, "id" | "createdAt" | "updatedAt">): Promise<DomainUser>;
  update(id: string, updates: Partial<DomainUser>): Promise<DomainUser>;
}

export interface IBankAccountRepository {
  findById(id: string, userId: string): Promise<DomainBankAccount | null>;
  listByUserId(userId: string): Promise<DomainBankAccount[]>;
  create(account: Omit<DomainBankAccount, "id" | "createdAt" | "updatedAt">): Promise<DomainBankAccount>;
  updateBalance(id: string, userId: string, balance: number): Promise<DomainBankAccount>;
  delete(id: string, userId: string): Promise<boolean>;
}

export interface ITransactionRepository {
  findById(id: string, userId: string): Promise<DomainTransaction | null>;
  findByDedupHash(dedupHash: string): Promise<DomainTransaction | null>;
  list(filter: TransactionFilter): Promise<{ transactions: DomainTransaction[]; total: number }>;
  create(tx: Omit<DomainTransaction, "id" | "createdAt">): Promise<DomainTransaction>;
  createMany(txs: Omit<DomainTransaction, "id" | "createdAt">[]): Promise<number>;
  delete(id: string, userId: string): Promise<boolean>;
  getMonthlySummary(userId: string, year: number, month: number, currency?: string): Promise<TransactionSummaryAggregate>;
}

export interface IBudgetRepository {
  findById(id: string, userId: string): Promise<DomainBudget | null>;
  listByUserId(userId: string): Promise<DomainBudget[]>;
  create(budget: Omit<DomainBudget, "id" | "createdAt">): Promise<DomainBudget>;
  update(id: string, userId: string, updates: Partial<DomainBudget>): Promise<DomainBudget>;
  delete(id: string, userId: string): Promise<boolean>;
}

export interface IFinancialGoalRepository {
  findById(id: string, userId: string): Promise<DomainFinancialGoal | null>;
  listByUserId(userId: string): Promise<DomainFinancialGoal[]>;
  create(goal: Omit<DomainFinancialGoal, "id" | "createdAt" | "updatedAt">): Promise<DomainFinancialGoal>;
  update(id: string, userId: string, updates: Partial<DomainFinancialGoal>): Promise<DomainFinancialGoal>;
  delete(id: string, userId: string): Promise<boolean>;
}
