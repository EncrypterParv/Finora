# Architecture and data contracts

Finora is a personal finance application for students and young professionals.
It turns user-reviewed statement records into a practical financial calendar,
an activity overview, budgets, and savings goals. The public site explains
those workflows with labeled examples. The workspace starts empty until a user
records or imports their own data.

## Follow a request through the app

1. Next.js serves the landing page, login, and authenticated dashboard. The
   [dashboard entry point](../../../frontend/src/app/dashboard/page.tsx) checks
   Supabase claims before rendering the workspace.
2. The [workspace shell](../../../frontend/src/components/prototype/PrototypeDashboard.tsx)
   handles section navigation, initial account and transaction reads, and sign-out.
   The [API client](../../../frontend/src/lib/api.ts) attaches the user's
   Supabase bearer token and manages the in-memory response cache.
3. [FastAPI](../../../backend/app/main.py) serves `/api/v1/*`.
   [Auth dependencies](../../../backend/app/api/deps.py) resolve the user,
   and the [database layer](../../../backend/app/core/database.py) applies
   transaction-local identity under the restricted `finora_app` Postgres role.
4. The checked-in [Supabase migration](../../../supabase/migrations/) defines
   the application tables, the profile trigger, and RLS. Keep ORM changes and
   migrations aligned. Local API tests use isolated data and do not need
   hosted Supabase access.

In local development Next.js and FastAPI run separately. The Next.js
[rewrite](../../../frontend/next.config.mjs) sends API traffic to port 8000.
The hosted [Vercel configuration](../../../vercel.json) routes the same public
paths to the FastAPI service.

## Feature map

| Area | Primary entry points |
| --- | --- |
| Public product pages and Plans | [Landing components](../../../frontend/src/components/landing/) and [design tokens](../../../frontend/src/app/globals.css) |
| Login and recovery | [Login](../../../frontend/src/app/login/page.tsx), [callback](../../../frontend/src/app/auth/callback/route.ts), and [reset](../../../frontend/src/app/reset-password/page.tsx) |
| Logout and session cleanup | [Sign-out route](../../../frontend/src/app/auth/sign-out/route.ts) and workspace shell |
| Overview, monthly figures, recent activity | [Workspace Overview](../../../frontend/src/components/prototype/WorkspaceOverview.tsx), [charts](../../../frontend/src/components/prototype/WorkspaceOverviewCharts.tsx), and [transactions API](../../../backend/app/api/v1/transactions.py) |
| Account names, masked numbers, and imports | [Accounts API](../../../backend/app/api/v1/accounts.py), [statement API](../../../backend/app/api/v1/statements.py), and [import domain](../../../backend/app/domain/statement_import/) |
| Canonical ledger and manual entry | [Transaction model](../../../backend/app/db/models/transaction.py), [schemas](../../../backend/app/schemas/canonical_transaction.py), and [transactions API](../../../backend/app/api/v1/transactions.py) |
| Calendar and insights | [Calendar API](../../../backend/app/api/v1/calendar.py) and [analytics API](../../../backend/app/api/v1/analytics.py) |
| Budgets and goals | [Workspace screens](../../../frontend/src/components/prototype/) and [FastAPI routes](../../../backend/app/api/v1/) |

## Data and session contracts

- The authenticated identity determines record ownership. Every query and
  mutation for owned data checks that identity. A user-supplied account ID is a
  filter or reference, so resolve and verify ownership before using it.
- The statement upload preview parses candidate rows and performs no
  persistence. Confirmation accepts edited rows, validates the owned account,
  deduplicates, and stores canonical transactions. Preserve the distinction
  between original source descriptions and reviewed labels.
- Amounts represent absolute values and direction comes from
  `transaction_type`. Summary periods use UTC boundaries. Keep each currency
  independent unless a future feature explicitly introduces exchange rates and
  conversion dates. The Overview counts transfers as activity, while cash
  flow and spending use credits and debits. Cash flow and bank balances are
  separate measures.
- The Overview requests five recent records with the ledger's total count and
  a compact summary of its selected month. The summary belongs to the
  transaction cache group, so ledger writes invalidate it along with relevant
  derived data. Account or chart copy should reflect the same definitions.
- Successful reads may be reused in a bounded per-user browser cache.
  Mutations invalidate affected groups, with same-browser tab notification.
  Sign-out clears local cache and expires cookies through a same-origin POST.
  Revisit protected URLs when verifying the signed-out state.
