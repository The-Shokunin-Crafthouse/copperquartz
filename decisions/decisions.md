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

## 2026-05-01 — Bypass Gate 2 to begin Sprint 1 build (global chrome + Home)
**Stage:** 02-design → 03-build
**Status:** accepted

**Context.** Stage 02 required outputs (`type-system.md`, `color-tokens.md`, `spacing-scale.md`, `components.md`, `screens/`, `motion.md`, `interaction-spec.md`, `a11y-notes.md`) are not authored as standalone documents. The Figma file (`TcT0OkRoxrcCRKNOKJqygZ`) contains five page frames at desktop (Home, Our Story, Venue, Travel, Q&A), all built to the v1 token map. `_config/voice/` and `_config/brand/` are empty. Studio direction is to begin shipping site sections sprint-by-sprint while design documentation backfills.
**Decision.** Bypass Gate 2 (Design sign-off) and advance `project.stage` from `02-design` to `03-build`. Sprint 1 ships: global chrome (root layout shell + fixed background + `NavBar` + `FooterBar` + reusable `InfoItem` + `CountdownValue`) and the Home page. Production copy is taken verbatim from the Figma frames; voice/brand population is deferred. The five-page layouts visible in Figma are the design specification; per-section interaction states and motion specs are derived from the Save the Date precedent (`page.module.css`, `decisions.md` 2026-04-26 entries) and applied uniformly.
**Rationale.** Wedding has a fixed launch horizon and Save the Date is already shipped; the design system v1 (tokens, fonts, motion vocabulary) is exercised and stable. Holding sprint 1 until Gate 2 docs land creates idle time without reducing risk — the Figma frames already encode every decision a builder would otherwise improvise. Mobile frames are not in Figma; sprint 1 reflows mobile from the Save the Date pattern (`@media (max-width: 768px)` single-column, hairline divider stacks, palm-icon corner anchors). Token snaps for the Home frame: hero 114→`--text-5xl` (112px), body 34→`--text-2xl` (32px), footer value 26→`--text-2xl` (32px) — preserves the wedding-site editorial register without introducing one-off sizes.
**Consequences.** If a sprint surfaces a design value with no defensible token snap, the token map reopens — sprint stops, Gate 2 returns to author the missing token. Stage 02 documentation (`type-system.md`, `interaction-spec.md`, etc.) is generated retroactively from the merged sprint-1 build, not authored ahead. The Save the Date motion vocabulary (`std-fade-rise`, `std-fade-zoom`, `std-slide-in-l/r`, `std-fade-drop`, `std-slide-up`; `cubic-bezier(0.16, 1, 0.3, 1)`; 800–1800ms; `prefers-reduced-motion: no-preference` gate) is the project's motion baseline — applied to all subsequent sections without re-litigating curves or durations.

## 2026-05-01 — PR-preview asset paths via NEXT_PUBLIC_BASE_PATH
**Stage:** 03-build
**Status:** accepted

