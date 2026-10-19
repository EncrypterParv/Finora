# Contributing to Finora

## Before opening a pull request

Run the checks relevant to your change.

Backend:

```bash
cd backend
DEBUG=false python -m pytest -q
```

Frontend:

```bash
cd frontend
npm ci
npm run lint
npm run typecheck
npm run build
```

## Pull requests

- Keep changes focused and describe the user or engineering outcome.
- Include tests or explain why coverage is not practical.
- Include screenshots for visual changes.
- Call out migrations, API contract changes, security/privacy impact, and
  follow-up work.
- Never include secrets, real bank credentials, or real financial data.

Use the pull-request template for the complete checklist.
