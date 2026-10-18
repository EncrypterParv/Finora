# Agent workflow

1. Inspect the worktree and read applicable `AGENTS.md` files.
2. Identify the current implementation, affected boundary, and existing tests.
3. Make the smallest coherent change within that boundary.
4. Add or update regression coverage for changed behavior.
5. Run the required backend/frontend checks and record the results.
6. Update context or architecture documentation when behavior or structure
   changes.
7. Handoff with changed files, validation commands, known risks, and follow-up
   work.

Stop and request direction when a change requires real financial credentials,
destructive data operations, an unowned production integration, or a material
API/data migration not covered by the task.
