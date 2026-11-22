-- Finora's first hosted Postgres schema. Auth identities live in auth.users;
-- public.users is the application profile row and uses the Auth UUID as its ID.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'finora_app') THEN
    CREATE ROLE finora_app NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
END
$$;

GRANT finora_app TO postgres;
GRANT USAGE ON SCHEMA public TO finora_app;
GRANT USAGE ON SCHEMA auth TO finora_app;
GRANT EXECUTE ON FUNCTION auth.uid() TO finora_app;

CREATE TABLE public.users (
  id varchar(36) PRIMARY KEY,
  auth_user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email varchar(255) NOT NULL UNIQUE,
  hashed_password varchar(255),
  full_name varchar(255) NOT NULL DEFAULT '',
  currency varchar(10) NOT NULL DEFAULT 'INR',
  preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.categories (
  id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name varchar(100) NOT NULL UNIQUE,
  slug varchar(100) NOT NULL UNIQUE,
  icon varchar(50) NOT NULL DEFAULT 'Tag',
  color_hex varchar(20) NOT NULL DEFAULT '#6366F1',
  is_system boolean NOT NULL DEFAULT true,
  parent_id varchar(36) REFERENCES public.categories(id) ON DELETE SET NULL
);

CREATE TABLE public.merchants (
  id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  clean_name varchar(150) NOT NULL UNIQUE,
  raw_patterns jsonb NOT NULL DEFAULT '[]'::jsonb,
  default_category_id varchar(36) REFERENCES public.categories(id) ON DELETE SET NULL,
  logo_url varchar(255),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.bank_accounts (
  id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id varchar(36) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  institution_name varchar(100) NOT NULL,
  account_number_masked varchar(50) NOT NULL,
  account_type varchar(50) NOT NULL DEFAULT 'SAVINGS',
  current_balance numeric(14, 2) NOT NULL DEFAULT 0,
  currency varchar(10) NOT NULL DEFAULT 'INR',
  adapter_type varchar(50) NOT NULL DEFAULT 'HSBC_DEMO',
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_bank_accounts_id_user UNIQUE (id, user_id)
);

CREATE TABLE public.transactions (
  id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id varchar(36) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  account_id varchar(36) NOT NULL,
  category_id varchar(36) REFERENCES public.categories(id) ON DELETE SET NULL,
  merchant_id varchar(36) REFERENCES public.merchants(id) ON DELETE SET NULL,
  occurred_at timestamptz NOT NULL,
  amount numeric(14, 2) NOT NULL CHECK (amount >= 0),
  currency varchar(10) NOT NULL DEFAULT 'INR',
  transaction_type varchar(20) NOT NULL DEFAULT 'DEBIT'
    CHECK (transaction_type IN ('DEBIT', 'CREDIT', 'TRANSFER')),
  raw_description varchar(500) NOT NULL,
  balance_before numeric(14, 2),
  balance_after numeric(14, 2),
  reference_id varchar(100) NOT NULL,
  source varchar(50) NOT NULL DEFAULT 'BANK_API'
    CHECK (source IN ('BANK_API', 'CSV', 'XLSX', 'PDF', 'MANUAL')),
  dedup_hash varchar(64) NOT NULL UNIQUE,
  tax_info jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_transactions_account_owner
    FOREIGN KEY (account_id, user_id)
    REFERENCES public.bank_accounts(id, user_id) ON DELETE CASCADE
);

CREATE TABLE public.budgets (
  id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id varchar(36) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name varchar(100) NOT NULL,
  period varchar(20) NOT NULL DEFAULT 'MONTHLY' CHECK (period IN ('MONTHLY', 'CUSTOM')),
  total_limit numeric(14, 2) NOT NULL CHECK (total_limit >= 0),
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ck_budgets_date_range CHECK (end_date >= start_date)
);

CREATE TABLE public.budget_categories (
  id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  budget_id varchar(36) NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  category_id varchar(36) NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  allocated_amount numeric(14, 2) NOT NULL CHECK (allocated_amount >= 0),
  alert_threshold_percentage numeric(5, 2) NOT NULL DEFAULT 80.0
    CHECK (alert_threshold_percentage BETWEEN 0 AND 100),
  CONSTRAINT uq_budget_categories_budget_category UNIQUE (budget_id, category_id)
);

CREATE TABLE public.financial_goals (
  id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id varchar(36) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title varchar(150) NOT NULL,
  goal_type varchar(50) NOT NULL DEFAULT 'EMERGENCY_FUND',
  target_amount numeric(14, 2) NOT NULL CHECK (target_amount >= 0),
  current_saved numeric(14, 2) NOT NULL DEFAULT 0 CHECK (current_saved >= 0),
  monthly_contribution numeric(14, 2) NOT NULL DEFAULT 0 CHECK (monthly_contribution >= 0),
  target_date date NOT NULL,
  expected_annual_return_pct numeric(5, 2) NOT NULL DEFAULT 8.00,
  status varchar(20) NOT NULL DEFAULT 'IN_PROGRESS'
    CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'PAUSED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.goal_milestones (
  id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  goal_id varchar(36) NOT NULL REFERENCES public.financial_goals(id) ON DELETE CASCADE,
  title varchar(150) NOT NULL,
  target_amount numeric(14, 2) NOT NULL CHECK (target_amount >= 0),
  target_date date NOT NULL,
  is_achieved boolean NOT NULL DEFAULT false,
  achieved_at timestamptz
);

-- Retained to match the existing persistence model; no insights or ML logic is
-- changed by this migration.
CREATE TABLE public.ml_profiles (
  id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id varchar(36) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  behavioural_score numeric(5, 2) NOT NULL DEFAULT 75.0,
  impulse_spending_index numeric(5, 4) NOT NULL DEFAULT 0.20,
  average_monthly_burn numeric(14, 2) NOT NULL DEFAULT 0,
  predicted_savings_rate numeric(5, 2) NOT NULL DEFAULT 20.0,
  category_spending_distribution jsonb NOT NULL DEFAULT '{}'::jsonb,
  weekend_vs_weekday_ratio jsonb NOT NULL DEFAULT '{}'::jsonb,
  feature_weights jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_computed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ix_bank_accounts_user_id ON public.bank_accounts(user_id);
CREATE INDEX ix_transactions_user_id ON public.transactions(user_id);
CREATE INDEX ix_transactions_account_id ON public.transactions(account_id);
CREATE INDEX ix_transactions_category_id ON public.transactions(category_id);
CREATE INDEX ix_transactions_merchant_id ON public.transactions(merchant_id);
CREATE INDEX ix_transactions_occurred_at ON public.transactions(occurred_at DESC);
CREATE INDEX ix_transactions_user_occurred_at ON public.transactions(user_id, occurred_at DESC);
CREATE INDEX ix_budgets_user_id ON public.budgets(user_id);
CREATE INDEX ix_budget_categories_budget_id ON public.budget_categories(budget_id);
CREATE INDEX ix_budget_categories_category_id ON public.budget_categories(category_id);
CREATE INDEX ix_financial_goals_user_id ON public.financial_goals(user_id);
CREATE INDEX ix_goal_milestones_goal_id ON public.goal_milestones(goal_id);
CREATE INDEX ix_ml_profiles_user_id ON public.ml_profiles(user_id);

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, auth_user_id, email, full_name, currency, preferences)
  VALUES (
    NEW.id::text,
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'currency', 'INR'),
    jsonb_build_object('theme', 'system', 'calendar_view', 'month')
  )
  ON CONFLICT (auth_user_id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = CASE WHEN public.users.full_name = '' THEN EXCLUDED.full_name ELSE public.users.full_name END,
        updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;
CREATE POLICY users_read_own ON public.users
  FOR SELECT TO finora_app USING (auth_user_id = auth.uid());

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'bank_accounts', 'transactions', 'budgets', 'financial_goals', 'ml_profiles'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', table_name);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO finora_app USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text)',
      table_name || '_owner_access', table_name
    );
  END LOOP;
END
$$;

ALTER TABLE public.budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_categories FORCE ROW LEVEL SECURITY;
CREATE POLICY budget_categories_owner_access ON public.budget_categories
  FOR ALL TO finora_app
  USING (EXISTS (
    SELECT 1 FROM public.budgets b
    WHERE b.id = budget_id AND b.user_id = auth.uid()::text
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.budgets b
    WHERE b.id = budget_id AND b.user_id = auth.uid()::text
  ));

ALTER TABLE public.goal_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_milestones FORCE ROW LEVEL SECURITY;
CREATE POLICY goal_milestones_owner_access ON public.goal_milestones
  FOR ALL TO finora_app
  USING (EXISTS (
    SELECT 1 FROM public.financial_goals g
    WHERE g.id = goal_id AND g.user_id = auth.uid()::text
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.financial_goals g
    WHERE g.id = goal_id AND g.user_id = auth.uid()::text
  ));

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories FORCE ROW LEVEL SECURITY;
CREATE POLICY categories_authenticated_read ON public.categories
  FOR SELECT TO finora_app USING (auth.uid() IS NOT NULL);

ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants FORCE ROW LEVEL SECURITY;
CREATE POLICY merchants_authenticated_read ON public.merchants
  FOR SELECT TO finora_app USING (auth.uid() IS NOT NULL);

GRANT SELECT ON public.users TO finora_app;
GRANT SELECT ON public.categories, public.merchants TO finora_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.bank_accounts, public.transactions, public.budgets,
  public.budget_categories, public.financial_goals, public.goal_milestones,
  public.ml_profiles
TO finora_app;
