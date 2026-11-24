# Transactions and calendar

## Sub-features

- Browse recent and period transactions.
- Search, filter, and inspect transaction details.
- Browse the calendar and distinguish future days from recorded activity.

## How to get to it (user POV)

Open the demo workspace and choose Transactions or Calendar in the workspace
navigation. Change a filter or search term, then open a transaction when one is
available. In Calendar, change the displayed month using its previous/next
controls.

## Driving it with Playwright CLI

Use accessible navigation names, labels, and buttons. Verify that filtered
transactions update, the empty state explains how to broaden the search, and a
selected transaction exposes its details. On Calendar, confirm totals and dates
remain readable in all themes and that future dates are visually distinct.

## Gotchas

Demo transactions are synthetic. A successful filter proves only the browser
view. Currency conversion, ledger persistence, and owner isolation require
separate API-level verification.
