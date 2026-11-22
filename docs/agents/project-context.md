# Finora Project Context

Last reviewed: 2026-11-22
Current milestone: The Vercel frontend and FastAPI health route are live; first-user statement import is wired, and hosted Supabase Auth/database workflows remain under verification

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

The public landing page contains illustrative product examples. The signed-in
workspace now loads the user's account and transaction data, starts empty, and
supports statement preview, review, and confirmed import. Supabase Auth and the
initial Postgres schema are configured. The hosted project, local auth config,
and FastAPI Session pooler URL are set; the TLS connection, migration record,
ten expected tables, and RLS flags were verified. Live email flows and OCR
accuracy remain unverified; Finora is not ready for public production use.

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
| Vercel deployment | Frontend and FastAPI deployed; `/health` returns 200 | Root vercel.json routes Next.js and FastAPI under one Vercel Services deployment. Hosted Supabase auth, database persistence, and statement import still need end-to-end checks. Services are beta; the Python runtime is generally available. |
| Landing page | Implemented prototype | Public product explanation and interactive sample walkthrough. A proposed three-tier plans section now lives here. |
| Authenticated workspace | Real account/transaction loading; statement review/import implemented | New users see empty states, add an account label, preview a statement, edit candidate transactions, and explicitly confirm persistence. Browser visual QA remains pending because the app server was not started. |
| Plans | Illustrative only | Prices and feature tiers are concepts. No subscription, checkout, or server-side entitlement enforcement exists. |
| Login and RBAC | Supabase Auth flow wired; hosted sign-up not yet verified; RBAC remains mock-only | Sign-up now reports safe provider codes, keeps email-confirmation-required state visible, and sends successful immediate sessions to the workspace with an account-created message. The judge demo expects Supabase Confirm email off; this does not verify email ownership. Password recovery still requires working email delivery. The role editor is not authorization. |
| Database | Initial Supabase schema applied and verified | The checked-in migration mirrors current SQLAlchemy entities, creates a profile from `auth.users`, and enables owner-scoped RLS on all ten expected tables. A read-only connection and migration-history check passed. |
| Statement import | CSV implemented; optional OCR path unverified | Preview is non-persistent; edited, confirmed rows save as canonical transactions. CSV parsing rejects ambiguous amount-only layouts. Uploads are capped at 4 MB for Vercel Hobby. PDF/PNG/JPG use optional PaddleX OCR, not installed or benchmarked in this workspace; scanned extraction is unavailable on the default Vercel deployment. XLSX is unsupported. |
| Calendar | Backend date handling fixed + mock prototype | `GET /calendar/view` accepts an optional `date` (yyyy-mm-dd): week = Monday-Sunday containing it, day = that date, month uses `year`/`month` falling back to it. Omitting `date` keeps the old today-based behavior. The prototype calendar still uses local sample data. |
| Insights | Statistical foundation + mock screen | Backend features, forecasts, shifts, anomaly heuristics, and recommendations exist. This is not a trained ML product; several recommendation impacts are fixed illustrative estimates. |
| User profile | Mock UI / partial backend read | User fields and `/auth/me` exist, but the prototype changes are local and there is no profile update flow. |
| Bank accounts | User-scoped CRUD and statement onboarding use `/accounts` | Account labels accept optional last four digits, never a full number. The statement flow marks them `STATEMENT_IMPORT`. Deleting an account with transactions returns 409 unless `?delete_transactions=true`. |
| Transactions, budgets, goals | Transactions are data-backed; budgets/goals remain outside the current workspace | The dashboard lists imported transactions. Budget responses use real debit totals and linear burn projections, but budget/category UI is not connected; earlier budget and goal APIs/components remain separate. |
| Frontend tests | Not present | There is no frontend unit or end-to-end test suite yet. |

## Technical shape and boundaries

- Backend: FastAPI, Pydantic, async SQLAlchemy; keep it a modular monolith.
- Frontend: Next.js 16.4.6 App Router, strict TypeScript, Tailwind, TanStack
  Query, existing components and design tokens. `experimental.agentUpgrade` is
  set to `"security"` following the November 2026 security patch upgrade.
- Vercel deployment: the root vercel.json declares the frontend and FastAPI
  backend as Services and routes /api/v1/* to the backend. Dashboard
  environment variables, production-domain Supabase redirects, and hosted
  smoke checks are not configured by the repository file. The backend
  pyproject.toml declares its runtime packages so Vercel installs FastAPI.
- The combined backend suite has 58 passing tests. There is no frontend unit or
  end-to-end test suite yet.
- Canonical transactions are the normalization boundary for imported or
  simulated transaction data. Keep analytics and calendar work based on that
  domain shape.
- Bank adapters must remain simulated. Never add real bank credentials or real
  personal financial data to source, fixtures, logs, or documentation.
- Keep user-owned financial records tenant-scoped in every query and mutation.
- Keep public examples visibly illustrative. Do not describe data as persisted,
  uploaded, purchased, or model-generated when it is not.
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
   FastAPI. Accounts and transactions in the authenticated workspace use these
   APIs; calendar and analytics remain unconnected there.
2. OCR dependencies are optional and absent from the default runtime. Install
   `requirements-ocr.txt` with Python 3.13 and benchmark PDF/PNG/JPG extraction
   on synthetic layouts before enabling scanned imports for real users.
3. In local mode, runtime database setup uses `Base.metadata.create_all()` and
   demo seeding. Supabase mode skips both and relies on checked-in migrations.
   The initial migration has been run against Supabase and its history entry,
   ten tables, and ten RLS-enabled table flags were verified.
4. Calendar day/week views now honor the `date` query parameter (fixed
   2026-11-22). The prototype's local calendar navigation is not yet wired to
   it. Budget burn uses the UTC date as "today", while the calendar endpoint
   uses the server's local date; align these if users in non-UTC timezones see
   off-by-one-day results. Budget category allocations are not computed.
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
8. Vercel Services are beta. `/health` is live, but Auth and database flows
   still need hosted smoke checks. The judge demo must have Supabase Confirm
   email disabled for immediate sign-up; this removes email ownership checks.
   Configure custom SMTP and re-enable confirmation before public use. Uploads
   are limited to 4 MB under the default function-body limit; larger files need
   direct storage, and scanned OCR is not included in the default Vercel runtime.

## Product decisions and working preferences

- The user asked for a simple, mock-data-first prototype to start feature work.
- Supabase is now explicitly selected for Auth and Postgres; do not revert this
  decision to SQLite-only or treat the withdrawn earlier prompt as current.
- A new signed-in user must see an honest empty state. Never populate a private
  workspace with synthetic balances or transactions. Imports must be previewed,
  edited, then explicitly confirmed before persistence.
- Plans belong on the public landing page, not in dashboard navigation.
- Use the shared `FinoraMark` brand component rather than a typed initial in
  dashboard chrome. The current repository's canonical mark is F-shaped; no
  separate R mark asset was found.
- Treat sample figures as synthetic. The current data is an October 2026 demo.
- A browser console report showed a hydration mismatch with an injected
  `#definer-bubble-host` node. The trace indicates a browser extension mutation;
  verify with that extension disabled before changing React rendering to hide
  the warning.
- ESLint ignores the separate `frontend/.worktrees/` checkout. Do not stage or
  delete that unrelated worktree as part of feature changes.
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
