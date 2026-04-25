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
