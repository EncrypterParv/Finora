# Finora agent instructions

Finora helps people understand the money they have recorded and plan budgets
and savings goals. It is a Next.js frontend and a FastAPI modular monolith backed
by Supabase Auth and Postgres. Preserve the boundary between public examples and
private user records.

## Start here

1. Run `git status -sb`. Preserve unrelated changes. Read the nearest scoped
   instructions in [frontend](frontend/AGENTS.md) or [backend](backend/AGENTS.md).
2. Read the [context hub](docs/agents/context/README.md) and follow its links for
   the area you will change. For substantial work, also read the
   [current project status](docs/agents/project-context.md) and
   [milestone history](docs/agents/history.md).
3. Check the current entry point and existing tests before planning changes.
   Roadmaps describe intent. Source, tests, and observed runtime behavior establish
   what is implemented.
4. Read [DESIGN.md](DESIGN.md) and the
   [project redesign workflow](docs/agents/skills/transform-ai-slop-websites/SKILL.md)
   for substantial UI changes. See the [agent workflow](docs/agents/workflow.md)
   and [review responsibilities](docs/agents/roles.md) for handoffs.

## Preserve these contracts

- Use Supabase Auth for identity and passwords. Keep authentication and owner
  authorization on the server. Apply both user-scoped queries and the existing
  database role and RLS policies. A visible role selector grants no access.
- Keep bank adapters simulated. Use synthetic data for fixtures, logs,
  screenshots, and PRs. Keep passwords, bearer tokens, connection strings,
  and service keys in ignored environment files or the deployment environment.
- Normalize imported records to canonical transactions. Preview is temporary.
  Persist only confirmed rows and preserve owner checks and deduplication.
  Keep credits, debits, transfers, and currencies distinct.
- Show first-use and successful empty states without inventing figures. On
  failed reads, give users a calm retry message. Keep forecasts and public plan
  concepts clearly scoped to their actual capabilities.
- Reuse the existing API client and selective cache invalidation. Keep private
  cached data in user-scoped browser memory. Clear it at sign-out. Test changes
  across section navigation and after a write.
- Keep public Plans on the landing page. Match shared visual tokens and
  preserve keyboard access, mobile usability, and reduced-motion behavior.
- Make focused changes. Check the fork and branch before publishing. Report
  code, database migrations, hosted settings, and deployment verification
  according to what was actually completed.

## Validate and leave context

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

See [verification](docs/agents/context/verification.md) for authenticating an
isolated test, checking a feature in the browser, and diagnosing local or
hosted failures. For meaningful changes, update public setup or usage guidance
in [README.md](README.md), current status in
[project-context.md](docs/agents/project-context.md), and append a milestone to
[history.md](docs/agents/history.md). Add durable contracts and recurring
failure modes to the context folder. Keep one source of truth for each fact.
