---
name: Finora
description: Stone, graphite, and brass for a personal finance workspace.
colors:
  stone: "#f5f4f0"
  paper: "#ffffff"
  graphite: "#20211f"
  muted: "#575953"
  rule: "#d5d4cc"
  brass: "#755727"
  brass-light: "#d7ba82"
typography:
  display:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "clamp(4rem, 7.5vw, 8.5rem)"
    fontWeight: 400
    lineHeight: 0.93
    letterSpacing: "-0.038em"
  body:
    fontFamily: "DM Sans, Arial, sans-serif"
    fontSize: "1rem"
    lineHeight: 1.6
rounded:
  control: "4px"
  panel: "12px"
components:
  button-primary:
    backgroundColor: "{colors.graphite}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
---

# Finora visual system

Finora is a personal finance workspace for reviewing statements, spotting spending
patterns, and planning budgets and goals. The visual direction uses cool stone,
graphite, and brushed brass. The typography pairs Newsreader for display and DM
Sans for controls, tables, and long text. Both are served locally.

## Palette and hierarchy

| Role | Color |
| --- | --- |
| Stone canvas | `#f5f4f0` |
| Paper surface | `#ffffff` |
| Graphite ink and dark surfaces | `#20211f` |
| Secondary text | `#575953` |
| Strong rule | `#d5d4cc` |
| Brass on stone | `#755727` |
| Brass on graphite | `#d7ba82` |

Keep green for positive indicators and red for errors and destructive actions.
Use numerals and words to communicate those states as well. The F mark uses a
graphite face on stone and a stone face on graphite with the same brass facets.

## Public site

Set the opening headline in light Newsreader with a second line in brass italic.
Place the navigation, headline, explanation, and workspace link over the same
viewport sized photograph of someone reviewing a bank statement. Darken the image behind the text and fade its
bottom into the stone canvas. The sticky navigation gets a solid graphite
surface when the page scrolls. Mobile uses a portrait WebP crop.

The statement, calendar, and savings photos are decorative alpha PNGs beside the
corresponding explanations and usable product examples. The statement example,
calendar, savings track, and wealth calculator use clearly labeled illustrative
values. Keep plan concepts and the FAQ in HTML. The existing cash flow instrument
opens on request further down the page. Keep its keyboard controls and reduced
motion support.

## Authentication and workspace

Use a graphite story panel on login and reset, with a light form panel. Place the
back link in the form's normal flow so headings and errors can grow. On small
screens stack the panels and keep task controls near the top.

The workspace uses a graphite desktop sidebar and a plain stone canvas. Use
white surfaces and clear rules for transactions, budgets, goals, imports, and
calendar. The statement cutout accompanies first use. Keep decorative artwork
out of record lists and charts so the data remains the focal point. Preserve
loading, empty, retry, validation, and success states.

## Motion and closing illustration

The hero zoom and the desktop story rail follow scroll position. The two
columns stay together while the right-hand story moves between steps. Use the
vertical layout at small widths, in short windows, or with reduced motion.
The closing panel puts links and the workspace action above an original
transparent illustration. Its rounded graphite surface opens onto a stone
footer with a native link back to the top.

## Image provenance

These assets were generated for Finora with the built-in ImageGen tool on
2026-11-23. The three photo cutouts have an alpha channel and depict no actual
financial records. The hero has two optimized WebP sizes. Source prompts
follow.

#### finora-footer-people.png

Create an ORIGINAL, premium editorial footer illustration for Finora, an Indian personal finance app. VERY WIDE horizontal composition about 3:1. Actual transparent PNG with alpha, no setting or backdrop, no solid rectangle or checkerboard. A group of seven distinctly designed Indian people of diverse ages and regional backgrounds, arranged naturally shoulder-to-shoulder in a gently rising and falling row, mid torso up, their clothing and silhouettes overlapping in a unified scene. In left-to-right loose groups: a young woman in a collared shirt with short wavy hair and a compact notebook; a middle-aged dad in a knit polo; a grandmother in a draped sari with silver hair; a young adult man with plain dark turban and understated shirt; a woman in work blazer talking cheerfully with an older man in a shawl who holds reading spectacles; a young man in a loose jacket with a phone lowered at his side. Candid gazes turned slightly toward each other, composed and natural, individual faces. Sophisticated hand drawn lithographic print with thin warm ivory and champagne brass lines, graphite ink shadows and fine cross hatching, soft parchment skin colors, small muted gold detailing on clothing. Designed to look luminous on a #20211f charcoal page. Full heads inside frame, straight aligned bottom edge suitable to sit at a footer baseline. NOT cartoon caricature or stock 3D, no text, letters, logos, money symbols, border, purple, background, floor, stand, shadows outside the cutout. Entire group visible with slight air at the left and right edges.

