---
name: verify-finora
description: Launch Finora locally, drive its public and demo UI with Playwright CLI, audit all three themes, and preserve synthetic-data evidence.
---

# Verify Finora

## Launch

From the repository root, start the frontend on the loopback interface:

```bash
cd frontend
npm ci
npm run dev -- --hostname 127.0.0.1
```

Wait for `http://127.0.0.1:3000` to return the Finora page. The public pages and
`/dashboard/demo` can be exercised without starting FastAPI or configuring
Supabase. The demo shell supplies synthetic browser-side records. It does not
prove authenticated persistence, API authorization, or database behavior.

For authenticated work, use `Context-Manager/development.md` and the Supabase
setup guide. Use a dedicated test account and synthetic records. Never paste
environment values into output, screenshots, or this skill.

## Doctor

Run these read-only checks from the repository root:

```bash
curl --fail --silent --show-error http://127.0.0.1:3000/ | head -c 200
curl --fail --silent --show-error http://127.0.0.1:3000/dashboard/demo | head -c 200
```

The first response should contain the Finora document shell; the second should
serve the dashboard route. If the second redirects or fails, inspect the Next
server log before driving it. Do not print `.env.local` or `.env` values.

## Drive

Use the `playwright-cli` skill available at `.agents/skills/playwright-cli/`.
Start with `/dashboard/demo`; prefer accessible names and roles:

- Workspace navigation: `getByRole('navigation', { name: 'Workspace sections' })`
- Sections: buttons named `Overview`, `Calendar`, `Insights`, `Transactions`,
  `Budgets`, `Goals`, `Accounts`, or `Add a statement`
- Theme selector: button whose name starts with `Current theme:`; cycle through
  Fin Theme, True Dark, and AMOLED Black
- Calculation dialogs: activate a metric card and confirm the dialog explains
  the calculation in readable text without raw TeX commands

Public journeys include `/`, `/login`, `/login?mode=sign-up`,
`/login?mode=recover`, and `/reset-password`. The protected authenticated path
requires the configured Supabase test account; do not substitute the demo shell
for an auth proof.

For a contrast audit, load the `axe-core` bundled with the installed Next lint
stack into the page and run its `color-contrast` rule. The repository currently
resolves it at `frontend/node_modules/axe-core/axe.min.js`. Count violations by
unique node and route. WCAG 2.2 AA requires 4.5:1 for normal text and 3:1 for
large text. Inspect gradients, images, disabled states, and Axe's incomplete
results manually; a zero automated count does not prove full WCAG conformance.

## Evidence

Save browser screenshots and audit outputs under
`.playwright-cli/contrast-audit/`. Use only the synthetic demo. Capture the
selected theme and visible section in each screenshot, and keep the audit output
with the screenshot set. The directory is ignored by Git so local evidence can
remain without adding screenshots to product source. The durable audit summary
is `docs/agents/ui-accessibility-audit.md`.

For a behavior proof, record the user action and resulting UI state. For a data
write, also inspect the visible network response and resulting record state; the
demo's local state is not proof of server persistence.

## Cleanup

Stop only the Next server and browser session started for this verification.
Do not remove `.playwright-cli/contrast-audit/`; it contains the evidence. Do
not clear the user's normal browser profile, local data, or credentials.

## Feature map

See [`features/README.md`](features/README.md) for the user journeys and
preconditions.
