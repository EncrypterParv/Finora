# Finora context hub

Use this folder to get oriented before making changes. Read the status brief
and milestone history first for broad changes, then open the relevant
contracts and source files.

| Need | Start here |
| --- | --- |
| What Finora is for, what ships today, and what is pending | [Project status](../project-context.md) |
| How the app got here and what decisions changed | [Milestone history](../history.md) |
| Which code owns a feature and the boundaries it preserves | [Architecture and data contracts](architecture.md) |
| How to avoid failures we have already seen | [Lessons from past changes](lessons.md) |
| How to run checks and distinguish local, hosted, and data failures | [Verification and troubleshooting](verification.md) |
| How a new user moves from signup to their first confirmed record | [First-user workflow](../first-user-workflow.md) |
| Palette, typography, responsive composition, and motion | [Design system](../../../DESIGN.md) and [landing motion](../landing-motion.md) |
| Supabase connection, migrations, Auth, and recovery | [Supabase setup](../../supabase/setup.md) |
| Deployment topology | [Deployment docs](../../deployment/) and [Vercel configuration](../../../vercel.json) |

Use this folder for stable implementation knowledge. Keep current status and
external setup in their respective docs. Keep the history append-only and link
known commits. When a doc and the code disagree, verify current behavior and
correct the doc at the same source of truth.
