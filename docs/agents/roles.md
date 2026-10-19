# Agent roles

These roles describe responsibility and review focus; they are not access
control boundaries.

## Backend/API

Owns FastAPI routes, schemas, domain services, persistence, adapters, and
backend tests. Must validate async behavior, tenant isolation, API contracts,
and migration implications.

## Frontend/UI

Owns Next.js routes, components, hooks, styles, and client data flows. Must
validate types, lint, responsive behavior, accessibility, and loading/error
states.

## Test/QA

Owns regression coverage, fixtures, deterministic test data, CI checks, and
failure diagnosis. Must identify untested behavior rather than merely increase
test count.

## Security/privacy

Reviews authentication, authorization, secrets, financial data handling,
imports, logs, dependencies, and threat-model implications.

## Documentation/architecture

Maintains context, architecture decisions, API behavior, and roadmap accuracy.
Must remove stale claims instead of copying them forward.

## Reviewer/release

Checks scope, backward compatibility, validation evidence, migration safety,
security impact, and release notes before merge.
