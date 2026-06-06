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

# Claude Code — Adapter — copper-and-quartz

You are working inside a Shokunin Crafthouse project workspace. Studio standards load globally (`~/.claude/CLAUDE.md` → studio-memory core + `learnings/INDEX.md`). `WORKSPACE.md` at this repo root is binding for everything project-specific.

## Repo identity

copper-and-quartz — a **Next.js App Router** project (TypeScript; see `package.json` / `next.config.js`), studio default stack. The authoritative identity is `WORKSPACE.md`.

> ⚠️ `WORKSPACE.md` PROJECT META is still template placeholders (`[PROJECT NAME]`, `[Fill in]`). Fill it before the next sprint — the code is real but the identity record is not.

## Stack deviations from studio defaults

None — Next.js App Router on Vercel is the studio default. Record any departure here and in `decisions/decisions.md`.

## Repo learnings

Project-specific learnings (quirks, gotchas, stack-specific fixes) live in `LEARNINGS.md`. Read it at session start; append at sprint close (`sc-learn`). Promote an entry up to studio-wide `studio-memory/learnings/` only when it passes the compounding test (will it change how an unrelated future project is built?). Never duplicate studio-wide learnings down into this repo.

## Required reading (in order)

1. `WORKSPACE.md` — project identity, non-negotiables, operating rules, and the `Current sprint:` pointer
2. `../studio-memory/WORKFLOW.md` — **canonical** stage sequence + approval gates (invariant; referenced, never copied)
3. The active sprint's `CONTEXT.md` — path from the `Current sprint:` field; the sprint contract, **Inputs table**, and pre-output audit checklist
4. Only the files named in that CONTEXT.md **Inputs table** — `_config/` sections loaded selectively, never in full
5. `decisions/decisions.md` — prior decisions; do not reopen without reason

## Behaviors for this workspace

- Treat `WORKSPACE.md` as a binding directive, not background context.
- **Token source is conditional** — resolve per `decisions/decisions.md`: a Shokunin-branded property draws from the shared design system (`brand.shokunincrafthouse.com`) and bypasses local `token-map.md`; a client project uses local `_config/design-system/token-map.md`. Never improvise a value.
- When a stage boundary is ambiguous, ask before proceeding — never cross a gate silently.
- Decide-and-log: make reversible, in-standard, in-scope calls and log them to `decisions/decisions.md` (date, context, rationale, consequences); ask only for scope/money/live-service/brand-direction calls (contract §1).
- Surface ambiguity back to the owning stage. Do not improvise and continue.
- Every new top-level folder requires an update to `workspace.manifest.yaml`.

## What this adapter does NOT contain

Studio content — identity, principles, quality criteria, stack defaults, gates, creative defaults — loads globally via the import chain, not here. Project rules live in `WORKSPACE.md` so they bind every model and contributor. Pointers only.
