# Finora Project Context

Last reviewed: 2026-11-24
Current milestone: The Next.js workspace uses the shared API client for private records, with Supabase Auth and SQLAlchemy-backed FastAPI. Landing page SEO and sharing metadata are active. Contrast checks pass on audited routes.

This is the short continuity brief for coding agents. Read it before planning
substantial work, then read the [context hub](context/README.md) and [history](history.md) for dated decisions and
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
| Landing page | Public product explanation | A stone, graphite, and brass visual system with a statement review photograph, transparent finance photography, and an illustrated footer. The sample instrument and calculator remain interactive, and the three plan tiers are concepts. Authentication and workspace screens share the same palette and fonts. |
| Authenticated workspace | Real account/transaction loading; statement review/import implemented | New users see empty states, add an account label, preview a statement, edit candidate transactions, and explicitly confirm persistence. Hosted end-to-end persistence and import verification are tracked separately from local checks. |
| Plans | Illustrative only | Prices and feature tiers are concepts. No subscription, checkout, or server-side entitlement enforcement exists. |
| Login and RBAC | Supabase Auth signup, login, password recovery, and dashboard protection are implemented; RBAC remains mock-only | Supabase Auth remains the identity and password store. Email confirmation was turned off in the hosted dashboard on 2026-11-23, so new signups should create a session without email delivery. Existing unverified accounts may remain unverified. Auth diagnostics expose safe operation/code/status only. The role editor is not authorization. |
| Database | Initial Supabase schema applied and verified | The checked-in migration mirrors current SQLAlchemy entities, creates a profile from `auth.users`, and enables owner-scoped RLS on all ten expected tables. A read-only connection and migration-history check passed. |
| Statement import | CSV implemented; optional OCR path unverified | Preview is non-persistent; edited, confirmed rows save as canonical transactions. CSV parsing rejects ambiguous amount-only layouts. Uploads are capped at 4 MB for Vercel Hobby. PDF/PNG/JPG use optional PaddleX OCR, not installed or benchmarked in this workspace; scanned extraction is unavailable on the default Vercel deployment. XLSX is unsupported. |
| Calendar | Connected in the workspace | The Calendar screen loads `GET /calendar/view` for month, week and day views. The endpoint accepts an optional `date` (yyyy-mm-dd): week = Monday-Sunday containing it, day = that date, month uses `year`/`month` falling back to it. Omitting `date` keeps the old today-based behavior. |
| Insights | Connected in the workspace; statistics and rules, not a trained model | The Insights screen loads `GET /analytics/overview` and shows: month-to-date spend with the month-end forecast and its 80% range; the rule-based behaviour score, archetype, weekend/discretionary shares, savings rate and top discretionary categories; 30-day vs prior-60-day shifts; recommendation title/evidence/action; and statistical outliers. It requires at least 5 transactions across 7 days. It deliberately hides fields that are placeholders or misleading: `liquid_balance`, `runway_days`, strengths/vulnerabilities, budget risk level/exhaustion date/status summary (these sum all budgets), recommendation `financial_impact_monthly`/`confidence_score`, and the anomaly `reason` text (wording bug). The backend category rules do not recognise ZEPTO or BLINKIT, which fall into General. |
| User profile | Mock UI / partial backend read | User fields and `/auth/me` exist, but the prototype changes are local and there is no profile update flow. |
| Bank accounts | User-scoped CRUD and statement onboarding use `/accounts` | Account labels accept optional last four digits, never a full number. The statement flow marks them `STATEMENT_IMPORT`. Deleting an account with transactions returns 409 unless `?delete_transactions=true`. |
| Transactions, budgets, goals | Connected in the workspace | The dashboard lists imported transactions. `GET /transactions` filters by date range, type, account, amount range, and case-insensitive description search (`q`, wildcards escaped), and returns the pre-pagination match count in `X-Total-Count` (exposed via CORS). `POST /transactions` records manual (e.g. cash) DEBIT/CREDIT entries with `source=MANUAL` and does not change account balances; `DELETE /transactions/{id}` removes one. Category filtering is not available because categories are not stored as rows yet (reviewed names live in transaction metadata), and the detail endpoint's budget/forecast context fields are still placeholders. The Budgets screen uses `/budgets` (real debit totals and linear burn projections; no per-category limits yet) and the Goals screen uses `/goals`. |
| Frontend tests | Not present | There is no frontend unit or end-to-end test suite yet. |
| Overview | Connected in the workspace | The Overview defaults to the latest recorded UTC month. `GET /transactions/summary?month=YYYY-MM-01` returns the current user's daily credits and debits, transaction counts, and debit totals by account, separately for each currency. Transfers count as activity. Weekly cash flow and account spending exclude them. The API uses existing canonical transaction rows and requires no migration. |
| Frontend performance and accessibility | Focused improvements implemented; measurement pending | Successful authenticated API GET responses stay in bounded browser memory for the tab session, scoped by Supabase user ID. Mutations invalidate only dependent data groups and broadcast invalidations to other same-browser tabs. Sign-out clears the cache. Entries are LRU-evicted at 60 records or 5 MB and are never written to storage. Identical concurrent reads are deduplicated. The Overview fetches five recent rows and the API's total count, then requests the cached monthly aggregate for workspaces with records. Feature screens and Overview charts are split into on-demand chunks; section chunks now preload on pointer, touch, or keyboard intent to reduce first-open waiting. The login illustration is loaded eagerly because it is above the fold. Loading skeletons match their layout. The workspace has a skip link, a keyboard-accessible mobile menu, a weekly figures table, and reduced-motion chart behavior. The cache reduces repeated reads from the app. API rate limits and Lighthouse measurement are separate. |
| Search and social sharing | Public landing page is crawlable and shareable | Root metadata sets canonical, Open Graph, and Twitter cards. A branded 1200×630 preview is generated from local fonts. JSON-LD describes the web application without financial performance claims. `/sitemap.xml` lists only `/`; `/robots.txt` excludes auth, dashboard, and API paths. `NEXT_PUBLIC_SITE_URL` sets the canonical origin and defaults to `https://finora-sem3.vercel.app`. |

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
- Backend coverage includes monthly summary isolation and currency separation.
  There is no checked-in frontend unit or end-to-end test suite yet.
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
- Workspace logout uses a same-origin POST to `/auth/sign-out`. It expires this
  browser's session cookies and attempts to revoke that session with Supabase.
  Open workspace tabs follow the logout when BroadcastChannel is available.
- The public landing uses GSAP for the hero and desktop story, Lenis for
  desktop scroll, and Anime.js for the illustrated footer. Mobile and reduced
  motion keep the walkthrough vertical. See [landing-motion.md](landing-motion.md)
  for motion boundaries and review steps.
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
   APIs; Calendar and Insights screens also load their data from the backend.
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
   still need hosted smoke checks. Supabase Confirm email was turned off for
   the current demo. Signup needs no SMTP, but accepts unverified email
   addresses. Password recovery still needs email delivery. Existing
   unverified accounts may need separate handling. Uploads are limited to 4 MB under the default
   function-body limit; larger files need direct storage, and scanned OCR is
   not included in the default Vercel runtime.

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
