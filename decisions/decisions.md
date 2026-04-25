# Decisions Log

Append-only log of non-trivial decisions made on this project. Entries are not edited in place — if a decision is reversed, a new entry records the reversal and references the original.

## What belongs here

- Decisions with irreversible or cross-cutting consequences
- Trade-offs that took meaningful discussion
- Scope changes, gate bypasses, and deferred items
- Stage closures (Gate 1, Gate 2, Gate 3, Gate 4, Close)
- Retrospective entries at day 14 post-launch

## What does not belong here

- Transient implementation notes → stage `build-notes.md`
- Bugs → `stages/04-review/output/punch-list.md`
- Design exploration → `stages/02-design/claude-design/` or `./figma/`

## Entry format

```
## YYYY-MM-DD — [short title]
**Stage:** [01-brief | 02-design | 03-build | 04-review | 05-launch]
**Status:** [proposed | accepted | superseded by <date-title> | reversed]

**Context.** What situation forced the decision.
**Decision.** What was chosen.
**Rationale.** Why — the trade-off considered and the alternatives rejected.
**Consequences.** What this commits us to; what it costs.
```

---

## Entries

<!-- Append new entries below. Newest at the bottom. Do not edit historical entries. -->

## 2026-04-25 — Bypass Gate 1 to begin design system v1
**Stage:** 01-brief → 02-design
**Status:** accepted

**Context.** Stage 01 (Brief) artifacts (project brief, scope statement, success criteria, reference board, risk register) are not authored. Studio direction is to begin design-system foundations now, with the brief to be backfilled in parallel.
**Decision.** Bypass Gate 1 (Concept sign-off) and advance `project.stage` from `01-brief` to `02-design`. Begin token + base-component work immediately. Brief artifacts to follow.
**Rationale.** Wedding has a fixed launch horizon. Foundational tokens are prerequisite to all design and build work and have low risk of rework even before brief sign-off — colors, type families, and the 8px grid are stable studio inputs. Holding the design-system sprint until the brief lands creates idle time without reducing risk.
**Consequences.** Stage 01 artifacts must be authored before Gate 2 (Design sign-off) is presented. If brief discovery surfaces a direction that contradicts the v1 tokens, the tokens are reopened in stage 02 — not patched downstream. WORKFLOW.md transition rule applies.

## 2026-04-25 — Stack: CSS Modules only for v1, no Tailwind
**Stage:** 02-design
**Status:** accepted

**Context.** studio-memory.md §5 sets Tailwind layered over a token file as the default stack. Project spec for the design system v1 is "CSS Modules only — no component library."
**Decision.** Ship the v1 design system as CSS custom properties (`tokens.css`) + per-component CSS Modules. No Tailwind, no Shadcn, no Radix.
**Rationale.** This is an editorial wedding site with a small surface (~5 base components, a handful of pages). Tailwind's value compounds with component density and team scale; neither applies here. CSS Modules + tokens give equivalent token discipline with zero build-config overhead and a more legible style for editorial design intent. The ban on raw values in components (no hex, no px) is enforced via lint of token references.
**Consequences.** New components in this codebase author CSS Modules, not Tailwind utilities. If the project later grows to a SaaS-like scale, Tailwind can be layered on without removing the token file (tokens become the Tailwind theme source). Reversal entry would supersede this one.

## 2026-04-25 — Font scale ships with mixed ratios for v1
**Stage:** 02-design
**Status:** accepted

**Context.** studio-memory.md §3 Typography requires a single declared modular ratio (1.125, 1.2, 1.25, or 1.618). The specified scale (12, 14, 16, 18, 24, 32, 40, 56, 112, 200) walks across multiple ratios — body/UI sizes near 1.125–1.2, display sizes step at 1.79–2.0.
**Decision.** Ship the specified scale verbatim in v1. Do not propose a clean modular ratio yet.
**Rationale.** Wedding sites operate in editorial register: body type at one cadence, display type at a separate, intentionally bigger cadence. The Figma designs are built to these exact sizes. Rebuilding the scale to a single ratio would require redesigning the hero and save-the-date layouts. The principle exists to prevent ad-hoc one-offs; here, the larger steps are deliberate display moves, not improvisation.
**Consequences.** The token file documents the scale as-is; pairings are governed by usage rules (which size goes with which family), not by the ratio. If the editorial direction changes in stage 02 design review, the scale is reopened here. v2 may consolidate.

## 2026-04-25 — Save the Date mobile reflow via CSS-only overrides
**Stage:** 03-build
**Status:** accepted

**Context.** Desktop `/savethedate` (1512×1080) is approved and merged on `main` (`be67ff6`). The mobile Figma frame (`22:1450`, 360×1921) reflows the same content into a single column with a full-width Print bar pinned to the viewport bottom, and adds two horizontal `hairline + center palm-icon` dividers absent from the desktop DOM. Constraint from studio: do not change desktop styles, no new image assets if reuse is possible, no new design tokens unless a clean snap is impossible.
**Decision.** Implement the mobile breakpoint as a single appended `@media (max-width: 768px)` block in `src/app/savethedate/page.module.css` with no DOM changes to `page.tsx`. The two mobile-only dividers render as `.page::before` / `.page::after` pseudo-elements with the palm-icon SVG layered over a hairline gradient. The mobile-only courthouse fade-top renders as `.courthouseAnchor::after`. Desktop chrome that mobile replaces (vertical/horizontal dividers, three corner palm icons) is hidden via `display: none`. The page itself becomes a flex-column; `.leftColumn` and `.rightPanel` use `display: contents` so their children promote into `.page`'s flex context and are sequenced via `order: N`. Decorative bleeds (palm bg, coastal water) sit at `z-index: -1` inside `.page`'s isolated stacking context; in-flow text content overlapping the absolute courthouse image (`.events`, `.coords`, and the section labels) gets `z-index: 1` (no `position: relative`, since flex items honor `z-index` per spec) so it paints above the courthouse without breaking flex order.
**Rationale.** Pseudo-elements + `display: contents` + flex `order` keeps the mobile diff confined to one CSS file — no `page.tsx` edits, no risk of accidentally touching desktop semantics, no new assets. The trade-off considered: an alternative absolute-positioning approach (Figma-literal pixel `top:` values per element) was rejected because it doesn't respond to viewport widths between 360 and 768. The discovered subtlety: setting `position: relative` on the lifted in-flow elements broke flex item participation when their parent had `display: contents`; using `z-index: 1` alone (which still creates a stacking context for a flex item per CSS spec) preserved the flex order while putting the text above the courthouse. Snaps to the token scale: 25→24 px footer-text gap (`--space-3`); 23→24 px footer-text size (`--text-xl`, continues D1 from desktop); 18 px / 16 px body and event-row sizes mapped exactly to `--text-lg` / `--text-base` with no new tokens needed.
**Consequences.** Future mobile design changes that introduce a value off the token scale (or that need DOM elements desktop doesn't have) reopen this entry. The wedding site stays a 1-off scope for these mobile-only treatments — none of these patterns get promoted into the design system. `display: contents` + `z-index` on flex items is now an established pattern in this codebase; future mobile reflows of multi-region desktop layouts can follow it. If broader use of this pattern surfaces additional browser quirks, capture them here and reconsider the architecture.
