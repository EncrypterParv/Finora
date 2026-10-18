# Finora agent instructions

Finora is a modular-monolith financial behaviour intelligence platform.
The repository contains a FastAPI backend and a Next.js frontend. Read the
nearest scoped `AGENTS.md` before changing code.

## Operating rules

- Inspect `git status` before editing and preserve unrelated user changes.
- Keep simulated bank integrations simulated. Never add real credentials or
  financial data to code, fixtures, logs, issues, or pull requests.
- Preserve tenant isolation for users, accounts, transactions, budgets, and
  goals.
- Treat canonical transactions as the normalized domain boundary for imported
  and bank-provided data.
- Prefer small, focused changes. Update tests and relevant documentation when
  behavior or architecture changes.
- Do not invent missing modules merely because an architecture document lists
  them; verify the current implementation first.

## Required validation

From `backend/`:

```bash
DEBUG=false python -m pytest -q
```

From `frontend/`:

```bash
npm ci
npm run lint
npm run typecheck
npm run build
```

For orientation, read [`docs/agents/context.md`](docs/agents/context.md).
Roles and handoff expectations are in [`docs/agents/roles.md`](docs/agents/roles.md)
and [`docs/agents/workflow.md`](docs/agents/workflow.md).
