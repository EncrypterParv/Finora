import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
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

// Helper to convert Prisma JSON to Record<string, unknown>
function parseJsonField(val: unknown): Record<string, unknown> {
  if (val && typeof val === "object" && !Array.isArray(val)) {
    return val as Record<string, unknown>;
  }
  return {};
}

export class PrismaTransactionRepository implements ITransactionRepository {
  async findById(id: string, userId: string): Promise<DomainTransaction | null> {
    const tx = await prisma.transaction.findFirst({
      where: { id, userId },
      include: { category: true, merchant: true },
    });
    if (!tx) return null;
    return this.mapToDomain(tx);
  }

  async findByDedupHash(dedupHash: string): Promise<DomainTransaction | null> {
    const tx = await prisma.transaction.findUnique({
      where: { dedupHash },
      include: { category: true, merchant: true },
    });
    if (!tx) return null;
    return this.mapToDomain(tx);
  }

  async list(filter: TransactionFilter): Promise<{ transactions: DomainTransaction[]; total: number }> {
    const where: Prisma.TransactionWhereInput = {
      userId: filter.userId,
    };

    if (filter.accountId) where.accountId = filter.accountId;
    if (filter.transactionType) where.transactionType = filter.transactionType;
    if (filter.startDate || filter.endDate) {
      where.occurredAt = {};
      if (filter.startDate) where.occurredAt.gte = filter.startDate;
      if (filter.endDate) where.occurredAt.lte = filter.endDate;
    }
    if (filter.searchQuery) {
      where.rawDescription = {
        contains: filter.searchQuery,
        mode: "insensitive",
      };
    }

    const [total, rows] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        include: { category: true, merchant: true },
        orderBy: { occurredAt: "desc" },
        take: filter.limit ?? 50,
        skip: filter.offset ?? 0,
      }),
    ]);

    return {
      transactions: rows.map((r) => this.mapToDomain(r)),
      total,
    };
  }

  async create(tx: Omit<DomainTransaction, "id" | "createdAt">): Promise<DomainTransaction> {
    const created = await prisma.transaction.create({
      data: {
        userId: tx.userId,
        accountId: tx.accountId,
        categoryId: tx.categoryId,
        merchantId: tx.merchantId,
        occurredAt: tx.occurredAt,
        amount: new Prisma.Decimal(tx.amount),
        currency: tx.currency,
        transactionType: tx.transactionType,
        rawDescription: tx.rawDescription,
        balanceBefore: tx.balanceBefore !== null && tx.balanceBefore !== undefined ? new Prisma.Decimal(tx.balanceBefore) : null,
        balanceAfter: tx.balanceAfter !== null && tx.balanceAfter !== undefined ? new Prisma.Decimal(tx.balanceAfter) : null,
        referenceId: tx.referenceId,
        source: tx.source,
        dedupHash: tx.dedupHash,
        taxInfo: (tx.taxInfo ?? undefined) as Prisma.InputJsonValue | undefined,
        metadata: (tx.metadata ?? {}) as Prisma.InputJsonValue,
      },
      include: { category: true, merchant: true },
    });
    return this.mapToDomain(created);
  }

  async createMany(txs: Omit<DomainTransaction, "id" | "createdAt">[]): Promise<number> {
    const result = await prisma.transaction.createMany({
      data: txs.map((tx) => ({
        userId: tx.userId,
        accountId: tx.accountId,
        categoryId: tx.categoryId,
        merchantId: tx.merchantId,
        occurredAt: tx.occurredAt,
        amount: new Prisma.Decimal(tx.amount),
        currency: tx.currency,
        transactionType: tx.transactionType,
        rawDescription: tx.rawDescription,
        balanceBefore: tx.balanceBefore !== null && tx.balanceBefore !== undefined ? new Prisma.Decimal(tx.balanceBefore) : null,
        balanceAfter: tx.balanceAfter !== null && tx.balanceAfter !== undefined ? new Prisma.Decimal(tx.balanceAfter) : null,
        referenceId: tx.referenceId,
        source: tx.source,
        dedupHash: tx.dedupHash,
        taxInfo: (tx.taxInfo ?? undefined) as Prisma.InputJsonValue | undefined,
        metadata: (tx.metadata ?? {}) as Prisma.InputJsonValue,
      })),
      skipDuplicates: true,
    });
    return result.count;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    try {
      await prisma.transaction.delete({
        where: { id, userId },
      });
      return true;
    } catch {
      return false;
    }
  }

  async getMonthlySummary(
    userId: string,
    year: number,
    month: number,
    currency = "INR"
  ): Promise<TransactionSummaryAggregate> {
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const txs = await prisma.transaction.findMany({
      where: {
        userId,
        currency,
        occurredAt: { gte: startDate, lte: endDate },
      },
    });

    let totalDebits = 0;
    let totalCredits = 0;

    for (const t of txs) {
      const amt = Number(t.amount);
      if (t.transactionType === "DEBIT") totalDebits += amt;
      else if (t.transactionType === "CREDIT") totalCredits += amt;
    }

    return {
      totalDebits,
      totalCredits,
      netCashFlow: totalCredits - totalDebits,
      currency,
      transactionCount: txs.length,
      periodStart: startDate,
      periodEnd: endDate,
    };
  }

  private mapToDomain(
    tx: Prisma.TransactionGetPayload<{ include: { category: true; merchant: true } }>
  ): DomainTransaction {
    return {
      id: tx.id,
      userId: tx.userId,
      accountId: tx.accountId,
      categoryId: tx.categoryId,
      merchantId: tx.merchantId,
      occurredAt: tx.occurredAt,
      amount: Number(tx.amount),
      currency: tx.currency,
      transactionType: tx.transactionType as DomainTransaction["transactionType"],
      rawDescription: tx.rawDescription,
      merchantName: tx.merchant?.cleanName,
      categoryName: tx.category?.name,
      balanceBefore: tx.balanceBefore ? Number(tx.balanceBefore) : null,
      balanceAfter: tx.balanceAfter ? Number(tx.balanceAfter) : null,
      referenceId: tx.referenceId,
      source: tx.source as DomainTransaction["source"],
      dedupHash: tx.dedupHash,
      taxInfo: parseJsonField(tx.taxInfo),
      metadata: parseJsonField(tx.metadata),
      createdAt: tx.createdAt,
    };
  }
}

