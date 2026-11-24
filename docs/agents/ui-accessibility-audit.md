# UI readability and loading audit

Date: 2026-11-24

## Scope and method

Audited the public landing page, sign-in, sign-up, password recovery, and reset
entry routes, plus all eight dashboard sections (Overview, Calendar, Insights,
Transactions, Budgets, Goals, Accounts, and Add a statement) in Fin Theme, True
Dark, and AMOLED Black. The dashboard uses synthetic browser demo data.

Ran axe-core's `color-contrast` rule in the local browser, waited for the
selected theme to be applied before each scan, and re-ran after the fixes. Final
desktop result: **0 contrast violations across 39 route/theme surfaces** (15
public/auth surfaces and 24 dashboard surfaces). A separate 390px mobile pass
checked all eight dashboard sections and the login screen in each theme: **0
contrast violations and no horizontal overflow across all 27 checks**.
Calculation dialogs were opened in each theme; they contain readable
calculation text and had 0 contrast violations after correction.

This is an automated contrast result, not a full WCAG conformance claim. The
audit does not establish keyboard usability of every control, screen-reader
quality, focus order, contrast over all image/video states, or authenticated
behavior. The WCAG AA text thresholds are 4.5:1 for normal text and 3:1 for
large text; inspect axe incomplete results and non-text controls separately.

## Fixes made

- Made Tailwind's `dark:` variant follow Finora's `.dark` theme class, and
  scoped legacy theme overrides to the dashboard so they no longer recolor
  public auth forms or their inputs.
- Corrected low-contrast navigation labels, calendar dates/legend labels,
  inline links, transaction credits, chart colors, public muted text, and
  statement account controls in the surfaces where those colors appear.
- Converted dashboard formula strings from raw TeX source into readable
  descriptions, improved the calculation dialog typography, and fixed its
  theme-dependent contrast.
- Added module preloading on pointer, touch, and keyboard intent for lazy-loaded
  dashboard sections. This can hide section-chunk wait behind navigation
  intent; it does not make remote API requests faster.
- Compact mode controls and theme-matched the mobile section menu after the
  narrow viewport check found header overflow and light menu surfaces with
  light theme text.

## Evidence

Synthetic browser screenshots are saved locally in the ignored directory
`.playwright-cli/contrast-audit/`:

- `overview-fin.png`, `overview-dark.png`, `overview-amoled.png`
- `login-fin.png`, `login-dark.png`, `login-amoled.png`

The repeatable workflow and user journeys are documented in
[the verify-finora skill](../../.agents/skills/verify-finora/SKILL.md).
