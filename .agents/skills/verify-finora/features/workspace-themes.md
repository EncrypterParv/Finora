# Workspace, themes, and calculations

## Sub-features

- Overview and section navigation.
- Fin Theme, True Dark, and AMOLED Black theme switching.
- Metric calculation dialogs.
- Lazy section loading and preloading on navigation intent.

## How to get to it (user POV)

Open `/dashboard/demo`. Choose a theme from the top-bar theme selector, then
visit Overview and each workspace section. Activate a metric marked as
inspectable to open its calculation dialog.

## Driving it with Playwright CLI

Use the `Workspace sections` navigation landmark and its named section buttons.
Use the top-bar button whose name starts with `Current theme:`. For a metric,
activate its accessible button and confirm the dialog has the heading “How this
is calculated” and human-readable calculation text without raw `\\text`,
`\\sum`, or other TeX source. Capture one screenshot per theme.

## Gotchas

The demo data is generated in the browser and is not persisted. First section
visits may still wait on a chunk if there was no pointer, touch, or keyboard
intent to preload it. Browser module warm-up does not reduce remote API latency.
