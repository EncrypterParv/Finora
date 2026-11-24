# Database Architecture & Schema Design — Finora

## 1. Database Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    USERS ||--o{ BANK_ACCOUNTS : owns
    USERS ||--o{ BUDGETS : defines
    USERS ||--o{ FINANCIAL_GOALS : sets
    USERS ||--o{ ML_PROFILES : tracks
    BANK_ACCOUNTS ||--o{ TRANSACTIONS : records
    CATEGORIES ||--o{ TRANSACTIONS : classifies
    CATEGORIES ||--o{ BUDGET_CATEGORIES : limits
    MERCHANTS ||--o{ TRANSACTIONS : engages
    BUDGETS ||--o{ BUDGET_CATEGORIES : contains
    FINANCIAL_GOALS ||--o{ GOAL_MILESTONES : tracks

    USERS {
        uuid id PK
        string email UK
        string hashed_password
        string full_name
        string currency
        jsonb preferences
        timestamp created_at
        timestamp updated_at
    }

    BANK_ACCOUNTS {
        uuid id PK
        uuid user_id FK
        string institution_name
        string account_number_masked
        string account_type
        numeric current_balance
        string currency
        string adapter_type
        timestamp last_synced_at
        timestamp created_at
        timestamp updated_at
    }

    CATEGORIES {
        uuid id PK
        string name UK
        string slug UK
        string icon
        string color_hex
        boolean is_system
        uuid parent_id FK
    }

    MERCHANTS {
        uuid id PK
        string clean_name UK
        string raw_patterns
        uuid default_category_id FK
        string logo_url
        timestamp created_at
    }

    TRANSACTIONS {
        uuid id PK
        uuid user_id FK
        uuid account_id FK
        uuid category_id FK
        uuid merchant_id FK
        timestamp occurred_at
        numeric amount
        string currency
        string transaction_type
        string raw_description
        numeric balance_before
        numeric balance_after
        string reference_id
        string source
        string dedup_hash UK
        jsonb tax_info
        jsonb metadata
        timestamp created_at
    }

    BUDGETS {
        uuid id PK
        uuid user_id FK
        string name
        string period
        numeric total_limit
        date start_date
        date end_date
        timestamp created_at
    }

    BUDGET_CATEGORIES {
        uuid id PK
        uuid budget_id FK
        uuid category_id FK
        numeric allocated_amount
        numeric alert_threshold_percentage
    }

    FINANCIAL_GOALS {
        uuid id PK
        uuid user_id FK
        string title
        string goal_type
        numeric target_amount
        numeric current_saved
        numeric monthly_contribution
        date target_date
        numeric expected_annual_return_pct
        string status
        timestamp created_at
        timestamp updated_at
    }

    GOAL_MILESTONES {
        uuid id PK
        uuid goal_id FK
        string title
        numeric target_amount
        date target_date
        boolean is_achieved
        timestamp achieved_at
    }

    ML_PROFILES {
        uuid id PK
        uuid user_id FK
        numeric behavioural_score
        numeric impulse_spending_index
        numeric average_monthly_burn
        numeric predicted_savings_rate
        jsonb category_spending_distribution
        jsonb weekend_vs_weekday_ratio
        timestamp last_computed_at
    }
```

---

## 2. Table Specifications & Indexing Strategy

### 2.1 Indexing Optimizations
- **`transactions_user_occurred_at_idx`**: `(user_id, occurred_at DESC)` — Critical for high-speed Financial Calendar date-range scans.
- **`transactions_dedup_hash_idx`**: `(dedup_hash)` `UNIQUE` — Ensures deterministic idempotent bank syncing and multi-file statement imports.
- **`transactions_category_occurred_idx`**: `(category_id, occurred_at)` — Accelerates category-based budget utilization checks.
- **`accounts_user_idx`**: `(user_id)` — Quick retrieval of connected financial instruments.
- **`goals_user_status_idx`**: `(user_id, status)` — Fast computation of long-term financial independence metrics.

---

## 3. Data Integrity & Invariants

1. **Precision**: All financial quantities (`amount`, `balance_before`, `balance_after`, `target_amount`) use `NUMERIC(14, 2)`.
2. **Foreign Key Cascade Integrity**: `CASCADE` on user removal, `RESTRICT` on category and merchant deletion if transactions exist.
3. **Auditability**: `created_at` and `updated_at` timestamps with UTC timezone enforcement.

---

## 4. TypeScript Prisma ORM Layer (Next.js & Vercel)

Finora integrates a serverless-optimized, zero-cost **Prisma ORM** layer in `frontend/prisma/schema.prisma` that directly maps to the Supabase PostgreSQL schema.

### 4.1 ORM Entity Mapping

| PostgreSQL Table | Prisma Model | Key Relations & Notes |
| :--- | :--- | :--- |
| `public.users` | `User` | Maps `auth_user_id` to Supabase Auth UUID. Owns accounts, budgets, goals. |
| `public.categories` | `Category` | Self-referential `parent_id` hierarchy. System and user categories. |
| `public.merchants` | `Merchant` | Clean merchant name with raw pattern array for automated canonical tagging. |
| `public.bank_accounts` | `BankAccount` | Masked accounts (`•••• 4821`), simulated adapters, Decimal precision. |
| `public.transactions` | `Transaction` | Immutable canonical transaction ledger with unique `dedup_hash`. |
| `public.budgets` | `Budget` | Monthly and custom spending thresholds. |
| `public.budget_categories` | `BudgetCategory` | Granular per-category budget ceilings and alert thresholds. |
| `public.financial_goals` | `FinancialGoal` | FIRE planning targets, monthly contributions, and expected returns. |
| `public.goal_milestones` | `GoalMilestone` | Stepped targets tracking progress towards financial independence. |
| `public.ml_profiles` | `MLProfile` | Behavioural score (0-100), burn rate, and impulse spending metrics. |

### 4.2 Data Access Layer (Clean Architecture)

The TypeScript layer implements the **Repository Pattern** and **Dependency Inversion Principle**:
- **Interfaces (`frontend/src/server/repositories/interfaces.ts`)**: `IUserRepository`, `IBankAccountRepository`, `ITransactionRepository`, `IBudgetRepository`, `IFinancialGoalRepository`.
- **Prisma Implementation (`frontend/src/server/repositories/prisma/`)**: Direct database access via `@prisma/client` with pooled connections for Vercel Serverless.
- **Demo Mode Implementation (`frontend/src/server/repositories/demo/`)**: In-memory typed repository wrapping synthetic financial datasets (`demo-data.ts`).
- **Repository Factory (`frontend/src/server/repositories/factory.ts`)**: Dynamically resolves implementations based on `DATABASE_URL` presence, ensuring zero broken builds and seamless local/offline execution.
- **Seeder (`frontend/prisma/seed.ts`)**: Automates loading of synthetic demo records into Supabase PostgreSQL.

