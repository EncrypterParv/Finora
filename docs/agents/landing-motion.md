# Finora landing motion plan

## What we saw on GSAP.com

The homepage was opened in Chromium at 1440 × 1050. Reading down the page showed
an animated typographic opening, a quieter introduction, then one long pinned
scene. The pinned scene replaces and moves oversized words, sweeps labels across
the screen, rotates graphic accents, and brings in a drawn easing curve. The
same stage is visible across multiple scroll positions before it gives way to
the Tools and Showcase sections. These are observations of the rendered
[GSAP homepage](https://gsap.com/).

Finora should keep that rhythm. One material opening, one clearly sequenced
product explanation, then calm content and a distinct illustrated closing.

## Build order

| Surface | Treatment | Interaction |
| --- | --- | --- |
| Statement review hero | Scale the decorative photograph from 1 to about 1.12 with a small vertical shift. Keep the headline, navigation, and CTA steady. | Tie progress to the first viewport with ScrollTrigger. The full height and bottom fade work before JS runs. |
| Statement to plan | Pin the four existing steps on desktop. The left workbench stays in place while the explanatory copy moves horizontally on the right. | Scroll maps to the four steps. The numbered controls also jump directly to a step. The workbench changes once per step and retains its keyboard-accessible scenario control. |
| Calendar and goals | Keep the existing photos, figures, and descriptions in their reading order. | Use standard hover and focus feedback. Keep the calendar and goal examples readable during scroll. |
| Calculator and plans | Keep totals and user inputs stable while values update. | Slider results are immediate. Preserve the existing illustrative labels and plan links. |
| Illustrated footer | Show the original portrait group over graphite near the closing CTA. A brief rise settles the art when it first enters view. | Footer navigation and sign-in are ordinary links. The decorative portraits do not imply customers or endorsements. |
| Login and workspace | Style state changes with the existing CSS and use visible loading or status text where needed. | Form and financial actions remain native with no scroll animation runtime. |

## Library ownership and file changes

- **GSAP ScrollTrigger** owns the hero and the desktop rail. Limit the rail to
  one pin, measure the track at runtime, and refresh geometry after viewport
  changes. Store the cleanup with the page so revisits cannot duplicate triggers.
  [ScrollTrigger documentation](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- **Lenis** smooths fine-pointer desktop scrolling only. Drive it from the GSAP
  ticker, keep one animation loop, and let browser anchors and touch use their
  standard behavior. Keep native scroll usable independently of Lenis.
  [Lenis integration guide](https://github.com/darkroomengineering/lenis#gsap-scrolltrigger)
- **Anime.js** owns the footer illustration's single entrance. Load it near
  the footer, animate the decorative layer only, and restore styles on cleanup.
  [Anime.js documentation](https://animejs.com/documentation/)
- `LandingPage.tsx` keeps the content and stage controls.
  `landing-motion.ts` coordinates scroll animation and jump targets.
  `LandingFooter.tsx` contains the closing copy, links, and art.
  `identity.css` contains the baseline styling and enhanced desktop layout.

## Responsive and accessibility behavior

The horizontal story is available on desktop with a fine pointer and a tall
viewport. Phones, short windows, reduced motion, and a blocked animation chunk
keep all four stages in vertical document order. Keep heading links, skip links,
FAQ disclosure controls, and the Wealth slider usable by keyboard. Never hide
essential text pending a script or make scroll the only way to change stages.
Check switching the OS motion preference, resizing during the pin, entering an
anchor directly, and navigating away and back.

## Performance and review

Use only opacity and transforms for motion. Serve the existing separate portrait
and wide crops, lazy load the footer image, and load the motion runtime after
the initial render. Check desktop, phone, reduced motion, and a real trackpad.
Compare the production build with and without enhancement using the same test
conditions. Aim for CLS at or below 0.1 and INP at or below 200 ms, and investigate
any repeatable loading regression before adding more effects. The plan records
targets, not measured scores.

## Local browser checks

Chromium showed one pin, the third step aligned after using its control, and
the hero zoom removed when the motion preference changed live. At 390 px,
there was no page overflow and all four steps remained in vertical order.
The footer rendered its transparent illustration, and its FAQ link reached
the intended section. Production performance measurements are still open.
