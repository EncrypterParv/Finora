# Lessons from past changes

The [milestone history](../history.md) records when these decisions were made.
Use these lessons when reviewing a change with the same failure mode.

| What happened | What to check next time |
| --- | --- |
| Dev-server logs showed missing dashboard exports or CSS during a multi-file edit. | Inspect final imports and exports, then compile or run the current tree from a clean instance. A missing dependency midway through hot reload is different from a reproducible build failure. |
| The landing markup hydrated with attributes inserted by a browser extension. | Compare the actual DOM diff and reproduce in a clean browser. Earlier logs showed injected nodes or attributes. Keep application-owned server and initial client markup deterministic. |
| Local sign-in succeeded but Overview could not load records. | Verify the FastAPI process on port 8000 separately from Next.js. Authentication and application data are separate requests. The browser may still have a valid Supabase session. |
| Provider delivery restrictions blocked signup or reset emails. | Check current Supabase settings and provider logs. The demo currently uses an immediate signup session. Password recovery still depends on working email. Keep confirmation settings a documented product decision. |
| A sign-in form could submit before client hydration. | Keep password forms on POST and keep sign-in disabled until its client handler is ready. Verify a cold navigation and confirm credentials stay out of the URL. |
| Log out appeared to return to sign-in while cookies could leave the session active. | Wait for a successful server response, expire the session cookies, clear browser cache, and verify a second tab and a fresh request to a protected route. |
| Brand examples and real account views were easy to confuse. | Use synthetic examples on public pages. In the workspace, successful zero results get an empty state and an action. A failed read gets a retry and must not display zeroes as facts. |
| Loading the same dashboard data on every tab change produced long waits. | Reuse successful user-scoped GETs. Invalidate the smallest affected groups after mutations. Keep monthly aggregates compact and paginated lists bounded. |
| A demo displayed balance, investment returns, or risk figures with no supporting data. | Use existing canonical records for financial figures. Check definition, date range, and currency before labeling a number. Separate forecasts from observed totals. |
| A long import review forced endless scrolling and made missed rows harder to spot. | Keep the full review accessible through pagination. Preserve edits and selection when moving pages. Only selected, validated rows should be committed. |
| Motion and wide layouts made mobile or assistive navigation harder. | Check small viewports, keyboard focus, text alternatives, and reduced motion. Tie motion to a specific state change. Keep an equivalent path without animation. |
| Fork and upstream branches diverged during repeated updates. | Fetch and compare the intended branches. Keep the fork's deployment branch distinct from upstream. Preserve history and coordinate before rewriting published commits. |
