# Sprint: [sprint-name]
Stage: 03-build
Status: drafting
---
## Inputs
| Source | File/Location | Section/Scope | Why |
|--------|--------------|---------------|-----|
| Brand config | _config/brand/ | Full | Brand constraints |
| Design tokens | _config/design-system/token-map.md | Full | All implementation values |
| Voice config | _config/voice/ | Full | Copy tone |
| Code standards | ~/Projects/shokunin-crafthouse/studio-memory/playbooks/code-standards.md | all | Implementation rules |
| Creative defaults | ~/Projects/shokunin-crafthouse/studio-memory/playbooks/creative-defaults.md | all | Design decisions |
| Figma sandbox | [Figma file URL] | [Section name] frames on Sandbox page | Build source |
## Contract
(leave blank — Claude proposes this at session start, you fill in after approval)
## Outputs
| Artifact | Location | Format |
|----------|----------|--------|
| Implemented sprint | src/ (feature branch feat/[sprint-name]) | Code |
| Snapshots | /previews/[sprint-name]/ | PNG |
| Sprint artifacts | stages/03-build/[sprint-name]/output/ | Notes, evaluator report |
## Audit (Claude runs this before opening the PR)
- [ ] All colors, fonts, spacing come from token-map.md — no raw values in code
- [ ] All four breakpoints implemented (360, 768, 1024, 1440)
- [ ] All interactive states present (default, hover, focus, active, disabled)
- [ ] No AI-default patterns (generic gradients, stock layouts, template components)
- [ ] Real copy everywhere — no lorem ipsum
- [ ] Asset paths work at root (/) AND at /_previews/[N]/
- [ ] `npm run build` exits 0
- [ ] `npm run preview [sprint-name]` exits 0 and produces 4+ PNGs
- [ ] PNGs verified to show rendered section, not blank pages or error states
