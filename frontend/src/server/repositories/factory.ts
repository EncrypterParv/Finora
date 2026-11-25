import {
  IUserRepository,
  IBankAccountRepository,
  ITransactionRepository,
  IBudgetRepository,
  IFinancialGoalRepository,
} from "./interfaces";
import {
  DemoUserRepository,
  DemoAccountRepository,
  DemoTransactionRepository,
  DemoBudgetRepository,
  DemoGoalRepository,
} from "./demo/demo-repositories";

/**
 * RepositoryFactory
 * Provides the unused synthetic preview repositories. Private records use the
 * shared API client and are authorized by the FastAPI backend.
 */
export class RepositoryFactory {
  static getUserRepository(forceDemo = false): IUserRepository {
    void forceDemo;
    return new DemoUserRepository();
  }

  static getAccountRepository(forceDemo = false): IBankAccountRepository {
    void forceDemo;
    return new DemoAccountRepository();
  }

  static getTransactionRepository(forceDemo = false): ITransactionRepository {
    void forceDemo;
    return new DemoTransactionRepository();
  }

  static getBudgetRepository(forceDemo = false): IBudgetRepository {
    void forceDemo;
    return new DemoBudgetRepository();
  }

  static getGoalRepository(forceDemo = false): IFinancialGoalRepository {
    void forceDemo;
    return new DemoGoalRepository();
  }
}
