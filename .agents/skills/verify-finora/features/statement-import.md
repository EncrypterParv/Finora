# Statement import and review

## Sub-features

- Select a statement file and view parser feedback.
- Review and edit extracted rows before saving.
- Confirm or cancel an import.

## How to get to it (user POV)

In `/dashboard/demo`, choose Add a statement. The seeded demo has account labels;
choose a synthetic CSV fixture from the repository if you need a reviewable
preview. Keep the original fixture unchanged.

## Driving it with Playwright CLI

Use the file input's accessible name, inspect the review table and validation
messages, edit a row, then cancel or confirm according to the scenario. Capture
the preview and final visible state. For authenticated import verification, also
inspect the API response and resulting owner-scoped transaction list.

## Gotchas

The browser demo may not have OCR installed. PDF and image extraction can be
unavailable there. A preview is temporary and should not be reported as a saved
transaction; only confirmation persists in the authenticated workflow.