export class PrismaBudgetRepository implements IBudgetRepository {
  async findById(id: string, userId: string): Promise<DomainBudget | null> {
    const budget = await prisma.budget.findFirst({
      where: { id, userId },
    });
    if (!budget) return null;
    return {
      id: budget.id,
      userId: budget.userId,
      name: budget.name,
      period: budget.period as DomainBudget["period"],
      totalLimit: Number(budget.totalLimit),
      startDate: budget.startDate,
      endDate: budget.endDate,
      createdAt: budget.createdAt,
    };
  }

  async listByUserId(userId: string): Promise<DomainBudget[]> {
    const budgets = await prisma.budget.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return budgets.map((b) => ({
      id: b.id,
      userId: b.userId,
      name: b.name,
      period: b.period as DomainBudget["period"],
      totalLimit: Number(b.totalLimit),
      startDate: b.startDate,
      endDate: b.endDate,
      createdAt: b.createdAt,
    }));
  }

  async create(budget: Omit<DomainBudget, "id" | "createdAt">): Promise<DomainBudget> {
    const created = await prisma.budget.create({
      data: {
        userId: budget.userId,
        name: budget.name,
        period: budget.period,
        totalLimit: new Prisma.Decimal(budget.totalLimit),
        startDate: budget.startDate,
        endDate: budget.endDate,
      },
    });
    return {
      id: created.id,
      userId: created.userId,
      name: created.name,
      period: created.period as DomainBudget["period"],
      totalLimit: Number(created.totalLimit),
      startDate: created.startDate,
      endDate: created.endDate,
      createdAt: created.createdAt,
    };
  }

  async update(id: string, userId: string, updates: Partial<DomainBudget>): Promise<DomainBudget> {
    const data: Prisma.BudgetUpdateInput = {};
    if (updates.name !== undefined) data.name = updates.name;
    if (updates.totalLimit !== undefined) data.totalLimit = new Prisma.Decimal(updates.totalLimit);
    if (updates.startDate !== undefined) data.startDate = updates.startDate;
    if (updates.endDate !== undefined) data.endDate = updates.endDate;

    const updated = await prisma.budget.update({
      where: { id, userId },
      data,
    });
    return {
      id: updated.id,
      userId: updated.userId,
      name: updated.name,
      period: updated.period as DomainBudget["period"],
      totalLimit: Number(updated.totalLimit),
      startDate: updated.startDate,
      endDate: updated.endDate,
      createdAt: updated.createdAt,
    };
  }

