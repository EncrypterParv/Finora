# Agent Context Index

Use this index to pick up work without assuming old design documents match the
current implementation.

## Read in this order

1. Root and nearest scoped `AGENTS.md` for operating rules.
2. [`project-context.md`](project-context.md) for product purpose, architecture,
   current implementation status, confirmed decisions, and verified gaps.
3. [`history.md`](history.md) for commit-linked milestones and mistakes to avoid.
4. Relevant source code and tests to confirm the current behavior.
5. Product and architecture documents for intended direction, checking their
   claims against source before relying on them.
6. [`../supabase/setup.md`](../supabase/setup.md) before changing Supabase
   configuration, migrations, Auth, or database access.
7. [`skills/transform-ai-slop-websites/SKILL.md`](skills/transform-ai-slop-websites/SKILL.md)
   before a substantial redesign of an existing website.

## Important boundaries

- Keep Finora a modular monolith unless the user approves a specific reason to
  change that architecture.
- Keep bank integrations simulated and financial examples synthetic.
- Normalize imported or simulated inputs to canonical transactions before
  persistence or analytics.
- Scope sensitive records and operations to the current authenticated user.
- Update the continuity brief and append to the history after meaningful
  project milestones; never rewrite old entries to make an abandoned plan look
  completed.