#### statement-review-hero.webp and statement-review-hero-mobile.webp

Photorealistic cinematic editorial photograph for the full-bleed 16:9 homepage hero of Finora, a personal finance website for young adults in India. An everyday real moment reviewing spending at home. Shot at a low, slightly elevated three-quarter angle over a dark matte charcoal-walnut writing desk. On the RIGHT half only, two natural medium-brown adult hands, one lightly holding a simple cream printed bank statement with understated rows and columns of abstract unreadable, defocused marks, the other using a pencil to review one row. In the same cluster behind the paper, an open matte graphite laptop at a three-quarter angle, soft focus screen with simple credible ledger-like lines and a small restrained graph, no readable text, no brand, no glowing neon; an understated notebook beside it. Keep the bank statement and illuminated hands central in this right-hand picture area and between 52% and 85% horizontally so a portrait crop retains the meaningful image. Left 48% is quiet continuous dark graphite background with very subdued soft material detail and no objects for real HTML copy; upper edge dark to support white navigation. Directional warm late afternoon light from the upper right grazes the sheet and hands; crisp highlights on the cream paper, natural shadows and hands, soft restrained dark grey, near-black, warm ivory and muted amber palette. Premium candid magazine photography, honest lived-in feel. No marble, stone, floor, tiles, architecture, desk showroom, charts floating above the desk, glamour styling, stacks of cash, legible financial data, logos, letters, typography overlays, generated UI needles, or people posing. Full bleed landscape, realistic contact shadows, no graphic border.

#### statement-still-life.png

An overhead three-quarter product photograph of two slightly overlapping matte ivory bank statement slips and a polished charcoal metal paper clip, one paper gently curled, with a few very pale gray horizontal printed rules and tiny abstract dark rectangles only. No readable glyphs, no figures, no actual account information, no brands. The arrangement is approximately square, whole object inside the frame, elegant asymmetry, soft light from upper left. Single standalone isolated cutout for Finora's stone charcoal and muted gold finance website. Actual fully transparent PNG background with alpha, no floor, no background panel, no backdrop, no halo and no baked checkerboard. All parts within the central 80 percent with clear margin all around. Tangible premium studio product photography, not vector or illustration.

#### calendar-still-life.png

A realistic editorial still life of a small blackened-steel perpetual desk calendar frame with an ivory card showing a simple grid of subtle punched dots, beside three brushed silver coins resting against its lower edge. No printed numbers, lettering or brand. Slight three-quarter view with confident geometry and tactile surfaces. Whole object inside the frame, soft light from upper left, restrained modern financial editorial. Single standalone isolated cutout for Finora's stone charcoal and muted gold finance website. Actual fully transparent PNG background with alpha, no floor, no background panel, no backdrop, no halo and no baked checkerboard. All parts within the central 80 percent with clear margin all around. Tangible premium studio product photography, not vector or illustration.

#### savings-still-life.png

A realistic close-up studio product photograph of an arrangement of five small stacks of thin, finely milled brushed champagne-gold and cool silver coins, arranged along a shallow diagonal on a single slim rectangular piece of honed charcoal slate. Plain faces with concentric engraving and no denomination, symbols, lettering, or brand. The arrangement is centered, whole object inside the frame, soft light from upper left, elegant and restrained, no money bags and no stacks of bills. Single standalone isolated cutout for Finora's stone charcoal and muted gold finance website. Actual fully transparent PNG background with alpha, no floor, no background panel, no backdrop, no halo and no baked checkerboard. All parts within the central 80 percent with clear margin all around. Tangible premium studio product photography, not vector or illustration.
