---
name: transform-ai-slop-websites
description: Audit and redesign an existing website whose interface feels generic, inconsistent, or AI-generated. Use when asked to improve a real site's visual design and UX while preserving its product behavior.
---

# Transform AI Slop Websites

Turn an existing website into a distinctive, usable, accessible, and maintainable product interface. Make visual choices that clarify the product, strengthen hierarchy, or improve interaction. Do not decorate around unresolved UX problems.

## Workflow

1. **Audit before editing.** Inspect the framework, routes, styling system, shared components, and major user journeys. Run the app and inspect the current interface when the environment supports it. Identify what works, what is confusing, what functionality must remain, and the highest-impact design problems. Do not replace working product behavior with static mockups.
2. **Set a product-specific direction.** Establish who the interface serves, what users need to do, and what the product actually offers. Choose a visual concept, type, color, and a clear focal point that fit that context. Do not invent capabilities, customer proof, testimonials, or metrics.
3. **Improve the whole experience.** Fix information hierarchy, navigation, page composition, spacing, typography, responsive behavior, and interaction feedback. Keep existing routes, authentication, data flows, forms, permissions, and business logic intact. Make visible controls work; add or preserve useful loading, empty, error, success, and validation states where relevant.
4. **Build on the existing system.** Reuse project conventions and components where they are sound. Centralize or refine design tokens for color, type, spacing, radii, elevation, and breakpoints when useful. Avoid introducing a new styling architecture or dependencies without a concrete benefit.
5. **Inspect the result.** Run the app and review the rendered pages at representative mobile and desktop widths when feasible. Exercise the primary journey and important controls. Correct visible regressions, overflow, weak contrast, missing focus states, and layout problems before reporting completion. If a check cannot be performed in the environment, state that plainly.

## Design judgment

- Make the product's purpose and primary action clear quickly. Use specific, truthful copy; remove vague hero claims, empty hype, and redundant sections.
- Use a coherent palette and distinctive typography suited to the product. Gradients, glows, shadows, decorative shapes, and gradient text are optional tools, not default styling. Use them only when they support hierarchy or the visual concept.
- Choose alignment and layout based on content. Avoid centering every section, repeating identical card grids, and forcing unrelated content into cards. Each card should present useful information, status, comparison, or action.
- Establish a small, consistent spacing, radius, and elevation system that fits the project. A four-pixel spacing rhythm can help, but do not force values where the layout needs otherwise.
- Make one visual moment memorable and let the rest of the page support it. Avoid competing effects, gratuitous animation, and random decoration.
- Give primary actions clear priority and action-oriented labels. Provide visible hover, focus, active, disabled, and loading states where applicable. Never leave a button that appears functional but does nothing.
- Use one consistent icon system with recognizable symbols and accessible labels. Do not use emoji as the primary navigation icon system.
- Treat social proof and numerical claims as data: use them only when verified. Demonstrate the actual product when claims cannot be supported.
- Use semantic structure, keyboard access, readable contrast, meaningful alternative text, touch-friendly controls, and reduced-motion support. Keep motion restrained and respect `prefers-reduced-motion`.

## Completion standard

The result should feel like one coherent product across its main pages and common viewport sizes. Summarize the main design and functional changes, what was inspected or exercised, and any verification that remained unavailable. Do not call a redesign complete based only on code compiling.
