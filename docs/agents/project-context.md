# Finora Project Context

Last reviewed: 2026-11-21
Current milestone: mock product prototype, built on the existing Finora platform

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

The prototype exists to make these workflows concrete and discussable before
we invest in production authentication, persistence, statement ingestion, and
entitlements. The current prototype is not a production financial service.

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
| Dashboard prototype | Mock UI | Overview, calendar, insights, statement preview, data map, access roles, and profile screens use synthetic data and local state. |
| Plans | Illustrative only | Prices and feature tiers are concepts. No subscription, checkout, or server-side entitlement enforcement exists. |
| Login and RBAC | Demo only / backend incomplete | Frontend `admin / admin` login sets a browser session flag. It is not real authentication. Role changes in the prototype do not authorize requests. |
| Database | Partial foundation | SQLAlchemy models exist. Local runtime defaults to SQLite, creates tables at startup, and seeds a synthetic profile. No checked-in migration history or Supabase setup exists. |
| Statement import | Partial | Backend parser and upload endpoint support CSV. The prototype file picker shows generated rows and does not read or send the selected file. XLSX/PDF import is not implemented end to end. |
| Calendar | Existing backend + mock prototype | Existing API/service and prior calendar UI exist. The current prototype calendar uses local sample data. Reconcile backend date-range behavior before connecting them. |
| Insights | Statistical foundation + mock screen | Backend features, forecasts, shifts, anomaly heuristics, and recommendations exist. This is not a trained ML product; several recommendation impacts are fixed illustrative estimates. |
| User profile | Mock UI / partial backend read | User fields and `/auth/me` exist, but the prototype changes are local and there is no profile update flow. |
| Transactions, budgets, goals | Existing code, not in prototype navigation | Earlier feature components and backend APIs remain in the repository, but the simplified prototype dashboard does not link to those screens. Decide how to bring them back into the prototype. |
| Frontend tests | Not present | There is no frontend unit or end-to-end test suite yet. |

## Technical shape and boundaries

- Backend: FastAPI, Pydantic, async SQLAlchemy; keep it a modular monolith.
- Frontend: Next.js App Router, strict TypeScript, Tailwind, TanStack Query,
  existing components and design tokens.
- At the last repository inventory, the backend had 26 tests. Recheck the
  current suite before relying on that count; there is no frontend test suite.
- Canonical transactions are the normalization boundary for imported or
  simulated transaction data. Keep analytics and calendar work based on that
  domain shape.
- Bank adapters must remain simulated. Never add real bank credentials or real
  personal financial data to source, fixtures, logs, or documentation.
- Keep user-owned financial records tenant-scoped in every query and mutation.
- Keep prototype interactions visibly mock. Do not describe them as secure,
  persisted, uploaded, purchased, or model-generated when they are not.
- No backend provider has been selected in this context. The user explicitly
  withdrew a Supabase-related prompt as belonging to another task; do not treat
  Supabase as an approved decision without asking again.

## Known gaps that affect planning

These were verified against source during the 2026-11-20 repository review;
recheck them before implementation because code may have changed since then.

1. `backend/app/api/deps.py` lets a missing bearer token fall back to the first
   database user. This must be removed before treating backend auth as secure.
   Frontend API requests also do not implement a real authenticated session.
2. The statement endpoint calls the CSV parser and persists rows immediately;
   the prototype preview is generated sample content. Do not claim XLSX/PDF or
   review-before-persist behavior is complete.
3. Runtime database setup uses `Base.metadata.create_all()` and demo seeding.
   PostgreSQL configuration exists, but there is no production migration path
   or connected Supabase project in the repo.
4. The calendar API's day/week range handling needs review against the selected
   date. The prototype's local calendar navigation does not fix backend logic.
5. Analytics use deterministic/statistical code. The anomaly detector is a
   statistical z-score implementation, not the Isolation Forest described in
   some pricing/architecture copy. Verify claims and fixed recommendation
   estimates before presenting them as personalized findings.
6. Existing roadmap and architecture documents contain planned or overstated
   capabilities. Read the implementation and tests before repeating those
   claims.

## Product decisions and working preferences

- The user asked for a simple, mock-data-first prototype to start feature work.
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
