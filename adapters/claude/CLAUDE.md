<!-- ============================================================ -->
<!-- CLAUDE.md — CLAUDE CODE ADAPTER                              -->
<!-- ============================================================ -->
<!-- WHAT THIS FILE IS                                            -->
<!-- The Claude Code adapter for this Shokunin Crafthouse         -->
<!-- workspace. Claude Code auto-loads CLAUDE.md at session       -->
<!-- start. This file is thin on purpose — project rules live in  -->
<!-- WORKSPACE.md so they are not Claude-specific.                -->
<!--                                                              -->
<!-- WHAT CLAUDE MUST DO                                          -->
<!-- 1. Read ../../WORKSPACE.md — source of truth for identity    -->
<!--    and rules; note its "Current sprint:" pointer.            -->
<!-- 2. Read ../../WORKFLOW.md — stage structure and gates.       -->
<!-- 3. Follow the "Current sprint:" pointer to that sprint's     -->
<!--    CONTEXT.md — the active sprint contract.                  -->
<!-- 4. Load only the files named in that CONTEXT.md Inputs       -->
<!--    table — _config/ sections selectively, never in full.     -->
<!-- 5. For color/type/spacing/motion: the shared design system   -->
<!--    (brand.shokunincrafthouse.com) for Shokunin-branded       -->
<!--    properties, else local _config/design-system/token-map.md -->
<!--    for client projects — per decisions/decisions.md.         -->
<!-- 6. Consult ../../decisions/decisions.md before reopening     -->
<!--    any resolved question.                                    -->
<!--                                                              -->
<!-- READ NEXT                                                    -->
<!-- ../../WORKSPACE.md                                           -->
<!-- ============================================================ -->

# Claude Code — Adapter

You are working inside a Shokunin Crafthouse project workspace. The studio operates on institutional memory, not session-local improvisation. WORKSPACE.md at the repo root is binding.

## Required reading (in order)

1. `../../WORKSPACE.md` — project identity, non-negotiables, operating rules, and the `Current sprint:` pointer
2. `../../WORKFLOW.md` — stage sequence and approval gates
3. The active sprint's `CONTEXT.md` — path given by the `Current sprint:` field in WORKSPACE.md; the sprint contract, Inputs table, and pre-output audit checklist
4. Only the files named in that CONTEXT.md **Inputs table** — `_config/` sections loaded selectively, never in full
5. `../../decisions/decisions.md` — prior decisions; do not reopen without reason

## Behaviors for this workspace

- Treat WORKSPACE.md as a binding directive, not background context.
- **Token source is conditional.** For any color, type, spacing, or motion value, consult the source named in `decisions/decisions.md`: a Shokunin-branded property draws tokens from the shared design system at `brand.shokunincrafthouse.com` (linked shared CSS, generated from the shared JSON) and bypasses local `token-map.md`; a client project uses local `_config/design-system/token-map.md`. Never improvise a value.
- When a stage boundary is ambiguous, ask before proceeding — never cross a gate silently.
- Log any non-trivial decision into `decisions/decisions.md` with date, context, rationale, consequences.
- Prefer fewer, more considered edits over many small ones. Plan before writing.
- Surface ambiguity back to the owning stage. Do not improvise and continue.
- Every new top-level folder requires an update to `workspace.manifest.yaml`.

## What this adapter does not contain

Project rules. They live in WORKSPACE.md so they apply to every model and every contributor — not just Claude. Do not duplicate them into this file; pointers only.
