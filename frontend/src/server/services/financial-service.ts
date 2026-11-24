import { RepositoryFactory } from "../repositories/factory";
import {
  DomainTransaction,
  TransactionFilter,
  TransactionSummaryAggregate,
} from "../domain/types";

export interface CalendarDayBucket {
  date: string;
  transactions: DomainTransaction[];
  totalDebits: number;
  totalCredits: number;
  netAmount: number;
}

export class FinancialService {
  private txRepo = RepositoryFactory.getTransactionRepository();
  private accountRepo = RepositoryFactory.getAccountRepository();
  private budgetRepo = RepositoryFactory.getBudgetRepository();
  private goalRepo = RepositoryFactory.getGoalRepository();

  async getTransactions(filter: TransactionFilter) {
    return this.txRepo.list(filter);
  }

  async getMonthlySummary(
    userId: string,
    year: number,
    month: number,
    currency = "INR"
  ): Promise<TransactionSummaryAggregate> {
    return this.txRepo.getMonthlySummary(userId, year, month, currency);
  }

  async getCalendarView(
    userId: string,
    year: number,
    month: number
  ): Promise<{ days: CalendarDayBucket[]; summary: TransactionSummaryAggregate }> {
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const { transactions } = await this.txRepo.list({
      userId,
      startDate,
      endDate,
      limit: 1000,
    });

    const dayMap = new Map<string, DomainTransaction[]>();

    for (const tx of transactions) {
      const dateKey = tx.occurredAt.toISOString().split("T")[0];
      const list = dayMap.get(dateKey) ?? [];
      list.push(tx);
      dayMap.set(dateKey, list);
    }

    const days: CalendarDayBucket[] = [];
    const totalDaysInMonth = new Date(year, month, 0).getDate();

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dayTxs = dayMap.get(dateKey) ?? [];

      let totalDebits = 0;
      let totalCredits = 0;

      for (const t of dayTxs) {
        if (t.transactionType === "DEBIT") totalDebits += t.amount;
        else if (t.transactionType === "CREDIT") totalCredits += t.amount;
      }

      days.push({
        date: dateKey,
        transactions: dayTxs,
        totalDebits,
        totalCredits,
        netAmount: totalCredits - totalDebits,
      });
    }

    const summary = await this.txRepo.getMonthlySummary(userId, year, month);

    return {
      days,
      summary,
    };
  }

  async getAccounts(userId: string) {
    return this.accountRepo.listByUserId(userId);
  }

  async getBudgets(userId: string) {
    return this.budgetRepo.listByUserId(userId);
  }

  async getGoals(userId: string) {
    return this.goalRepo.listByUserId(userId);
  }
}
