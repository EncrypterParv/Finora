---
name: Finora entry experience
description: Warm editorial financial field guide for the public landing and demo login.
colors:
  chocolate: "#4e342e"
  cream: "#f8f4e7"
  burnt-orange: "#cc5500"
  ink: "#2e211e"
  muted: "#6d5d56"
  canvas: "#f8f4e7"
  paper: "#ffffff"
  instrument-paper: "#fdfaf6"
  line: "#f6f0de"
  accent: "#cc5500"
  accent-strong: "#a84600"
  accent-wash: "#faf0e5"
  story-paper: "#f8ecdf"
  target: "#857168"
  error: "#9f2f2d"
  error-wash: "#fdebec"
typography:
  display:
    fontFamily: "Instrument Serif, Georgia, serif"
    fontSize: "clamp(64px, 6.6vw, 96px)"
    fontWeight: 400
    lineHeight: 1.01
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Instrument Serif, Georgia, serif"
    fontSize: "clamp(44px, 4.5vw, 66px)"
    fontWeight: 400
    lineHeight: 1.08
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Helvetica Neue, Arial, sans-serif"
    fontSize: "16px"
    lineHeight: 1.8
  label:
    fontFamily: "Helvetica Neue, Arial, sans-serif"
    fontSize: "12px"
rounded:
  control: "4px"
  button: "5px"
  surface: "8px"
spacing:
  compact: "12px"
  control: "22px"
  panel: "32px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.button}"
    padding: "15px 22px"
  field:
    backgroundColor: "{colors.instrument-paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "13px"
  surface:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.surface}"
---

# Design System: Finora entry experience

## Overview

**Creative North Star: "The Financial Field Guide"**

The built entry experience combines the user-pinned Minimalist UI identity with an Anatomy-inspired cash-flow instrument. Cream paper, editorial serif headings, burnt orange accents, and precise rules explain everyday money to young professionals and students. This is a code-led implementation; no raster composition was approved as visual authority.

This document is scoped to `frontend/src/components/landing`, `/login`, and the new browser demo entry flow. Preserve the existing dashboard visual system as a distinct application surface; the shared angular Finora mark and favicon provide continuity. These entry tokens are not authorization to restyle dashboard screens.

**Key Characteristics:**
- Warm paper and flat, restrained pastel surfaces.
- Editorial serif headings with proportional sans-serif controls and numerical readouts.
- One hero instrument, followed by distinct explanatory graphics and a wealth timeline.
- Explicit sample labels and browser-only demo access.

## Colors

