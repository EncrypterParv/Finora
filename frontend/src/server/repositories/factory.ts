import {
  IUserRepository,
  IBankAccountRepository,
  ITransactionRepository,
  IBudgetRepository,
  IFinancialGoalRepository,
} from "./interfaces";
import {
  PrismaUserRepository,
  PrismaAccountRepository,
  PrismaTransactionRepository,
  PrismaBudgetRepository,
  PrismaGoalRepository,
} from "./prisma/prisma-repositories";
import {
  DemoUserRepository,
  DemoAccountRepository,
  DemoTransactionRepository,
  DemoBudgetRepository,
  DemoGoalRepository,
} from "./demo/demo-repositories";

/**
 * RepositoryFactory
 * Provides unified access to repositories adhering to Dependency Inversion (SOLID).
 * Switches seamlessly between Prisma (when DATABASE_URL is configured) and
 * high-fidelity in-memory Demo repositories (for offline / synthetic preview).
 */
export class RepositoryFactory {
  private static isDatabaseConfigured(): boolean {
    return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.length > 0);
  }

  static getUserRepository(forceDemo = false): IUserRepository {
    if (!forceDemo && this.isDatabaseConfigured()) {
      return new PrismaUserRepository();
    }
    return new DemoUserRepository();
  }

  static getAccountRepository(forceDemo = false): IBankAccountRepository {
    if (!forceDemo && this.isDatabaseConfigured()) {
      return new PrismaAccountRepository();
    }
    return new DemoAccountRepository();
  }

  static getTransactionRepository(forceDemo = false): ITransactionRepository {
    if (!forceDemo && this.isDatabaseConfigured()) {
      return new PrismaTransactionRepository();
    }
    return new DemoTransactionRepository();
  }

  static getBudgetRepository(forceDemo = false): IBudgetRepository {
    if (!forceDemo && this.isDatabaseConfigured()) {
      return new PrismaBudgetRepository();
    }
    return new DemoBudgetRepository();
  }

  static getGoalRepository(forceDemo = false): IFinancialGoalRepository {
    if (!forceDemo && this.isDatabaseConfigured()) {
      return new PrismaGoalRepository();
    }
    return new DemoGoalRepository();
  }
}
