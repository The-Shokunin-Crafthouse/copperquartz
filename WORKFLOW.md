<!-- ============================================================ -->
<!-- WORKFLOW.md — STAGE FLOW & APPROVAL GATES                    -->
<!-- ============================================================ -->
<!-- WHAT THIS FILE IS                                            -->
<!-- The canonical stage sequence for a Shokunin Crafthouse       -->
<!-- project and the approval-gate criteria between stages.       -->
<!-- Binding. Model-neutral.                                      -->
<!--                                                              -->
<!-- WHAT YOU (THE MODEL) MUST DO                                 -->
<!-- 1. Resolve the current stage from workspace.manifest.yaml    -->
<!--    (project.stage).                                          -->
<!-- 2. Confirm the gate for stage N-1 has been cleared before    -->
<!--    producing stage-N output.                                 -->
<!-- 3. Do not produce artifacts outside the current stage.       -->
<!-- 4. Treat every gate checklist as a pass/fail boundary, not   -->
<!--    a suggestion.                                             -->
<!--                                                              -->
<!-- READ NEXT                                                    -->
<!-- stages/<current>/STAGE.md                                    -->
<!-- ============================================================ -->

# WORKFLOW

Every Shokunin Crafthouse project moves through five stages. Each stage has a defined output, a defined gate, and a binding transition rule.

## SEQUENCE

```
01-brief → [GATE 1] → 02-design → [GATE 2] → 03-build → [GATE 3] → 04-review → [GATE 4] → 05-launch → [CLOSE]
```

No stage is skipped silently. No gate is crossed without sign-off. If a later-stage problem has its root cause in an earlier stage, the fix happens in the owning stage — not downstream.

---

## 01 — BRIEF

**Purpose.** Establish direction, scope, constraints, and reference sensibility before any pixel or line of code is committed.

**Inputs.** Client conversation, competitor audit, context documents.

**Outputs** → `stages/01-brief/output/`
- Project brief (narrative)
- Scope statement (in / out, explicit)
- Success criteria (felt + measurable)
- Reference board (aligned with client)
- Risk register

### Gate 1 — Concept sign-off
- [ ] Direction is written and agreed with the client
- [ ] Scope is defined; out-of-scope items are named explicitly
- [ ] Success criteria are specific enough to verify at review
- [ ] Reference sensibility is aligned — not "we'll figure it out"
- [ ] Non-negotiables in WORKSPACE.md confirmed against this project
- [ ] Risks logged with mitigations

---

## 02 — DESIGN

**Purpose.** Resolve every decision a builder would otherwise improvise. Design until ambiguity is gone. Hand stage 03 a specification, not a vibe.

**Inputs.** Gate-1 artifacts, brand and voice config, design-system tokens.

**Outputs** → `stages/02-design/output/`
- Type system (scale, ratio, families, pairings, tracking, measure)
- Color tokens (semantic names, light/dark values, usage)
- Spacing scale
- Component inventory with all states
- Key screens at all required breakpoints
- Motion principles (named curves, durations, trigger mapping)
- Interaction specification (five states per interactive element)

### Gate 2 — Design sign-off
- [ ] Type system resolved and documented
- [ ] Tokens named and finalized — no raw hex in mocks
- [ ] Responsive behavior specified at 360, 768, 1024, 1440, 1920 minimum
- [ ] Motion principles stated, not implied
- [ ] Dark mode fully designed or formally deferred (logged)
- [ ] Accessibility reviewed: contrast, focus, keyboard paths
- [ ] Copy in mocks is production-intent (no lorem)
- [ ] All five interaction states specified for every interactive element

---

## 03 — BUILD

**Purpose.** Implement the design without drift. The build is a faithful materialization of stage-02 output, not a reinterpretation.

**Inputs.** Gate-2 artifacts, design-system tokens, build-stack defaults.

**Outputs**
- Implementation in the project codebase
- Storybook or component index (where applicable)
- Staging deployment URL
- `stages/03-build/output/build-notes.md` — deviations with rationale, performance baselines, known issues

### Gate 3 — Build sign-off
- [ ] All interaction states implemented (not just happy path)
- [ ] Core Web Vitals met on representative network: LCP < 2.5s, CLS < 0.1, INP < 200ms
- [ ] Keyboard navigable end-to-end on every shipped flow
- [ ] Screen reader verified on launch-critical flows
- [ ] Contrast passing (AA body, AAA legal/disclosure)
- [ ] Reduced-motion variant implemented and working
- [ ] Chrome, Firefox, Safari (desktop + iOS) verified
- [ ] No raw hex, no magic numbers, no lorem in the build
- [ ] Staging URL shared with studio for review

---

## 04 — REVIEW

**Purpose.** Hold the work against criteria set in stages 01 and 02. This is where "good enough" gets rejected. Kind, specific, unyielding.

**Inputs.** Staged build, Gate-2 specification, Gate-1 success criteria.

**Outputs** → `stages/04-review/output/`
- QA report (functional issues with repro steps)
- Accessibility report (findings with severity)
- Performance report (Lighthouse + real-network numbers)
- Design-parity report (where build diverges, with verdict)
- Punch list (every unresolved item, owner, target date)

### Gate 4 — Review sign-off
- [ ] Every punch-list item closed or logged as explicit post-launch
- [ ] Performance measured on representative network and device
- [ ] Accessibility verified with at least one assistive-tech pass (VoiceOver, NVDA, or equivalent)
- [ ] Design parity confirmed for all key screens
- [ ] Copy is final — no placeholder strings in the build
- [ ] Success criteria from Gate 1 verifiably met

---

## 05 — LAUNCH

**Purpose.** Ship with observability in place. Hand off in a state the client or internal team can actually operate.

**Inputs.** Gate-4 sign-off.

**Outputs** → `stages/05-launch/output/`
- Production deploy
- Analytics verification (events firing, dashboards wired)
- Error monitoring configured
- Uptime monitoring configured
- Redirects and metadata confirmed
- Legal artifacts in place (privacy, cookies, terms as required)
- Handoff document
- 14-day post-launch log

### Close
- [ ] Handoff accepted by client or internal team
- [ ] 14-day post-launch tail complete with no open critical issues
- [ ] Retrospective entry appended to `decisions/decisions.md`
- [ ] `workspace.manifest.yaml` `project.stage` set to `closed`

---

## TRANSITION RULES

**Moving forward.** When a gate closes, update `workspace.manifest.yaml` `project.stage` to the next stage id before producing any stage-N+1 output.

**Moving backward.** If a problem in stage N has its root cause in stage M (M < N), update artifacts in stage M and re-run the gate. Do not patch downstream.

**Bypassing a stage.** Possible, but never silent. Record the bypass in `decisions/decisions.md` with context, risk, and explicit studio approval. Retrospectives review all bypasses.

**Post-launch findings (first 14 days).** Filed against stage 04 and worked. Not treated as "v2."