The palette is Chocolate Brown (#4E342E), Cream (#F8F4E7) and Burnt Orange (#CC5500). Chocolate carries ink and primary actions, cream is the canvas, and burnt orange supports emphasis and financial scenarios. Use Accent Strong (#A84600) for burnt-orange text below 18px; pure #CC5500 on cream is 3.9:1 and suits large text, lines and controls only.

### Primary
- **Ink / Chocolate Brown:** Headlines, primary buttons, and key figures.
- **Burnt Orange:** Italic emphasis, scenario controls, focus rings, and projected wealth lines.

### Secondary
- **Target Brown:** The dashed independence-target line, differentiated from the burnt orange growth curve.

### Neutral
- **Warm Canvas:** Public page and login background.
- **Paper:** Feature panels, workbench, and wealth explorer.
- **Instrument Paper:** Machine backing and login fields.
- **Story Paper:** Closing invitation and login story panel.
- **Muted Ink:** Supporting copy and labels.
- **Structural Rule:** Thin panel borders and dividers.

Error ink and error wash identify login recovery messages. Accent wash indicates selected stage controls and calendar cells. Keep synthetic figures visibly identified as examples.

## Typography

Instrument Serif is hosted locally in regular and italic styles. Helvetica Neue with Arial and sans-serif fallbacks supplies controls, body copy, chart labels, and compact metadata. Do not introduce terminal or monospace typography, including for credentials and statement samples.

The frontmatter display and headline roles describe desktop entry headings. The hero becomes a responsive (62–84px) heading on mobile; section headings become (44px). Workbench titles use (31px), feature headings (32px), and supporting prose generally (11–14px). Small instrument metadata is subordinate to the explanation. Financial controls and scenario totals use tabular numerals where implemented; wealth totals retain the editorial serif.

## Layout

The header and hero use a centered maximum width (1440px) with side padding (5%). The desktop hero pairs copy and a single instrument in two columns (1:1.08). Its body copy has a maximum width (365px). The process, features, and wealth sections use a maximum width (1300px), side padding (40px), and generous section separation, commonly (130px).

The four-stage process has a sticky workbench beside the story. IntersectionObserver selects the active stage; explicit stage buttons offer the same progression. At (760px) and below, the desktop sticky panel disappears and each story includes its own relevant workbench graphic. The hero, feature cards, wealth explorer, and login become single-column layouts with percentage gutters. The header hides secondary navigation while retaining demo access. Intermediate adjustments occur at (1100px); the hero expands above (1500px).

## Elevation & Depth

Surfaces are flat. Thin borders, white against warm paper, and restrained tonal changes establish separation without gradients or heavy shadows. Depth belongs to the authored isometric instrument, whose lid and internal assemblies translate independently. Avoid exporting that illustration's dimensional language into ordinary cards or form fields.

## Shapes

Panels use modest corners (8px); primary buttons (5px), fields and small controls (4px). The common mark is an angular F built from chocolate planes with burnt orange facets; the favicon follows the same form. Decorative badges remain squared. Range controls have linear tracks and small rectangular thumbs. Do not introduce circular decorative motifs or pulses; mechanical geometry inside the authored illustration serves its explanation.

## Components

### Buttons and navigation

Primary actions use ink on white lettering, a bordered modest corner, and comfortable vertical padding. Hover changes the background; press scales subtly. Secondary links use understated arrows or underlining. The header has the shared mark, section anchors, and login link; a skip link becomes visible on focus. Retain the global visible focus treatment.

### Instrument

Render the detailed isometric instrument only in the hero. Its lid can be opened or closed, three assembly controls select machine stages, and a daily-spending slider updates a linear readout and a month-end arithmetic projection. It is an explanatory sample, not a bank connection or trained prediction. Later sections use distinct graphics rather than repeating this machine.

### Financial workbench

The four stages use a normalized transaction record, seven-day spending bars, an adjustable month-end spending calculation, and a sample action receipt. Desktop stage selection follows scrolling or explicit buttons. Mobile embeds the relevant graphic directly after each story. Sample transaction dates are October 2026. Preserve the distinction between canonical record normalization, statistical patterns, arithmetic scenarios, and user decisions.

### Wealth explorer

Four labeled range controls adjust monthly contribution, years, assumed annual return, and living expenses. The growing corpus curve is burnt orange with a pale fill; the target is a dashed brown horizontal line. Text outputs state total corpus, contributions, assumed growth, and target timing. The model starts at zero, compounds monthly, and uses end-of-month contributions. The independence target is 25 times annual expenses. Keep the adjacent explanation of excluded inflation, fees, taxes, and volatility, and the explicit illustrative assumption; never present it as a guaranteed withdrawal rule.

### Features and FAQ

Calendar heat cells and a linear goal track illustrate everyday product capabilities. Flat bordered panels contain these graphics. FAQ uses native disclosure elements with a compact plus/minus cue. The closing invitation returns to the demo action.

### Login

The desktop layout pairs an editorial story panel with an operational form; mobile stacks them and removes the secondary sample-position block. Fields have persistent labels, password visibility, visible demo credentials, and inline alert recovery for wrong credentials or unavailable browser storage. `admin / admin` starts a browser-only demo session and routes to `/dashboard`; no backend authentication is performed. Loading text identifies the pending transition. Financial data is synthetic and the session is temporary.

## Do's and Don'ts

### Do:
- **Do** keep to the chocolate, cream and burnt orange palette and the local serif/sans pairing.
- **Do** keep the hero instrument unique and give later sections distinct financial graphics.
- **Do** preserve keyboard-operable native controls, visible focus, and reduced-motion behavior.
- **Do** keep the dashboard's existing visual system distinct beyond the shared mark.
- **Do** label financial data and projections as illustrative and demo access as browser-only.

### Don't:
- **Don't** introduce terminal fonts, decorative pulses, or circular decorative badges.
- **Don't** imply real bank connectivity, production authentication, trained models, or guaranteed financial outcomes.
- **Don't** treat this entry specification as permission to redesign existing dashboard screens.

## Entry refinements

The hero instrument is unboxed and blends into the warm page canvas. It cycles through statement feeding, sorting, and forecasting, with pause/play, direct part selection, offscreen/tab-visibility pausing, and a static reduced-motion alternative. Desktop layouts span the available width with fluid gutters; the sticky header keeps Log in visible.

Typography pairs self-hosted Instrument Serif with DM Sans for all UI, labels and numbers. No terminal fonts are rendered. Reading text is 16–18px, with responsive display sizes and 44px minimum primary controls. Small section and muted dashboard labels were darkened for AA contrast. Automated checks are a scoped validation, not a full accessibility certification.
