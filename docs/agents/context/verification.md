# Verification and troubleshooting

The root [agent instructions](../../../AGENTS.md) list repository checks.
The [CI workflow](../../../.github/workflows/ci.yml) defines what runs on a
push or pull request. Record the results against the commit that will ship.

## Local and hosted checks

| Where | Check |
| --- | --- |
| Local backend | From `backend/`, start `uvicorn app.main:app --reload --port 8000` in the configured virtualenv. Check `http://127.0.0.1:8000/health`. |
| Local frontend | From `frontend/`, run `npm run dev -- --hostname 127.0.0.1` in another terminal. Open `http://127.0.0.1:3000`. |
| Local development logs | If Next.js reports `ECONNREFUSED 127.0.0.1:8000`, check the backend process first. For module errors during hot reload, read the final code and reproduce with a fresh compile. |
| Hosted services | Check the Vercel deployment for the intended commit, then check `/health`, API routing, auth redirects, and the authenticated feature. Record which checks ran and which depend on project access or credentials. |
| Supabase | Match the project URL across both services. Keep local and hosted config in the appropriate environments. Use the [setup guide](../../supabase/setup.md) for callback URLs, migrations, and email configuration. |

## Browser checks for workspace changes

Use an isolated synthetic account or a stubbed local environment. The root
[sample statement](../../../sample-statement-3-months.csv) covers several months
for import and chart checks. Avoid signing in with a user's account or using a
real statement for a screenshot.

- Test the first-use journey from an empty workspace and a populated workspace.
  Check loading, success, a truly empty response, the retry path, and the path
  after a successful write.
- Check desktop and mobile for readable values, usable controls, focus order,
  and horizontal overflow. Enable reduced motion and verify that charts still
  render. Test keyboard access to the monthly figures and workspace sections.
- For Overview, confirm month boundaries, separate currencies, transfers,
  headings and units, and the link to the full ledger. Check network requests
  when switching currencies and revisiting a previously loaded month.
- For an auth change, check normal sign-in, a fresh protected request after
  sign-out, and an open second tab when supported. Confirm that the URL and
  diagnostics contain no credentials.
- For import, preview data before confirmation, then verify persistence and
  deduplication. Test the clean-empty and ambiguous-layout cases separately.
  Scanned formats require the optional OCR runtime described in the README.

Capture screenshots with sample data and list the viewport and browser in the
PR. Report mock, local database, hosted database, and visual verification as
separate evidence. Running lint or a production build cannot confirm an email
was delivered or a hosted runtime is healthy.
