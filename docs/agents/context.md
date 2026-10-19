# Current project context

## What exists now

Finora is a modular monolith with:

- FastAPI, Pydantic, async SQLAlchemy, and SQLite-compatible local testing in
  `backend/`.
- Next.js 16 App Router, TypeScript, Tailwind, TanStack Query, Recharts, and
  Framer Motion in `frontend/`.
- Canonical transaction normalization, simulated bank adapters, statement
  parsing, budgets, goals, calendar views, and behavioural analytics.
- Twenty-six backend tests covering API endpoints, parsers, adapters, domain
  services, and ML behavior.

## Important boundaries

1. Inputs become canonical transactions before persistence or analytics.
2. Bank integrations are demo/simulated integrations only.
3. Sensitive financial entities must remain scoped to the current user.
4. The backend is a modular monolith; do not introduce speculative services.
5. Architecture documents describe intent, but the source tree is the source
   of truth when they disagree.

## Known gaps

- Frontend lint/typecheck/build checks are being formalized.
- There is no frontend unit or end-to-end test suite yet.
- Several architecture documents describe planned modules that are not present.
- CI, pull-request templates, and contribution guidance are now provided under
  `.github/` and the repository documentation.

## Before changing code

1. Read the root and nearest scoped `AGENTS.md`.
2. Inspect `git status` and preserve unrelated changes.
3. Locate the existing implementation and tests before relying on design docs.
4. Decide whether the change affects security, persistence, API contracts, or
   user-visible behavior.
5. Run the relevant validation commands before handoff.
