<!-- ============================================================ -->
<!-- CLAUDE.md — REPO-ROOT ADAPTER (thin)                         -->
<!-- ============================================================ -->
<!-- Claude Code auto-loads THIS file (repo root) at session      -->
<!-- start — ICM Layer 0. Studio identity, principles, quality    -->
<!-- bar, stack DEFAULTS, gates, creative defaults, and the       -->
<!-- learnings index load GLOBALLY from ~/.claude/CLAUDE.md        -->
<!-- (which @imports canonical studio-memory). Do NOT restate any  -->
<!-- studio content here — only what is specific to THIS repo,     -->
<!-- plus the repo-local navigation chain. Pointers, not copies.   -->
<!-- ============================================================ -->

# Claude Code — Adapter

You are working inside a Shokunin Crafthouse project workspace. Studio standards load globally (`~/.claude/CLAUDE.md` → studio-memory core + `learnings/INDEX.md`). `WORKSPACE.md` at this repo root is binding for everything project-specific.

## Repo identity

copper-and-quartz — Stripe-backed wedding registry and guest-list site; Next.js App Router; Vercel.

## Stack deviations from studio defaults

_None yet — repo follows studio defaults. Replace with deviations as they are decided (and log each in `decisions/decisions.md`)._

## Repo learnings

Project-specific learnings live in `LEARNINGS.md`. Read at session start; append at sprint close (`sc-learn`). Promote to studio-wide `studio-memory/learnings/` only on the compounding test (will it change how an unrelated future project is built?). Never duplicate studio-wide learnings down into here.

## Required reading (in order)

1. `WORKSPACE.md` — project identity, non-negotiables, operating rules, and the `Current sprint:` pointer
2. `../studio-memory/WORKFLOW.md` — **canonical** stage sequence + approval gates (invariant; referenced, never copied — the repo's `WORKFLOW.md` is a pointer)
3. The active sprint's `CONTEXT.md` — path from the `Current sprint:` field; the sprint contract, **Inputs table**, and pre-output audit checklist
4. Only the files named in that CONTEXT.md **Inputs table** — `_config/` sections loaded selectively, never in full
5. `decisions/decisions.md` — prior decisions; do not reopen without reason

## Behaviors for this workspace

- Treat `WORKSPACE.md` as a binding directive, not background context.
- **Token source is conditional** — resolve per `decisions/decisions.md`: a Shokunin-branded property draws from the shared design system (`brand.shokunincrafthouse.com`) and bypasses local `token-map.md`; a client/standalone project uses local `_config/design-system/token-map.md`. Never improvise a value.
- Decide-and-log: make reversible, in-standard, in-scope calls and log them to `decisions/decisions.md` via `sc-adr`; ask only for scope/money/live-service/brand-direction calls (contract §1).
- When a stage boundary is ambiguous, ask before proceeding — never cross a gate silently.
- Surface ambiguity back to the owning stage. Do not improvise and continue.
- Every new top-level folder requires an update to `workspace.manifest.yaml`.

## What this adapter does NOT contain

Studio content — identity, principles, quality criteria, stack defaults, gates, creative defaults — loads globally via the import chain, not here. Project rules live in `WORKSPACE.md` so they bind every model and contributor. Pointers only.
