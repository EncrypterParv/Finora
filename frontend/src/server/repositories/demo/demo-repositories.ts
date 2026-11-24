import {
  demoAccounts,
  demoTransactions,
  demoBudgets,
  demoGoals,
} from "@/lib/demo-data";
import {
  DomainUser,
  DomainBankAccount,
  DomainTransaction,
  DomainBudget,
  DomainFinancialGoal,
  TransactionFilter,
  TransactionSummaryAggregate,
} from "../../domain/types";
import {
  IUserRepository,
  IBankAccountRepository,
  ITransactionRepository,
  IBudgetRepository,
  IFinancialGoalRepository,
} from "../interfaces";

const DEMO_USER: DomainUser = {
  id: "demo-user",
  authUserId: "00000000-0000-0000-0000-000000000000",
  email: "demo@finora.internal",
  fullName: "Finora Demo User",
  currency: "INR",
  preferences: { theme: "amoled", currency: "INR" },
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-10-18T00:00:00Z"),
};

export class DemoUserRepository implements IUserRepository {
  async findById(id: string): Promise<DomainUser | null> {
    return id === DEMO_USER.id ? DEMO_USER : null;
  }
  async findByEmail(email: string): Promise<DomainUser | null> {
    return email === DEMO_USER.email ? DEMO_USER : null;
  }
  async findByAuthUserId(authUserId: string): Promise<DomainUser | null> {
    return authUserId === DEMO_USER.authUserId ? DEMO_USER : null;
  }
  async create(user: Omit<DomainUser, "id" | "createdAt" | "updatedAt">): Promise<DomainUser> {
    return {
      ...user,
      id: "demo-user-created",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
  async update(_id: string, updates: Partial<DomainUser>): Promise<DomainUser> {
    return { ...DEMO_USER, ...updates, updatedAt: new Date() };
  }
}

export class DemoAccountRepository implements IBankAccountRepository {
  private accounts: DomainBankAccount[] = demoAccounts.map((a) => ({
    id: a.id,
    userId: DEMO_USER.id,
    institutionName: a.institution_name,
    accountNumberMasked: a.account_number_masked,
    accountType: a.account_type,
    currentBalance: 128450.0,
    currency: a.currency,
    adapterType: a.adapter_type,
    lastSyncedAt: new Date("2026-10-18T10:00:00Z"),
    createdAt: new Date(a.created_at),
    updatedAt: new Date(a.created_at),
  }));

  async findById(id: string, userId: string): Promise<DomainBankAccount | null> {
    const acc = this.accounts.find((a) => a.id === id && a.userId === userId);
    return acc ? { ...acc } : null;
  }

  async listByUserId(userId: string): Promise<DomainBankAccount[]> {
    return this.accounts.filter((a) => a.userId === userId).map((a) => ({ ...a }));
  }

  async create(account: Omit<DomainBankAccount, "id" | "createdAt" | "updatedAt">): Promise<DomainBankAccount> {
    const created: DomainBankAccount = {
      ...account,
      id: `acc-demo-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.accounts.push(created);
    return { ...created };
  }

  async updateBalance(id: string, userId: string, balance: number): Promise<DomainBankAccount> {
    const acc = await this.findById(id, userId);
    if (!acc) throw new Error("Account not found");
    acc.currentBalance = balance;
    acc.updatedAt = new Date();
    return { ...acc };
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const idx = this.accounts.findIndex((a) => a.id === id && a.userId === userId);
    if (idx !== -1) {
      this.accounts.splice(idx, 1);
      return true;
    }
    return false;
  }
}

export class DemoTransactionRepository implements ITransactionRepository {
  private transactions: DomainTransaction[] = demoTransactions.map((t) => ({
    id: t.id,
    userId: t.user_id,
    accountId: t.account_id,
    occurredAt: new Date(t.occurred_at),
    amount: t.amount,
    currency: t.currency,
    transactionType: t.transaction_type,
    rawDescription: t.raw_description,
    merchantName: t.merchant_name,
    categoryName: t.category_name,
    referenceId: t.reference_id,
    source: t.source,
    dedupHash: `dedup-${t.id}`,
    createdAt: new Date(t.created_at),
  }));

  async findById(id: string, userId: string): Promise<DomainTransaction | null> {
    const tx = this.transactions.find((t) => t.id === id && t.userId === userId);
    return tx ? { ...tx } : null;
  }

  async findByDedupHash(dedupHash: string): Promise<DomainTransaction | null> {
    const tx = this.transactions.find((t) => t.dedupHash === dedupHash);
    return tx ? { ...tx } : null;
  }

  async list(filter: TransactionFilter): Promise<{ transactions: DomainTransaction[]; total: number }> {
    let rows = this.transactions.filter((t) => t.userId === filter.userId);

    if (filter.accountId) rows = rows.filter((t) => t.accountId === filter.accountId);
    if (filter.transactionType) rows = rows.filter((t) => t.transactionType === filter.transactionType);
    if (filter.startDate) rows = rows.filter((t) => t.occurredAt >= filter.startDate!);
    if (filter.endDate) rows = rows.filter((t) => t.occurredAt <= filter.endDate!);
    if (filter.searchQuery) {
      const q = filter.searchQuery.toLowerCase();
      rows = rows.filter(
        (t) =>
          t.rawDescription.toLowerCase().includes(q) ||
          (t.merchantName && t.merchantName.toLowerCase().includes(q))
      );
    }

    const total = rows.length;
    const offset = filter.offset ?? 0;
    const limit = filter.limit ?? 50;
    const paged = rows.slice(offset, offset + limit);

    return {
      transactions: paged.map((t) => ({ ...t })),
      total,
    };
  }

  async create(tx: Omit<DomainTransaction, "id" | "createdAt">): Promise<DomainTransaction> {
    const created: DomainTransaction = {
      ...tx,
      id: `demo-tx-${Date.now()}`,
      createdAt: new Date(),
    };
    this.transactions.unshift(created);
    return { ...created };
  }

  async createMany(txs: Omit<DomainTransaction, "id" | "createdAt">[]): Promise<number> {
    for (const tx of txs) {
      await this.create(tx);
    }
    return txs.length;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const idx = this.transactions.findIndex((t) => t.id === id && t.userId === userId);
    if (idx !== -1) {
      this.transactions.splice(idx, 1);
      return true;
    }
    return false;
  }

  async getMonthlySummary(
    userId: string,
    year: number,
    month: number,
    currency = "INR"
  ): Promise<TransactionSummaryAggregate> {
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const rows = this.transactions.filter(
      (t) =>
        t.userId === userId &&
        t.currency === currency &&
        t.occurredAt >= startDate &&
        t.occurredAt <= endDate
    );

    let totalDebits = 0;
    let totalCredits = 0;

    for (const r of rows) {
      if (r.transactionType === "DEBIT") totalDebits += r.amount;
      else if (r.transactionType === "CREDIT") totalCredits += r.amount;
    }

    return {
      totalDebits,
      totalCredits,
      netCashFlow: totalCredits - totalDebits,
      currency,
      transactionCount: rows.length,
      periodStart: startDate,
      periodEnd: endDate,
    };
  }
}

export class DemoBudgetRepository implements IBudgetRepository {
  private budgets: DomainBudget[] = demoBudgets().map((b) => ({
    id: b.id,
    userId: DEMO_USER.id,
    name: b.name,
    period: "MONTHLY",
    totalLimit: b.total_limit,
    startDate: new Date(b.start_date),
    endDate: new Date(b.end_date),
    createdAt: new Date(b.start_date),
    currentSpend: b.total_spent,
  }));

  async findById(id: string, userId: string): Promise<DomainBudget | null> {
    const b = this.budgets.find((bg) => bg.id === id && bg.userId === userId);
    return b ? { ...b } : null;
  }

  async listByUserId(userId: string): Promise<DomainBudget[]> {
    return this.budgets.filter((b) => b.userId === userId).map((b) => ({ ...b }));
  }

  async create(budget: Omit<DomainBudget, "id" | "createdAt">): Promise<DomainBudget> {
    const created: DomainBudget = {
      ...budget,
      id: `demo-budget-${Date.now()}`,
      createdAt: new Date(),
    };
    this.budgets.push(created);
    return { ...created };
  }

  async update(id: string, userId: string, updates: Partial<DomainBudget>): Promise<DomainBudget> {
    const b = await this.findById(id, userId);
    if (!b) throw new Error("Budget not found");
    Object.assign(b, updates);
    return { ...b };
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const idx = this.budgets.findIndex((b) => b.id === id && b.userId === userId);
    if (idx !== -1) {
      this.budgets.splice(idx, 1);
      return true;
    }
    return false;
  }
}

export class DemoGoalRepository implements IFinancialGoalRepository {
  private goals: DomainFinancialGoal[] = demoGoals().map((g) => ({
    id: g.id,
    userId: DEMO_USER.id,
    title: g.title,
    goalType: g.goal_type,
    targetAmount: g.target_amount,
    currentSaved: g.current_saved,
    monthlyContribution: g.monthly_contribution,
    targetDate: new Date(g.target_date),
    expectedAnnualReturnPct: g.expected_annual_return_pct,
    status: (g.status === "IN_PROGRESS" ? "ACTIVE" : g.status) as DomainFinancialGoal["status"],
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  async findById(id: string, userId: string): Promise<DomainFinancialGoal | null> {
    const g = this.goals.find((gl) => gl.id === id && gl.userId === userId);
    return g ? { ...g } : null;
  }

  async listByUserId(userId: string): Promise<DomainFinancialGoal[]> {
    return this.goals.filter((g) => g.userId === userId).map((g) => ({ ...g }));
  }

  async create(goal: Omit<DomainFinancialGoal, "id" | "createdAt" | "updatedAt">): Promise<DomainFinancialGoal> {
    const created: DomainFinancialGoal = {
      ...goal,
      id: `demo-goal-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.goals.push(created);
    return { ...created };
  }

  async update(id: string, userId: string, updates: Partial<DomainFinancialGoal>): Promise<DomainFinancialGoal> {
    const g = await this.findById(id, userId);
    if (!g) throw new Error("Goal not found");
    Object.assign(g, updates);
    g.updatedAt = new Date();
    return { ...g };
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const idx = this.goals.findIndex((g) => g.id === id && g.userId === userId);
    if (idx !== -1) {
      this.goals.splice(idx, 1);
      return true;
    }
    return false;
  }
}
