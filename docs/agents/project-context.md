# Finora Project Context

Last reviewed: 2026-11-21
Current milestone: Dashboard hierarchy refresh implemented; Supabase migration deployment pending

This is the short continuity brief for coding agents. Read it before planning
substantial work, then read [`history.md`](history.md) for dated decisions and
milestones. It summarizes the project; the source tree and tests remain the
implementation truth.

## Product purpose

Finora helps people understand day-to-day money behavior over time. Its core
idea is to organize canonical transactions around a financial calendar, then
show explainable spending patterns, forecasts, budgets, and goals that help a
person decide what to do next. The intended audience in the product brief is
young professionals and students.

The prototype exists to make these workflows concrete and discussable while
production data persistence, statement ingestion, and entitlements are built.
Supabase Auth and the initial Postgres schema are configured. The hosted
project, local auth config, and FastAPI Session pooler URL are set; the TLS
connection, migration record, ten expected tables, and RLS flags were verified.
The first real signup/email-confirmation flow remains to be checked. The
prototype is not a production financial service.

## Where the project started

This repository was already an implemented modular monolith before the latest
prototype work. It is not a greenfield app. The backend has transaction,
account, budget, goal, calendar, statement, bank-demo, and analytics code. The
frontend had an interactive landing page and an API-backed dashboard with
transactions, budgets, goals, calendar, and insights. See
[`history.md`](history.md) for the commit-linked milestone history.

## Current implementation status

Progress is described by status, not a percentage. There is no agreed,
scoped backlog from which a meaningful completion percentage could be
calculated.

| Area | Current status | What that means |
|---|---|---|
| Landing page | Implemented prototype | Public product explanation and interactive sample walkthrough. A proposed three-tier plans section now lives here. |
| Dashboard prototype | Mock UI; visual hierarchy refreshed | Overview, calendar, insights, statement preview, data map, access roles, and profile screens use synthetic data and local state. The updated overview strengthens hierarchy and account clarity while keeping the mock-data boundary visible. Browser visual QA remains pending because the app server was not started. |
| Plans | Illustrative only | Prices and feature tiers are concepts. No subscription, checkout, or server-side entitlement enforcement exists. |
| Login and RBAC | Supabase Auth configured; first signup check pending, RBAC remains mock-only | Next.js email/password sign-in uses Supabase SSR sessions. FastAPI is configured to validate Supabase access tokens. The prototype's role editor is not authorization. |
| Database | Initial Supabase schema applied and verified | The checked-in migration mirrors current SQLAlchemy entities, creates a profile from `auth.users`, and enables owner-scoped RLS on all ten expected tables. A read-only connection and migration-history check passed. |
| Statement import | Partial | Backend parser and upload endpoint support CSV. The prototype file picker shows generated rows and does not read or send the selected file. XLSX/PDF import is not implemented end to end. |
| Calendar | Existing backend + mock prototype | Existing API/service and prior calendar UI exist. The current prototype calendar uses local sample data. Reconcile backend date-range behavior before connecting them. |
| Insights | Statistical foundation + mock screen | Backend features, forecasts, shifts, anomaly heuristics, and recommendations exist. This is not a trained ML product; several recommendation impacts are fixed illustrative estimates. |
| User profile | Mock UI / partial backend read | User fields and `/auth/me` exist, but the prototype changes are local and there is no profile update flow. |
| Transactions, budgets, goals | Existing code, not in prototype navigation | Earlier feature components and backend APIs remain in the repository, but the simplified prototype dashboard does not link to those screens. Decide how to bring them back into the prototype. |
| Frontend tests | Not present | There is no frontend unit or end-to-end test suite yet. |

## Technical shape and boundaries

- Backend: FastAPI, Pydantic, async SQLAlchemy; keep it a modular monolith.
- Frontend: Next.js 16.4.6 App Router, strict TypeScript, Tailwind, TanStack
  Query, existing components and design tokens. `experimental.agentUpgrade` is
  set to `"security"` following the November 2026 security patch upgrade.
- The backend currently has 28 passing tests. There is no frontend unit or
  end-to-end test suite yet.
- Canonical transactions are the normalization boundary for imported or
  simulated transaction data. Keep analytics and calendar work based on that
  domain shape.