  async delete(id: string, userId: string): Promise<boolean> {
    try {
      await prisma.budget.delete({
        where: { id, userId },
      });
      return true;
    } catch {
      return false;
    }
  }
}

export class PrismaGoalRepository implements IFinancialGoalRepository {
  async findById(id: string, userId: string): Promise<DomainFinancialGoal | null> {
    const goal = await prisma.financialGoal.findFirst({
      where: { id, userId },
    });
    if (!goal) return null;
    return {
      id: goal.id,
      userId: goal.userId,
      title: goal.title,
      goalType: goal.goalType,
      targetAmount: Number(goal.targetAmount),
      currentSaved: Number(goal.currentSaved),
      monthlyContribution: Number(goal.monthlyContribution),
      targetDate: goal.targetDate,
      expectedAnnualReturnPct: Number(goal.expectedAnnualReturnPct),
      status: goal.status as DomainFinancialGoal["status"],
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt,
    };
  }

  async listByUserId(userId: string): Promise<DomainFinancialGoal[]> {
    const goals = await prisma.financialGoal.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return goals.map((g) => ({
      id: g.id,
      userId: g.userId,
      title: g.title,
      goalType: g.goalType,
      targetAmount: Number(g.targetAmount),
      currentSaved: Number(g.currentSaved),
      monthlyContribution: Number(g.monthlyContribution),
      targetDate: g.targetDate,
      expectedAnnualReturnPct: Number(g.expectedAnnualReturnPct),
      status: g.status as DomainFinancialGoal["status"],
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
    }));
  }

  async create(goal: Omit<DomainFinancialGoal, "id" | "createdAt" | "updatedAt">): Promise<DomainFinancialGoal> {
    const created = await prisma.financialGoal.create({
      data: {
        userId: goal.userId,
        title: goal.title,
        goalType: goal.goalType,
        targetAmount: new Prisma.Decimal(goal.targetAmount),
        currentSaved: new Prisma.Decimal(goal.currentSaved),
        monthlyContribution: new Prisma.Decimal(goal.monthlyContribution),
        targetDate: goal.targetDate,
        expectedAnnualReturnPct: new Prisma.Decimal(goal.expectedAnnualReturnPct),
        status: goal.status,
      },
    });
    return {
      id: created.id,
      userId: created.userId,
      title: created.title,
      goalType: created.goalType,
      targetAmount: Number(created.targetAmount),
      currentSaved: Number(created.currentSaved),
      monthlyContribution: Number(created.monthlyContribution),
      targetDate: created.targetDate,
      expectedAnnualReturnPct: Number(created.expectedAnnualReturnPct),
      status: created.status as DomainFinancialGoal["status"],
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }

  async update(id: string, userId: string, updates: Partial<DomainFinancialGoal>): Promise<DomainFinancialGoal> {
    const data: Prisma.FinancialGoalUpdateInput = {};
    if (updates.title !== undefined) data.title = updates.title;
    if (updates.targetAmount !== undefined) data.targetAmount = new Prisma.Decimal(updates.targetAmount);
    if (updates.currentSaved !== undefined) data.currentSaved = new Prisma.Decimal(updates.currentSaved);
    if (updates.monthlyContribution !== undefined) {
      data.monthlyContribution = new Prisma.Decimal(updates.monthlyContribution);
    }
    if (updates.targetDate !== undefined) data.targetDate = updates.targetDate;
    if (updates.status !== undefined) data.status = updates.status;

    const updated = await prisma.financialGoal.update({
      where: { id, userId },
      data,
    });
    return {
      id: updated.id,
      userId: updated.userId,
      title: updated.title,
      goalType: updated.goalType,
      targetAmount: Number(updated.targetAmount),
      currentSaved: Number(updated.currentSaved),
      monthlyContribution: Number(updated.monthlyContribution),
      targetDate: updated.targetDate,
      expectedAnnualReturnPct: Number(updated.expectedAnnualReturnPct),
      status: updated.status as DomainFinancialGoal["status"],
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async delete(id: string, userId: string): Promise<boolean> {
    try {
      await prisma.financialGoal.delete({
        where: { id, userId },
      });
      return true;
    } catch {
      return false;
    }
  }
}
