# BUILD LOG — copper-and-quartz

> Append-only sprint log. One entry per sprint/feature close. Newest at the bottom.
> Per the 2026-06-07 per-repo build-log decision (`studio-memory/decisions/decisions.md`).

---

## 2026-07-08 — RSVP digest: root-caused to Gmail spam; verify-before-record hardening

**What shipped.** Fixed the daily RSVP digest that silently stopped delivering
after 2026-06-14 while `digest_runs` kept recording success. `sendRsvpDigest`
now separates auth / API / response-shape failures, requires a Resend-accepted
message id before writing `digest_runs`, throws on any failure (cron route →
non-2xx, cutoff unadvanced → self-healing backlog), optionally verifies the
delivery event via `RESEND_VERIFY_API_KEY`, and alerts out-of-band via
`DIGEST_ALERT_WEBHOOK`. Added `scripts/backfill-digest.ts`
(`npm run backfill:digest`) with `sinceOverride`/`skipRecord` to replay the
missed window once delivery is restored.

**Diagnosis (final).** Trigger is Vercel cron (`0 13 * * *`), not GH Actions.
**Root cause: Google Workspace marked the digests as spam** for
`levi@levibahn.com` — confirmed via Admin → Email Log Search ("Marked spam",
`0/1 Delivered`). Resend, the `levibahn.com` domain, and the API key were all
healthy; Resend's "Delivered" = Google returned SMTP 250, not inbox landing.
Meghan (Yahoo) received every digest, which localized the loss to the Google
account. Likely trigger: apex `from:` (`rsvp@levibahn.com`) via external SES =
same-domain-spoof signal. **Fixed** with a Gmail `from:rsvp@levibahn.com` →
"Never send it to Spam" filter; post-fix test + 21-response backfill both
verified landing in the inbox with intact bodies. The initial "Resend delivery
break" hypothesis was withdrawn (ADR correction 2026-07-08).

**Learnings.** See LEARNINGS.md + the two ADR entries (2026-07-08 + its
correction) in decisions/decisions.md. Two studio-promotion candidates flagged
(ESP "Delivered" ≠ inbox → trace at receiver; apex-from-via-SES spam trap).

## 2026-09-01 — "The Night Before" (Monday meetup) published to venue, Q&A and travel

**Shipped.** PR #61, merged to main and live on copperquartz.family. A new
`venue-night-before` section leads `/venue` chronologically, ahead of the ceremony and
reception; `/qa` gains one Logistics question linking to that anchor; `/travel`'s Local
Recommendations intro gains one sentence for guests arriving Monday. Verbatim reuse of
the existing venue section composition — no new component, no new CSS, 2.76:1 crop from
`VideoFrame`.

**Media.** The supplied Framer clip opened on 13.9s of red tap-menu boards — reads as an
advert and fights the `#FBF3E9` ground. Trimmed at the scene cut by stream copy (no
re-encode), silent audio track dropped: 25.8s of interior, 11.6 MB → 6.4 MB, now the
lightest video on the site. The supplied photo is the frame's `poster`, so this is the
only section that shows an image rather than an empty box before playback. Neither asset
could be fetched by any tool in the session — both hosts refused by the org egress
allowlist from the cloud container *and* the device VM, and Chrome would not complete a
scripted save — so acquisition was a manual step.

**Verification.** Cloned into the cloud container, `npm ci`, production build, served
locally with Cormorant Garamond and Commissioner self-hosted so the type was truthful:
`/venue`, `/qa` and `/travel` all stay `○ (Static)`; screenshots at 390/768/1024/1440/
1920; anchor navigation from `/qa` lands the heading at the viewport top; focus rings
present on both new links; FAQ markdown parses into the Logistics section with an
internal `next/link` route. CI `verify` green. Post-merge production checked in Chrome —
section order correct, video serving at 6,411,351 bytes, both cross-links resolving.

**Decisions.** `decisions/decisions.md` 2026-09-01 — placement, single-source-of-truth,
poster-over-stacked-photo, and the `maps.google.com/?q=` link-style deviation.

**Open, not fixed here.** (1) `VideoFrame` ignores `prefers-reduced-motion` despite its
own comment claiming otherwise — `autoPlay` is unconditional; affects all five clips.
(2) The expand control is 40×40, below the 44×44 mobile touch minimum; also all five.
Both want their own pass.

**Learnings.** Two Tier-1 entries in LEARNINGS.md (macOS-native `node_modules` vs the
bridge VM; RSVP-only content dying with the RSVP window). No new studio index line — the
git-lock incident was already covered by studio learning #177, which this session
violated; its detail file gained a dated addendum instead.
