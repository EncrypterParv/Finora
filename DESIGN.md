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
viewport sized marble background. Darken the image behind the text and fade its
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

## Image provenance

These assets were generated for Finora with the built-in ImageGen tool on
2026-11-23. The three photo cutouts have an alpha channel and depict no actual
financial records. The marble has two optimized WebP sizes. Source prompts
follow.

#### marble-flow.webp and marble-flow-small.webp

Create original photographic 3D still life artwork ONLY, a wide editorial masthead asset for Finora personal finance. Panoramic landscape. Heroic view of a single massive folded ribbon of honed Calacatta marble suspended across the scene, forming two asymmetric open arches; one edge carries a narrow continuous brushed champagne-gold inlay that follows the fold like a contour line. Fine dramatic grey crystalline veins, grounded architectural texture, crisp side daylight and soft falloff. Background deep charcoal concrete, oversized sculpture filling frame, strongest shape in middle and right, cropped confidently at left and bottom. Rich blacks, luminous cool white stone, restrained gold, high-end architectural photography, tactile and believable. Totally original geometry. No text, no logo, no interface, no people, no lettering, no letters, no diagrams. Width-to-height about 2:1.

#### statement-still-life.png

An overhead three-quarter product photograph of two slightly overlapping matte ivory bank statement slips and a polished charcoal metal paper clip, one paper gently curled, with a few very pale gray horizontal printed rules and tiny abstract dark rectangles only. No readable glyphs, no figures, no actual account information, no brands. The arrangement is approximately square, whole object inside the frame, elegant asymmetry, soft light from upper left. Single standalone isolated cutout for Finora's stone charcoal and muted gold finance website. Actual fully transparent PNG background with alpha, no floor, no background panel, no backdrop, no halo and no baked checkerboard. All parts within the central 80 percent with clear margin all around. Tangible premium studio product photography, not vector or illustration.

#### calendar-still-life.png

A realistic editorial still life of a small blackened-steel perpetual desk calendar frame with an ivory card showing a simple grid of subtle punched dots, beside three brushed silver coins resting against its lower edge. No printed numbers, lettering or brand. Slight three-quarter view with confident geometry and tactile surfaces. Whole object inside the frame, soft light from upper left, restrained modern financial editorial. Single standalone isolated cutout for Finora's stone charcoal and muted gold finance website. Actual fully transparent PNG background with alpha, no floor, no background panel, no backdrop, no halo and no baked checkerboard. All parts within the central 80 percent with clear margin all around. Tangible premium studio product photography, not vector or illustration.

#### savings-still-life.png

A realistic close-up studio product photograph of an arrangement of five small stacks of thin, finely milled brushed champagne-gold and cool silver coins, arranged along a shallow diagonal on a single slim rectangular piece of honed charcoal slate. Plain faces with concentric engraving and no denomination, symbols, lettering, or brand. The arrangement is centered, whole object inside the frame, soft light from upper left, elegant and restrained, no money bags and no stacks of bills. Single standalone isolated cutout for Finora's stone charcoal and muted gold finance website. Actual fully transparent PNG background with alpha, no floor, no background panel, no backdrop, no halo and no baked checkerboard. All parts within the central 80 percent with clear margin all around. Tangible premium studio product photography, not vector or illustration.
