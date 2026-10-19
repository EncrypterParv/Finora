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
