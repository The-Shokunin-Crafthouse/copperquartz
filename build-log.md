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

## 2026-09-17 — Admin exports and offline gifts

**Shipped.** PR #63, branch `feat/admin-exports-offline-gifts`. The `/admin`
dashboard gains an Attending tab (positioned before Not Coming); the export button now
exports only the active tab and renders only on Contributions and Attending. The
Contributions export has columns Party / Contribution Type / Gift Amount / Message / Kiva
URL / Mailing Address / Source, plus one totals row per fund with "N online · M cash/check"
breakdown. An Add-gift form (`src/app/admin/AddGiftForm.tsx`) lives behind a disclosure in
the Contributions panel, logging cash or check gifts against a party without a database
console. The three fund cards (Honeymoon, Howlin Dog, Kiva) now sum every contribution
`source` (Stripe, self-reported, cash, check) into their totals, displaying the online/offline
split; previously, each card counted only one source by construction.

**Data.** Migration `supabase/migrations/004_party_link_source_addresses.sql` adds
`contributions.party_id` (nullable FK to `guest_parties`, indexed, `on delete set null`),
`contributions.source` (text, check constraint over `stripe`/`self-reported`/`cash`/`check`,
default `'stripe'`, backfilled from legacy `self_reported` boolean), and drops the `not null`
on `contributions.email`. New table `party_addresses` (one row per party, `party_id` as PK/FK,
RLS enabled with no policies, explicit `grant all … to service_role`). The migration was
applied to production on 2026-09-17 with Levi's approval, and the import ran the same day (43 addresses, 3 gift links). Before it landed, `src/lib/loadContributions.ts`
fell back gracefully on Postgres `42703`/`42P01` (column/table not found) and returns party
and address as null, logging one warning per process. A one-time `scripts/import-party-data.ts`
(dry run by default, `--apply` to execute) links existing contributions and addresses from
reviewed match files in gitignored `secrets/`; it leaves ambiguous matches unlinked and
imports city values exactly as-typed for Levi to correct by hand.

**Verification.** `tsc --noEmit`, `npm run lint`, `next build` all green on the
branch. Real-browser checks against the live database (migration not yet applied): five pills visible and correctly ordered,
export button absent from the DOM on Special Request / Drink Requests / Not Coming tabs,
present on Contributions / Attending, Attending rows match the card's attended-guests count,
focus rings on all eight form controls (party select, fund select, cash/check radios, amount
input, submit button), per-field error messages on submit with empty required fields, zero
horizontal scroll at breakpoints 390 / 1024 / 1280 / 1440. An independent verifier pass ran
on the branch; see PR for the verifier report.

**Decisions.** Three entries dated 2026-09-17 in `decisions/decisions.md`: party-link +
source + address schema with soft-fail loader; one shared fund-totals derivation + the
attending export scope; dashboard Attending tab + Add-gift form + active-tab export.

**Open, not fixed here.** (1) `exportRsvpCSV.ts` has no caller but is kept as the full
historical record. (2) The Contributions table shows no Source column, so a cash gift is
indistinguishable on-screen from a Stripe one; the CSV carries the value. (3) The `sc-hygiene`
drift checker's `raw-color` rule false-positives on token names containing colour words
(`--color-gold`) repo-wide. (4) `exportRsvpCSV.ts` and `exportAttendingCSV.ts` carry duplicate
`escapeCsv`/`yesNo` helpers. No guest names, addresses, emails, or contribution amounts are
logged to stdout.

**Learnings.** Four Tier-1 entries in LEARNINGS.md (`import.meta.dirname` under `tsx`;
read-side vs write-side failure codes when code ships ahead of its migration;
`party_name` is the display name; the drift checker's `raw-color` rule cannot gate this
repo). Tier-2 candidates presented to Levi at sprint close, not yet promoted.
