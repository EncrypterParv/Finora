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

## Mistakes and corrections to carry forward

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