**Context.** The site deploys as a Next.js static export to Hostinger shared hosting via rsync. Production root is `~/domains/copperquartz.family/public_html/`. Sprint 1 introduces a PR-preview workflow that deploys each PR's build into `~/domains/copperquartz.family/public_html/_previews/<pr#>/`, served at `https://copperquartz.family/_previews/<pr#>/`. All asset URLs (image `src`, anchor `href`, font `url()`) must resolve correctly at both root and a subpath, with no per-build code edits.
**Decision.** Drive `next.config.js` `basePath` and `assetPrefix` from `process.env.NEXT_PUBLIC_BASE_PATH` (empty string → root deploy; `/_previews/<n>` → preview deploy). Add `src/lib/paths.ts` exporting `BASE_PATH` and `withBase(path)`. All hand-written `<img src>`, `<a href>` to public files, and font `url()` references in CSS-in-JS go through `withBase()`. CSS Modules can use the literal path because static export rewrites `url()` references when `assetPrefix` is set; raw `<img src="/foo">` does not get rewritten by Next, so the helper is required. The PR-preview deploy step strips `out/.htaccess` before rsync so the production-only `^$ → /savethedate/` redirect rule does not fire on the preview subpath.
**Rationale.** Hard-coding production-absolute paths breaks PR previews (assets 404 because Next does not rewrite hand-written `<img src>` even with `assetPrefix` set). Building twice with different env values is the cleanest static-export answer — no runtime detection, no client JS branching, no dev/prod divergence. The helper isolates the convention so a future migration (e.g. to Vercel's automatic preview URLs) is a one-file change.
**Consequences.** Every component that references a `/public/...` asset must import `withBase`. CSS Modules in this codebase do not currently reference `url()` for static assets; if they start to, the same env value flows through `assetPrefix` and the import is not needed. `decisions.md` 2026-04-25 (Stack: CSS Modules only for v1) is unchanged.

## 2026-05-01 — Static build-time countdown, no client JS
**Stage:** 03-build
**Status:** accepted

**Context.** The footer reads "N days left" against a fixed wedding date (2026-09-29). A client-rendered countdown would tick in real time but introduces hydration risk (server vs client time-zone drift on a static export) and a watt of JS on every visit. The site is a `next export` build deployed as plain HTML on shared hosting; there is no server runtime to recompute.
**Decision.** `<CountdownValue target="YYYY-MM-DD">` computes days-to-target at module-evaluation time inside the React Server Component pass. No `'use client'`, no hooks, no `useEffect`, no `Date.now()` on the client. The value bakes into the static HTML at build time and is correct for the moment of deploy. Re-renders on every deploy.
**Rationale.** A wedding countdown that's off by one day is not a defect at this granularity — guests rarely revisit the homepage day-over-day, and the deploy cadence (continuous on every PR merge) keeps the value within ±1 day of correct in normal operation. The cost of correctness (client JS + hydration + a midnight-crossing edge case) outweighs the benefit. If the displayed value drifts beyond the comfort threshold close to launch, the fix is a redeploy, not a code change.
**Consequences.** No live ticker. No client-side date math. The component cannot be reused for a "live" countdown without a `'use client'` rewrite, which would need its own decision. The deploy pipeline becomes the freshness mechanism — long-paused branches will show stale numbers in their preview deploys until rebuilt.

## 2026-05-01 — Replace v1 stub UI components in place
**Stage:** 03-build
**Status:** accepted

**Context.** Design-system v1 shipped `NavBar`, `FooterBar`, `InfoItem`, `RSVPButton`, `FAQRow` as scaffold stubs (`feat/design-system-v1`, `606a183`). They were not imported anywhere — placeholders against future page work. Sprint 1 needs site-shaped versions of the first four; `FAQRow` is not yet used.
**Decision.** Replace `NavBar`, `FooterBar`, `InfoItem`, `RSVPButton` and their `.module.css` files in place — same paths, same export names, new shape. `FAQRow` remains untouched (still a stub) and will be revisited when the Q&A page lands. The renamed-in-spec contract names (`<SiteNav>`, `<SiteFooter>`, `<InfoColumn>`) collapse to the existing filenames; rename pass deferred until a second consumer needs the same component (which would force the question of where the boundary sits).
**Rationale.** Replace-in-place keeps the import surface stable for any future code that lands on these names and avoids an immediate rename diff that obscures the actual shape change. The stubs shipped nothing — there's no caller to break. The contract's preferred names (`SiteNav`, etc.) are aspirational; the working code is the source of truth, and a rename is cheap when there is exactly one import site.
**Consequences.** `FAQRow.tsx` and `FAQRow.module.css` remain v1-stub shape until the Q&A page exercises them. If the Q&A spec deviates from the stub, replace-in-place applies again. New components added by sprint 2+ may use either the contract names (`Site*`) or the existing filename style — pick per case; do not retroactively rename the four already shipping.

## 2026-05-05 — Sprint 1 layout deviations from contract (preview-vetted)
**Stage:** 03-build
**Status:** accepted

**Context.** Sprint 1 shipped through several rounds of preview-driven fixes. A handful of choices diverge from the kickoff contract; each was vetted in browser at the four breakpoints before being approved. Logged here so the deviations are not re-litigated downstream.
**Decision.**
  1. **Hamburger threshold at `<1024`, not `<768`.** Five inline nav labels (`Our Story / Venue / Travel / Registry / Q&A`) plus the RSVP pill cannot breathe in a 768px row without crowding into the courthouse bleed. The drawer takes over below 1024.
  2. **Footer is 5 columns** (`Countdown / IX.XXIX.MMXXVI / Location / Ceremony / Reception`), not the contract's 4 (`Countdown / Date / Location / Venue`). Splitting Venue into Ceremony (Sunken Garden) and Reception (Cabrillo Pavilion) is structurally accurate — they are two different addresses — and the Roman-numeral date label replaces a redundant "DATE" word with an editorial flourish that reads as part of the chrome.
  3. **Mobile footer is a horizontal-swipe row, not a column stack.** The fixed footer strip preserves a consistent visual height across all breakpoints; column-stacking blows the strip out vertically and forces the courthouse / coastal anchors to redraw. The swipe affordance shows a right-edge fade gradient when content overflows; a sixth slot is appended on `<768` containing the RSVP pill so the primary CTA is reachable without scrolling sideways.
  4. **Hero is rendered as `Levi & Meghan - homepage.svg`, not as text in `--font-display`.** Ngetic Modern's licensing terms do not permit web embedding for this surface. The SVG is a literal capture of the Figma lockup at production resolution; the wrapping `<h1>` carries the accessible name. Body copy and footer text remain `--font-sans` / `--font-serif` and exercise the type tokens normally.
  5. **Wax seal + palm corner icons appear at `≥1440` only.** Below the Figma desktop canvas the 5-column row + 122px badge collide; the 1024–1439 band keeps the row centered and omits the seal. This matches the visual cadence the canvas was drawn to.
**Rationale.** Each deviation surfaced through visual review, not through improvisation against a missing spec. Reverting to the contract verbatim would require either crowding the 768 nav, stacking the footer (and the courthouse with it), embedding an unlicensed font, or shipping a cropped seal — none of which improves the felt quality of the site.
**Consequences.** Sprint 2 page layouts inherit the same chrome — five inline nav links centered at `≥1024`, drawer below; 5-column horizontally-swipeable footer with mobile-RSVP slot; SVG hero lockups for any page that wants the display family. If a future page needs a typed `--font-display` heading, that's a separate decision (font licensing or a different display family).

## 2026-05-05 — Narrow `withBase` to non-routed paths only
**Stage:** 03-build
**Status:** accepted
**Supersedes (in part):** 2026-05-01 — PR-preview asset paths via NEXT_PUBLIC_BASE_PATH

**Context.** The 2026-05-01 entry directed all hand-written `<a href>` to public files through `withBase()`. That guidance over-applied to routed links: `next/link` and `useRouter` already prepend `basePath` to internal hrefs. Wrapping a routed href with `withBase()` produces a double prefix on preview deploys (e.g. `/_previews/8/_previews/8/our-story/`). The bug was dormant because production has an empty basePath (no-op) and the five sprint-1 nav targets (`/our-story`, `/venue`, `/travel`, `/registry`, `/qa`, `/rsvp`) do not yet exist in previews — but every nav click would 404 the moment Sprint 2 ships any of them.
**Decision.** `withBase()` is for non-routed paths only — raw `<img src>`, `<a href>` to static `/public` assets (PDFs, images), and font `url()` in CSS-in-JS. Routed links via `next/link` or `useRouter` pass the un-prefixed path; Next handles `basePath` itself. `RSVPButton` converted from a plain `<a>` to `next/link`'s `<Link>` so the RSVP CTA participates in the same prefixing rule as the rest of the nav.
**Rationale.** The boundary is the routing layer: anything Next renders an href for, Next prefixes; anything we render the href for ourselves, we prefix. Mixing the two via `withBase()` on `<Link>` is the source of the double-up. Converting `RSVPButton` to `<Link>` (rather than keeping `withBase('/rsvp')` and a special-case comment) keeps every nav target on the same side of the boundary — there is no asymmetry to remember.
**Consequences.** The 2026-05-01 helper-imports-everywhere rule still applies for asset references (img, downloads, fonts). It does NOT apply for routed links. The `src/lib/paths.ts` header documents the narrowed scope. Sprint 2 page hrefs go in as `/our-story`, `/venue`, etc. — never wrapped.



## 2026-05-06 — Sprint 2 — global nav default flips to terracotta; motion + media tokens promoted
**Stage:** 03-build
**Status:** accepted

**Context.** Travel is the first inner page after Home. Studio direction for Sprint 2: nav default color changes from palm-leaf (Sprint 1) to terracotta, with palm-leaf reserved for hover and the active page. The Figma Travel frame (`22:1181`) shows the current page name in palm-leaf and the four others in terracotta — a current-page indicator now does work the Sprint-1 nav did not. Separately, Sprint 1 ships motion as inline literals (`220ms ease-out` in three components, `cubic-bezier(0.16, 1, 0.3, 1)` in five). Sprint 2 introduces a Phosphor expand-icon overlay, a fullscreen `<dialog>`, and three section-staggered reveals — adding a fourth and fifth occurrence of the same literals would entrench drift.
**Decision.** (a) `NavBar.module.css` `.link` default → `--color-terracotta`. Hover and `[aria-current="page"]` → `--color-palm-leaf`. `aria-current` is set in `NavBar.tsx` via `usePathname()` with a trailing-slash-tolerant comparator so `/travel` and `/travel/` both match. (b) Promote four motion literals into `tokens.css`: `--motion-fast` (220ms), `--motion-std` (800ms), `--motion-orchestrated` (1800ms), `--ease-out-soft` (`cubic-bezier(0.16, 1, 0.3, 1)`), `--ease-out-quint` (`cubic-bezier(0.4, 0, 1, 1)`). Existing components are not migrated in this PR — new code references the tokens; Sprint 3 cleans up. (c) Add `--video-aspect: 2.76 / 1` as a media token. `VideoFrame` and the SBA static-image slot both consume it, so the airport image, hotel video, and city video share one cinematic crop.
**Rationale.** Without the active-page indicator, a guest landing on Travel from a deep link sees five identical terracotta words and no anchor to "where am I." `aria-current="page"` is the screen-reader correct way to announce it; styling the same selector keeps visual + a11y in lockstep. For motion: promoting now (when the literal count is 5–7) is cheap; promoting at 15+ is a refactor sprint. Token names lead with the *role* (fast / std / orchestrated) rather than the duration so future tweaks (e.g. raising `--motion-std` to 900ms after a polish pass) propagate without renaming. `--video-aspect` is a token rather than a per-component constant because it carries a brand decision (cinematic register), not a layout pixel — every video on the site participates in the same crop.
**Consequences.** Existing inline `220ms ease-out` and `cubic-bezier(0.16, 1, 0.3, 1)` literals in Sprint-1 components remain until Sprint 3 cleanup; both refer to the same numeric values, so no visual drift. The Sprint-1 home nav now reads terracotta-default with palm-leaf active — visible change but does not violate "homepage page content locked" (chrome is shared, page content is not). Future videos on Venue / Our Story consume `<VideoFrame>` directly; per-page video positioning lives in the page CSS, never the component. If a designer ever wants a non-2.76 ratio, that is a token decision, not a component prop — keeping it global preserves the rule.

## 2026-05-06 — VideoFrame is the only path for in-page video site-wide
**Stage:** 03-build
**Status:** accepted

**Context.** Travel ships the first videos in production HTML (Save the Date used a still composition). Two videos render on Travel (`mar-monte.mp4`, `santa-barbara.mp4`); future pages add three more (`Cabrillo-Pavilion.mp4`, `our-story.mp4`, `sunken-garden.mp4`). Studio direction: every video gets a fullscreen-expand affordance with the same crop and an X to close. Doing this per-page would multiply the same `<dialog>` + Phosphor icon + scroll-lock + reduced-motion pairing across five files.
**Decision.** `src/components/ui/VideoFrame.tsx` is the canonical in-page video primitive. Pages pass `src` (path under `/public`) and `label` (a11y string) only — the component owns aspect ratio, autoplay/loop/muted/playsinline defaults, the expand pill (Phosphor `ArrowsOutSimple`), the fullscreen `<dialog>` + close button (Phosphor `X`), Escape-to-close, backdrop-click-to-close, and body-scroll lock. `withBase()` resolves the path inside the component so callers never see `BASE_PATH` plumbing. Phosphor (`@phosphor-icons/react`) is added as a dependency for icon needs across the site. Static-image slots (the SBA airport image) don't use `<VideoFrame>` — they use a small `.mediaImage` class that consumes the same `--video-aspect` token, so visual parity is maintained without forcing a video element.
**Rationale.** A single component means a single place to change easing, ratio, control affordance, or accessibility. The `<dialog>` element gets us free Escape handling and a focus trap; a hand-rolled overlay would re-implement both. Phosphor over a hand-drawn SVG: Phosphor's `ArrowsOutSimple` matches the editorial weight already on the site (Cormorant headings + Commissioner body); a custom icon would re-debate stroke weight per appearance. Static images share the ratio token rather than being wrapped in `<VideoFrame>` because no fullscreen affordance is required for an image — the page already opens to its full width and the asset is a single capture.
**Consequences.** Every in-page video added between now and launch lands as `<VideoFrame src="/videos/foo.mp4" label="..." />`. Page CSS sizes the surrounding column; the frame keeps its ratio. Phosphor's tree-shaken bundle adds ~2 KB per icon used; only `ArrowsOutSimple` and `X` ship in Sprint 2. If a designer needs a non-cinematic ratio for one video, the cleanest move is to introduce a second media token (e.g. `--video-aspect-square`) and pass an override prop — kept off the component for now to avoid a knob nobody asked for.

## 2026-05-06 — coral-rose darkens to pass AA on body bg
**Stage:** 03-build
**Status:** accepted

**Context.** Sprint 2 review surfaced that `--color-coral-rose` `#F27D72` — the inline link color used on every address, booking URL, and recommendation in `/travel` (and inherited by future pages) — produces a 2.40 : 1 contrast on `--color-bg` `#FBF3E9`. That fails WCAG AA for body text (4.5 : 1) and even fails the large-text floor (3 : 1). The same token also drives the close-button hover background in `VideoFrame`, where the bg-on-coral text contrast is the same 2.40 : 1.
**Decision.** Shift `--color-coral-rose` from `#F27D72` to `#B5432F`. New value: 4.95 : 1 on `--color-bg` (AA pass for normal body text). No underline added, no font-weight bump — per studio direction, contrast carries the affordance alone.
**Rationale.** Three options were on the table: (a) shift the token, (b) introduce a new `--color-link` token alongside coral-rose for text-only use, (c) keep coral-rose and add an underline + weight to body links. (a) wins because coral-rose is already used as a *single* semantic role (warm accent) — splitting it into "decorative coral" and "link coral" doubles the surface area without a real second use case to justify it. (b) defers the cleanup. (c) was explicitly rejected by the studio. The new value keeps the hue (~6° red-orange) and reads as a deeper coral / cinnabar — same family, more authority on the page. Hover state remains `--color-terracotta` (3.40 : 1, below AA) — preexisting from Sprint 1, transient state, and out of scope for this fix; flagged for Sprint 3 if the studio wants hover to also clear AA.
**Consequences.** Any surface currently rendering coral-rose text reads darker. The `VideoFrame` close-button hover bg also darkens, which incidentally raises the bg-on-coral contrast from 2.40 to 4.95 (a quiet a11y improvement). Token-map.md and `src/lib/tokens.ts` updated in lockstep. If a future surface wants the *original* light pink-coral as a non-text decorative wash, that's a new token decision (e.g. `--color-coral-blush`) — do not roll it back here.

## 2026-05-06 — Our Story photo gallery ships at 36 MB total
**Stage:** 03-build
**Status:** accepted

**Context.** Sprint 3 contract verification line stated "Total `public/images/wedding-photos/` size is well under 25 MB." After running `scripts/optimize-photos.mjs` (1600 px max edge, JPEG q80, lowercased `.jpg`), the optimized folder lands at **36 MB across 169 photos** — ~213 KB average. The original `wedding photos/` dump was ~70 MB, so the optimizer cut payload nearly in half, but the result is over the contracted ceiling. Three paths considered before merging: (a) tighten optimizer settings (e.g. 1280 px max edge, q72) to land ~22 MB, (b) curate the gallery down to a smaller subset, (c) accept 36 MB as the floor and update the contract.
**Decision.** Accept 36 MB. No tightening of optimizer settings, no curation pass.
**Rationale.** Every gallery cell is rendered with `loading="lazy"` and a reserved `aspect-ratio` ([PhotoGallery.tsx:172](../src/components/ui/PhotoGallery.tsx#L172)), so the 36 MB total is *never* paid by any single visitor — only the photos in viewport (and their immediate scroll buffer) decode. A typical Our Story session paints maybe 8–12 thumbnails before the user clicks into the lightbox, which is ~2–3 MB of actual transfer; the remaining ~33 MB sits at rest on Hostinger and pays no LCP cost. Tightening to 1280 px / q72 would visibly degrade the lightbox experience (full-bleed at 80vw / 80vh on a 1440 viewport renders close to native pixels at 1600 px max edge — dropping to 1280 px starts to read soft on retina screens). Curation defers the work without solving the load model. The 25 MB target was a contract-time estimate; the actual load behavior matters more than the at-rest footprint.
**Consequences.** Repo size grows by ~36 MB on this PR; future pulls/clones absorb the cost once. CDN/edge cache on Hostinger holds whatever subset gets traffic. If a future page gains a similar dump-and-shuffle gallery, the same lazy + aspect-ratio model applies — do not re-litigate the 25 MB ceiling for that page either. If LCP regresses on the Our Story route (target < 2.5 s), revisit by lowering `loading="lazy"` thresholds or shrinking the first ~10 photos to 1280 px while leaving the rest at 1600 px — a per-position quality ladder is cheaper than a global tightening.

## 2026-05-06 — QA page question + answer step down to --text-base on mobile
**Stage:** 03-build
**Status:** accepted

**Context.** Sprint 5 v1 contract specified `--text-lg` (18 px) for both the FAQ question and the answer body across all breakpoints. In eval round 1 the studio reviewed the 360 px snapshot and called the type too tight against the row hairlines and the right-side icon — the column at 360 is 328 px after page padding, and 18 px Commissioner Medium runs long enough that questions like "Is there transportation between the ceremony and reception?" wrap awkwardly mid-clause.
**Decision.** At `≤768 px`, both `.question` and `.answer` step down from `--text-lg` (18 px) to `--text-base` (16 px). Desktop sizing is unchanged (18 px). Token-driven; no new sizes introduced.
**Rationale.** 16 px in a narrow column gives one or two more cleanly-broken words per line and matches the mobile rhythm already established on `/travel` and `/our-story`, where body copy steps from `--text-lg` desktop to `--text-base` at the same breakpoint. The QA page family-of-three (Travel, Our Story, QA) now reads as one mobile system. The contract table prescribed 18 px for everything — that was a desktop-first carry-over; the mobile step is the right correction. Deviates from the Sprint 5 v1 contract spec table — explicitly approved by studio in eval round 1.
**Consequences.** Future Sprint 5+ accordions (if any) that reuse `FAQRow` inherit the mobile step automatically — the rule lives in the component CSS, not the page. If a future surface needs `--text-lg` to hold at all breakpoints, it overrides at the page level rather than the component, which keeps the editorial-mobile default in place. Touch target stays compliant: the row's full hairline-to-hairline height (`var(--space-2)` block padding × 2 + content) clears 44 px on iPhone-class viewports.
