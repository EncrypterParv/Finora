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
