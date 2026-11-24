# Frontend agent instructions

- Use the Next.js App Router and keep server/client boundaries explicit.
- Keep reusable primitives in `src/components/ui`; feature components belong
  under their feature directory.
- Keep API access and query behavior in `src/lib` and `src/hooks`, not inside
  presentation components.
- Preserve the existing design tokens, responsive behavior, keyboard access,
  focus states, and loading/empty/error states.
- TypeScript must remain strict. Avoid `any` unless the boundary is documented.
- UI changes should include a screenshot or a clear visual verification note in
  the pull request.

Run the checks with:

```bash
npm run lint
npm run typecheck
npm run build
```

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
