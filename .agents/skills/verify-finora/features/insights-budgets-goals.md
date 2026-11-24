# Insights, budgets, and goals

## Sub-features

- Insights charts, forecast summaries, and metric explanations.
- Budget and goal overview states.
- Theme contrast for chart labels, legends, and supporting text.

## How to get to it (user POV)

Open `/dashboard/demo`, then choose Insights, Budgets, or Goals. If sample
records exist, inspect chart details and metric explanations; also verify the
empty or unavailable state when a feature has no eligible data.

## Driving it with Playwright CLI

Navigate through the workspace section buttons. Check each surface in all three
themes at desktop and narrow viewport sizes. Open any formula dialog and confirm
its visible calculation is human-readable. Inspect chart titles, axes, legends,
and key figures without relying on color alone.

## Gotchas

Forecasts and behavior summaries are illustrative and use synthetic data.
Do not treat them as financial advice or as proof of persisted analytics.
