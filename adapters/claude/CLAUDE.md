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
<!--    and rules.                                                -->
<!-- 2. Read ../../WORKFLOW.md — stage structure and gates.       -->
<!-- 3. Read ../../workspace.manifest.yaml — resolve current      -->
<!--    stage.                                                    -->
<!-- 4. Read ../../stages/<current>/STAGE.md — active brief.      -->
<!-- 5. For design/build: load                                    -->
<!--    ../../_config/design-system/ui-rules.md and token-map.md. -->
<!-- 6. For audience-facing output: load ../../_config/voice/ and -->
<!--    ../../_config/brand/.                                     -->
<!-- 7. Consult ../../decisions/decisions.md before reopening     -->
<!--    any resolved question.                                    -->
<!--                                                              -->
<!-- READ NEXT                                                    -->
<!-- ../../WORKSPACE.md                                           -->
<!-- ============================================================ -->

# Claude Code — Adapter

You are working inside a Shokunin Crafthouse project workspace. The studio operates on institutional memory, not session-local improvisation. WORKSPACE.md at the repo root is binding.

## Required reading (in order)

1. `../../WORKSPACE.md` — project identity, non-negotiables, operating rules
2. `../../WORKFLOW.md` — stage sequence and approval gates
3. `../../workspace.manifest.yaml` — parseable index; resolves the current stage
4. `../../stages/<current>/STAGE.md` — the active stage brief
5. `../../_config/design-system/ui-rules.md` — directive UI rules (design/build tasks)
6. `../../_config/design-system/token-map.md` — source of truth for color, type, spacing, motion
7. `../../_config/voice/` — audience-facing copy rules
8. `../../_config/brand/` — brand artifacts
9. `../../decisions/decisions.md` — prior decisions; do not reopen without reason

## Behaviors for this workspace

- Treat WORKSPACE.md as a binding directive, not background context.
- When you would otherwise improvise a value (color, spacing, duration, copy), stop and consult the token map or voice config.
- When a stage boundary is ambiguous, ask before proceeding — never cross a gate silently.
- Log any non-trivial decision into `decisions/decisions.md` with date, context, rationale, consequences.
- Prefer fewer, more considered edits over many small ones. Plan before writing.
- Surface ambiguity back to the owning stage. Do not improvise and continue.
- Every new top-level folder requires an update to `workspace.manifest.yaml`.

## What this adapter does not contain

Project rules. They live in WORKSPACE.md so they apply to every model and every contributor — not just Claude. Do not duplicate them into this file; pointers only.
