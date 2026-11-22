# Finora Milestone and Decision History

This is a curated, append-only project history for agent handoffs. Git remains
the complete source of commit history. Each entry records what changed, why it
mattered, and what it did **not** complete so future work does not repeat
assumptions from old plans.

## 2026-10-06 to 2026-10-07 — Initial platform foundation

- [de40408](https://github.com/TarunyaProgrammer/FinSOL2/commit/de40408) is the
  initial repository commit. [a74348d](https://github.com/TarunyaProgrammer/FinSOL2/commit/a74348d)
  established the system foundation; [aecbb29](https://github.com/TarunyaProgrammer/FinSOL2/commit/aecbb29)
  added design tokens, UI primitives, app shell, and calendar views.
- [4ef75f2](https://github.com/TarunyaProgrammer/FinSOL2/commit/4ef75f2)
  added the first overview, ledger, budget, goal, ingestion, and pricing
  screens. [172de90](https://github.com/TarunyaProgrammer/FinSOL2/commit/172de90)
  added demo seeding and endpoint tests; [ed21c84](https://github.com/TarunyaProgrammer/FinSOL2/commit/ed21c84)
  connected interactive frontend flows.
- [add07e4](https://github.com/TarunyaProgrammer/FinSOL2/commit/add07e4) and
  [a9a2a34](https://github.com/TarunyaProgrammer/FinSOL2/commit/a9a2a34)
  established behavioural feature extraction, forecasting, and the intelligence
  dashboard.
- Why it mattered: the current prototype is a simplified surface over an
  existing financial platform, not the beginning of the product's codebase.
- Keep in mind: these early commits used the name FinancialCall. The product was
  renamed to Finora later; use Finora in current UX and documentation.

## 2026-10-18 — Finora rebrand and quality gates

- [191b337](https://github.com/TarunyaProgrammer/FinSOL2/commit/191b337)
  renamed the product from FinancialCall to Finora. [7f7d3ed](https://github.com/TarunyaProgrammer/FinSOL2/commit/7f7d3ed)
  added the Finora identity and metadata.
- [eab1a6f](https://github.com/TarunyaProgrammer/FinSOL2/commit/eab1a6f)
  added CI/contribution guardrails; [a34f23c](https://github.com/TarunyaProgrammer/FinSOL2/commit/a34f23c)
  formalized frontend lint and typecheck scripts.
- Why it mattered: gave the repository repeatable baseline checks and scoped
  instructions after the initial feature implementation.
- Keep in mind: these checks do not replace feature tests or prove visual
  behavior.

## 2026-11-02 — Public landing page and offline demo

- [a684120](https://github.com/TarunyaProgrammer/FinSOL2/commit/a684120)
  introduced the interactive landing experience, browser-only demo login, and
  synthetic October 2026 frontend data.
- Why it mattered: let people explore the product without starting the backend
  or connecting a bank.
- Keep in mind: `admin / admin` is only a local navigation gate; it is not
  authentication. Demo data and session changes are not production persistence.

## 2026-11-12 — Budget/goal API updates and palette adoption

- [c7ebb82](https://github.com/TarunyaProgrammer/FinSOL2/commit/c7ebb82)
  added budget/goal update and delete endpoints.
- [7d90d11](https://github.com/TarunyaProgrammer/FinSOL2/commit/7d90d11)
  applied the chocolate, cream, and burnt-orange visual system.
- Why it mattered: improved core product workflows and made visual treatment
  more consistent.
- Keep in mind: backend CRUD support does not mean every prototype screen is
  connected to those endpoints.

## 2026-11-21 — Mock feature prototype

- [c45c128](https://github.com/TarunyaProgrammer/FinSOL2/commit/c45c128)
  replaced the dashboard entry screen with a simple frontend prototype for
  overview, calendar, insights, statement preview, data map, mock access roles,
  and profile settings.
- Why it mattered: made the requested feature areas discussable with synthetic
  data before implementing persistence and security.
- Not completed: real auth/RBAC, real file parsing or upload, database
  persistence, profile updates, billing, and reintegration of the old
  transactions/budgets/goals screens.

## 2026-11-21 — Plans moved to public landing page

- [9f69374](https://github.com/TarunyaProgrammer/FinSOL2/commit/9f69374)
  moved the prototype plan comparison from dashboard navigation to a public
  landing-page section and replaced the dashboard's typed “F” tile with the
  shared `FinoraMark` component.
- Why it mattered: follows the user's explicit information-architecture
  decision that plan comparison is part of the public marketing site.
- Keep in mind: prices and plan features remain illustrative. Checkout and
  server-side entitlements are not implemented.

## 2026-11-21 — Next.js security patch

- [a11f5df](https://github.com/TarunyaProgrammer/FinSOL2/commit/a11f5df)
  upgraded the frontend from Next.js 16.4.0 to 16.4.6, updated the matching
  `eslint-config-next`, and set `experimental.agentUpgrade` to `"security"`.
- Why it mattered: the installed Next.js version was identified as affected by
  a published security advisory.
- Validation: dependency installation, source lint, TypeScript check, and
  production build passed. The full `npm run lint` still scans the untracked
  `frontend/.worktrees/` directory and fails on generated files there.

## 2026-11-21 — Supabase foundation prepared

- Added Supabase SSR email/password auth to the Next.js login flow, a callback
  route, and server-side dashboard protection. FastAPI can validate Supabase
  access tokens and apply per-request Postgres RLS context.
- Added an initial Postgres migration for the current SQLAlchemy entities,
  profile synchronization from `auth.users`, a restricted database role, and
  row-level ownership policies. No insights logic was changed.
- The Supabase project has not been created or migrated yet. Dashboard data is
  still synthetic and is not persisted; project setup steps are in
  `docs/supabase/setup.md`.

## 2026-11-21 — Supabase project configured locally

- The Supabase project was created, Auth site/callback URLs were configured,
  and the project URL plus publishable key were added to ignored local env
  files. No database password, secret key, or service-role key is committed.
- The SQL migration remains unapplied, and FastAPI still points to local SQLite
  until the project's Session pooler connection details are configured.
- Dashboard data remains synthetic and is not persisted.

## 2026-11-21 — Supabase Session pooler configured

- Added the project-provided shared Session pooler host, port, database, and
  username to the ignored local backend configuration. The password remains
  local; the DSN is URL-encoded and uses TLS.
- A read-only connection probe failed at DNS resolution in the current
  execution environment, so live connectivity is still unverified. The checked
  in migration has not been applied to the project.

## 2026-11-21 — Supabase Session pooler verified

- Retried the read-only TLS probe with network access and connected to the
  project's `postgres` database through its shared Session pooler. The local
  backend config now uses Supabase Auth and that pooler URL.
- This only verifies connection parameters and credentials. The schema
  migration has not been applied, so hosted API flows are not ready yet.

## 2026-11-21 — Dashboard visual hierarchy refresh

- Reworked the prototype workspace frame and overview hierarchy around a
  balance focal panel, compact cash-flow summaries, recent activity, and clear
  paths into the existing sections. The visual system keeps the warm Finora
  palette, adds editorial heading typography, improves small-screen spacing,
  and respects reduced-motion preferences.
- The profile now displays the authenticated email and Auth metadata name when
  present. Landing-page CTAs state that sign-in is required and the dashboard
  uses synthetic data.
- Added the `transform-ai-slop-websites` workflow to this repository and linked
  it from `AGENTS.md` for future redesigns.
- Frontend build, source lint, typecheck, and backend tests passed. Live visual
  browser inspection was not performed because the development server was not
  started, consistent with the user's earlier instruction.

## 2026-11-21 — Initial Supabase schema applied

- Applied `20261121220000_initial_finora_schema.sql` through the official
  Supabase CLI against the user-provided Session pooler URL. The CLI recorded
  the migration in Supabase's migration history.
- Verified the ten expected public tables, RLS enabled on all ten, and the
  migration history version. A read-only TLS connection check also succeeded.
- Still pending: create or confirm a Supabase Auth account and verify that the
  `auth.users` trigger creates its matching `public.users` profile row. Dashboard
  financial data remains synthetic and API-backed dashboard persistence is not
  implemented.

## 2026-11-21 — Login privacy and password recovery

- Replaced raw Supabase login/signup errors with neutral, actionable copy. The
  sign-in message points new users to account creation without checking or
  disclosing whether an address exists; password-reset requests use the same
  privacy-preserving response.
- Added a Supabase password-recovery request and reset form, wired through the
  existing auth callback. Added handling for expired links and clarified that
  no bank connection or bank password is requested.
- The sign-in API intentionally does not distinguish an unknown account from a
  wrong password. Do not add an email lookup endpoint or query `auth.users` in
  the browser.
- At this milestone, live signup/confirmation email, reset-email delivery,
  deployed-domain redirects, and financial-data persistence still needed
  verification.

## 2026-11-22 — Accounts API, real budget spend, calendar dates

- Added `/accounts` CRUD (`app/api/v1/accounts.py`, `app/schemas/account.py`).
  New Supabase users had no way to create a bank account, so statement upload
  and bank sync, which both require an owned `account_id`, were unusable for
  them. The API accepts only `account_last4` and stores
  `XXXX-XXXX-<last4>`; request bodies reject unknown fields such as `user_id`
  or a full account number. `adapter_type` is validated against
  `BankAdapterFactory` (new `is_supported` helper) and stored uppercase.
  Deleting an account that has transactions returns 409 unless
  `?delete_transactions=true`.
- Replaced the hardcoded budget figures (every budget reported 14,250 spent and
  750/day). A single helper sums the user's DEBIT transactions within
  `[start_date, end_date]` UTC in SQL and projects burn linearly over the
  remaining days; GET, POST and PATCH `/budgets` all use it. Budgets not yet
  started report zero spend and no projection. Ended budgets never report an
  exhaustion date, even when over the limit (user decision).
  `SpendingForecaster` is intentionally not used because it assumes calendar
  months.
- `GET /calendar/view` now takes an optional `date` query parameter for week
  and day views, and as the fallback for month `year`/`month`. Without it the
  behavior is unchanged. `month` is now validated to 1-12 (previously an
  invalid month caused a server error).
- Backend tests: 52 passing (was 28).
- At this milestone, frontend screens did not yet call `/accounts` or the
  updated budget and calendar endpoints; the statement workflow below later
  reuses `/accounts`. Budget `categories` remain empty; budget "today" (UTC)
  and calendar "today" (server local date) are not yet aligned.

## 2026-11-22 — First authenticated financial data workflow

- Replaced the signed-in synthetic dashboard entry with user-scoped account
  and transaction loading, honest empty states, and a statement preview →
  editable review → explicit confirmation flow. Preview writes no records;
  only confirmed canonical transactions are saved. Re-imports are deduplicated.
- Reused upstream's `/accounts` CRUD rather than adding a second account API.
  Account labels can omit last-four digits; statement-only accounts use the
  `STATEMENT_IMPORT` adapter marker and never collect bank credentials.
- CSV parsing rejects ambiguous amount-only files and malformed transaction
  rows instead of guessing or silently dropping them. PDF/PNG/JPG extraction
  uses optional local PaddleX PP-StructureV3 with file limits and temporary-file
  cleanup. The OCR runtime is not installed or accuracy-tested here; its output
  must remain a user-reviewed draft.
- Updated login/landing copy, README, Supabase setup, and continuity docs to
  explain the empty-first experience, review-before-save boundary, and current
  implementation limits.
- A scoped override pins the affected TypeScript ESLint parser dependency to
  `minimatch@11.0.1` after GitHub reported a moderate advisory on the fork's
  default branch.
- Validation after rebasing: 58 backend tests passed; frontend lint, typecheck,
  and production build passed. Browser visual QA and live Supabase email-flow
  verification were not performed.
- Co-authors: Yash Srivastava and Devansh Chauhan; see the feature branch commit
  for the recorded trailers.

## 2026-11-22 — Vercel Services deployment preparation

- [92c1305](https://github.com/TarunyaProgrammer/FinSOL2/commit/92c1305)
  added root vercel.json to deploy frontend/ (Next.js) and backend/ (FastAPI)
  as one Vercel Services project, routing /api/v1/* and /health to FastAPI and
  other paths to Next.js.
- Changed the frontend API default to same-origin /api/v1, so production
  requests follow the Vercel route table while local Next.js rewrites continue
  to proxy to localhost.
- Reduced statement upload cap from 15 MB to 4 MB to stay below Vercel's
  standard 4.5 MB function request limit, including multipart overhead. The UI
  now rejects oversized files before upload.
- Added a Vercel setup guide covering env vars, Supabase URL allowlisting, and
  deployment limits. The repo does not contain Vercel secrets; dashboard
  values and hosted-flow verification remain pending.
- Vercel Services remain a beta feature; the Python runtime is generally
  available.

## 2026-11-22 — Vercel FastAPI dependency manifest fix

- Vercel runtime logs for `/health` showed the backend could not import
  FastAPI. The existing `backend/pyproject.toml` only contained Ruff settings,
  so the deployed Python environment had no application dependencies.
- Added PEP 621 runtime dependencies to that manifest. A local FastAPI
  `/health` request returns 200; the new Vercel deployment still needs runtime
  verification.
- Keep in mind: the Vercel backend does not install the optional PaddleX OCR
  runtime, so CSV is the only supported statement format in that deployment.

## 2026-11-22 — Sign-up feedback and demo email policy

- The sign-up form previously discarded Supabase's error object and returned a
  generic failure. On success without a session, it switched back to sign-in
  without explaining that email confirmation was still required.
- The form now maps common Auth errors to actionable messages and exposes only
  the provider code/status in browser diagnostics; it never logs the user's
  email, password, token, or raw provider message. Confirmation-required
  responses remain visible instead of silently changing modes. Successful
  immediate sessions land on the workspace with an account-created message.
- The user selected immediate sign-up without confirmation emails for the
  current judge demo. The app and setup docs now expect Supabase Confirm email
  off. Hosted Auth settings and a real sign-up remain pending; email ownership
  is therefore not verified, and password recovery still needs SMTP.
- Keep in mind: Supabase's built-in email sender restricts recipients and is
  rate-limited. Before public launch, configure custom SMTP, re-enable email
  confirmation, and verify both sign-up and recovery flows.

## Mistakes and corrections to carry forward

## 2026-11-22 — Require email verification for signup

- The previous demo decision to disable Supabase email confirmation was
  reversed. Email ownership verification is now a requirement; do not turn off
  **Confirm email** in the hosted project.
- Signup now collects a six-digit OTP on the same entry page, supports a
  confirmation resend and email correction, and enters the workspace only
  after verification. Unconfirmed sign-in attempts route to the code-entry
  state. Auth logs still exclude email, password, OTP, and raw provider text.
- Local Supabase config now enables confirmations and supplies a code-based
  Confirm signup template. Hosted SMTP and the hosted Confirm signup template
  are external setup and must be configured before live user signup can be
  considered verified. Password recovery also needs email delivery.
- The prior “Sign-up feedback and demo email policy” entry records a decision
  that has since been superseded; use this entry and current setup instructions
  as the source of truth.

- **Do not trust the roadmap as a feature inventory.** Some architecture and
  roadmap documents describe XLSX/PDF parsing, stronger ML, and live
  integrations as delivered or planned. Check source and tests first; the
  current upload API is CSV-only and banking remains simulated.
- **Do not mask extension-caused hydration warnings with app changes.** The
  reported trace showed an extension-injected `#definer-bubble-host`; first
  reproduce with browser extensions disabled.
- **Do not put plan selection inside the dashboard.** The user explicitly
  requested public landing-page placement.
- **Do not stage unrelated worktree data.** `frontend/.worktrees/` is currently
  untracked and was deliberately excluded from feature commits.
- **Do not call the prototype's local role changes RBAC.** They are visual
  mock interactions only; authorization must be enforced server-side.

## Updating this history

Append a dated entry after a meaningful feature or architecture milestone. Add
the actual commit/PR link after it exists. State the decision, motivation,
scope, and uncompleted parts. Leave old entries intact; use a correction entry
if an earlier statement becomes inaccurate.