- Bank adapters must remain simulated. Never add real bank credentials or real
  personal financial data to source, fixtures, logs, or documentation.
- Keep user-owned financial records tenant-scoped in every query and mutation.
- Keep prototype interactions visibly mock. Do not describe them as secure,
  persisted, uploaded, purchased, or model-generated when they are not.
- The user selected Supabase Auth and Postgres on 2026-11-21. The project was
  created, the site URL/callback URLs and local public config were set, and the
  backend Session pooler URL is configured in ignored `backend/.env`; the
  initial migration is applied and its tables, RLS flags, and history entry
  were verified. The setup guide is in `docs/supabase/`.
- Next.js uses `@supabase/ssr` cookie sessions and verifies server-side claims.
  FastAPI validates bearer tokens through Supabase Auth, then sets transaction-
  local identity and switches to the restricted `finora_app` role so Postgres
  RLS applies. The browser uses only the project URL and publishable key.
- `frontend/.env.local` and `backend/.env` are ignored local files. Their
  committed templates contain placeholders only; never commit database
  passwords or Supabase secret/service-role keys.

## Known gaps that affect planning

These were verified against source during the 2026-11-21 repository review;
recheck them before implementation because code may have changed since then.

1. With `AUTH_PROVIDER=local`, a missing bearer token still falls back to the
   first seeded user for the old demo API flow. Supabase mode rejects requests
   without a valid token. Do not use local auth mode in a hosted environment.
   The frontend API helper sends the Supabase bearer token when it calls
   FastAPI; the prototype screens currently use mock data instead.
2. The statement endpoint calls the CSV parser and persists rows immediately;
   the prototype preview is generated sample content. Do not claim XLSX/PDF or
   review-before-persist behavior is complete.
3. In local mode, runtime database setup uses `Base.metadata.create_all()` and
   demo seeding. Supabase mode skips both and relies on checked-in migrations.
   The initial migration has been run against Supabase and its history entry,
   ten tables, and ten RLS-enabled table flags were verified.
4. The calendar API's day/week range handling needs review against the selected
   date. The prototype's local calendar navigation does not fix backend logic.
5. Analytics use deterministic/statistical code. The anomaly detector is a
   statistical z-score implementation, not the Isolation Forest described in
   some pricing/architecture copy. Verify claims and fixed recommendation
   estimates before presenting them as personalized findings.
6. Existing roadmap and architecture documents contain planned or overstated
   capabilities. Read the implementation and tests before repeating those
   claims.
7. FastAPI currently checks each Supabase bearer token through the Auth user
   endpoint on each request. This is straightforward verification for the
   prototype but adds network latency; evaluate cached JWKS verification before
   scaling API traffic.

## Product decisions and working preferences

- The user asked for a simple, mock-data-first prototype to start feature work.
- Supabase is now explicitly selected for Auth and Postgres; do not revert this
  decision to SQLite-only or treat the withdrawn earlier prompt as current.
- Plans belong on the public landing page, not in dashboard navigation.
- Use the shared `FinoraMark` brand component rather than a typed initial in
  dashboard chrome. The current repository's canonical mark is F-shaped; no
  separate R mark asset was found.
- Treat sample figures as synthetic. The current data is an October 2026 demo.
- A browser console report showed a hydration mismatch with an injected
  `#definer-bubble-host` node. The trace indicates a browser extension mutation;
  verify with that extension disabled before changing React rendering to hide
  the warning.
- A full frontend lint run may traverse the untracked
  `frontend/.worktrees/next-16.4.6/` directory and report generated bundle
  errors. Do not stage or delete that directory as part of unrelated work.
  Lint changed source files directly while its ownership is unresolved.
- When the user asks how to run the app, give the terminal command and URL.
  They previously asked the agent not to start the dev server on their behalf.

## Agent handoff routine

1. Read root and scoped `AGENTS.md`, this brief, and the relevant history entry.
2. Check `git status` and preserve unrelated/untracked work.
3. Verify implementation in source and tests; treat docs as design intent unless
   checked against code.
4. Make one focused change. Update tests and docs when behavior or architecture
   changes.
5. At a meaningful milestone, update the status table and append a dated entry
   to `history.md` with the commit/PR link, decision, and remaining work. Keep
   entries factual; do not rewrite prior history to make old plans look current.
