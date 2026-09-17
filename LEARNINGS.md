# LEARNINGS — copper-and-quartz

Repo-specific lessons (quirks, gotchas, stack fixes). Append-only; newest at the
bottom. Studio-wide lessons are promoted separately via `sc-learn` (Tier 2).

---

## 2026-07-08 — RSVP digest stopped landing: root cause was Gmail inbound spam, not Resend

The RSVP digest silently stopped landing after 2026-06-14 while `digest_runs`
kept recording success. **Actual root cause: Google Workspace classified the
digests as spam for `levi@levibahn.com`** — confirmed in Admin console → Email
Log Search: recipient disposition = **"Marked spam"**, `0/1 Delivered`. Resend,
the `levibahn.com` domain (DKIM/SPF/DMARC), and the API key were all healthy.
Meghan (`meghancave@yahoo.com`) received every digest — Yahoo didn't spam-flag
it — which is what proved the loss was recipient-side, specific to the Google
account. Likely trigger: mail **from the apex domain** (`rsvp@levibahn.com`)
sent by an **external server** (Amazon SES via Resend) is a same-domain-spoof
signal Google weights heavily; its model tightened ~Jun 14.

**Fix:** a Gmail filter `from:rsvp@levibahn.com` → **"Never send it to Spam"**
(user-level, immediate). Durable fix: send the digest `from:` a subdomain
(e.g. `digest@send.levibahn.com`) instead of the apex, and/or Workspace-admin
allowlist `send.levibahn.com`.

Debugging trail that mattered (each step killed a wrong theory):
- **Resend 200 + id ≠ delivered.** `resend.emails.send()` returns
  `{ data:{id}, error:null }` when Resend *accepts*; delivery is downstream.
  Verify at the destination, never on the 200 (studio #45).
- The **Resend Emails dashboard showed "Delivered"** for every send — because
  Google returned SMTP 250 (accepted). "Delivered" there means accepted by the
  receiving MX, **not** landed in the inbox. Spam-foldering is invisible to the
  sender.
- A **pristine `onboarding@resend.dev` probe** (perfect DKIM/SPF) to the same
  address *also* vanished → ruled out sender domain/reputation, pointed at the
  recipient account.
- **Google Admin → Email Log Search** is the authoritative tracer for
  "accepted by Google, then what?" — it named the disposition ("Marked spam")
  that no user-facing Gmail view showed (the mail wasn't even in the Spam
  folder; Workspace quarantines/purges spam-classified mail).
- Trigger was **Vercel cron** (`vercel.json` `0 13 * * *`), not GH Actions;
  the 13:12→13:44 UTC drift is Vercel cron jitter.

Original swallowed-error hypothesis was **wrong** — the code already checked
`sendRes.error` and recorded on a genuine 200. Hardening still shipped (see
below), but it did not cause and cannot detect this failure.

Hardening shipped alongside (orthogonal to the root cause, still worth keeping):
- **Record only after acceptance; throw on failure.** Separate auth (401/403 /
  `restricted_api_key`), API, and shape (200 w/ no `data.id`) failures (studio
  #46). Not writing `digest_runs` on failure leaves the cutoff unadvanced → the
  next run self-heals the window.
- **Optional post-accept delivery verification** via `RESEND_VERIFY_API_KEY`
  (`GET /emails/{id}`, throw on `bounced/failed/complained/canceled`) + an
  out-of-band `DIGEST_ALERT_WEBHOOK` (email can't report an email outage). Note:
  neither would have caught *this* incident — Resend reports "delivered" the
  moment Google accepts; spam-foldering is downstream and invisible to Resend.

tsx gotcha: the digest renders under Next (automatic JSX runtime) but a bare
`tsx` script hits `ReferenceError: React is not defined` because
`RsvpDigest.tsx` has no `import React` and root `tsconfig` is `jsx: "preserve"`.
Run scripts with `TSX_TSCONFIG_PATH=./tsconfig.scripts.json` (`jsx: "react-jsx"`).
The first backfill send went out with a broken/empty body before this was
caught — always read the *body* of a test send, not just the subject/landing.

_Studio-promotion candidates (flag for `sc-learn` Tier-2):_
1. "A send-API 200 is acceptance, not delivery — and the ESP's 'Delivered'
   badge means the receiving MX returned 250, not that it reached the inbox.
   For a missing-mail bug, trace at the receiving side (Gmail Admin Email Log
   Search / provider logs), not the sender dashboard." Compounding across any
   ESP integration.
2. "Same-domain-from-external-sender (apex `you@yourdomain` sent via SES/Resend)
   is a spam-heuristic trap; send transactional mail from a subdomain." 

---

## 2026-09-01 — This checkout's `node_modules` is macOS-native, so the Cowork bridge VM cannot build it

**Context:** Adding the Monday-meetup section. `tsc --noEmit` and `eslint` both ran
clean from the Cowork device shell, so the toolchain looked healthy. `npm run build`
then sat at the Next.js banner and produced nothing across three attempts, and
`npx tsx` failed outright with *"You installed esbuild for another platform"* —
`@esbuild/darwin-arm64` present, `@esbuild/linux-arm64` needed.

**Lesson:** `node_modules` here was installed on the Mac. The Cowork device shell is
a Linux VM that mounts the same folder, so every pure-JS tool (`tsc`, `eslint`) works
and every package with a native binary (`esbuild`, and therefore `tsx` and parts of
the Next build) does not. Compounding it, a full `next build` cannot finish inside the
device shell's ~120-second per-call ceiling on a FUSE mount, and background processes
do not survive the call. Do not read a clean `tsc` as evidence the build is fine.
Verify builds by cloning into the cloud container and running `npm ci` there (about 30
seconds), or lean on the `verify` job in `.github/workflows/preview-deploy.yml`. Do
**not** run `npm install` against the mounted `node_modules` to "fix" it — that swaps
the Mac's native binaries for Linux ones and breaks local development.

**Trigger:** any Cowork session about to run a build, a test, or a `tsx` script against
this repo through the device bridge; a build that hangs with no output; an esbuild
platform error.

---

## 2026-09-01 — Content that lives only inside the RSVP wizard disappears when the RSVP window closes

**Context:** The Monday meetup at Validation Ale was collected as an RSVP step
(`StepMondayMeetup`) and described nowhere else. Closing the RSVP window (ADR
2026-08-04) removed the wizard *and* the `?confirmation=` receipt, so every guest who
answered "yes" lost the only copy of the time, the address, and the outdoor-seating
note — months before the event they had said yes to.

**Lesson:** the RSVP flow is a collection surface with an expiry date, not a
publication surface. Anything a guest still needs *after* answering — a time, an
address, a what-to-bring — needs a permanent home on `/venue`, `/travel` or `/qa`, with
the RSVP step reading as a shorter echo of it. The `/venue` section pattern (heading →
`.meta` rows → `VideoFrame` → body) already carries exactly that payload, so the home
costs no new component and no new CSS.

**Trigger:** adding any question to the RSVP wizard, or any future flow behind a
deadline; a guest asking about something that was only ever an RSVP question.

---

## 2026-09-17 — `import.meta.dirname` is undefined under this repo's `tsx` scripts

**Context:** `scripts/import-party-data.ts` resolved the repo root with
`import.meta.dirname` and crashed on first run, before parsing anything. `tsx` with
`tsconfig.scripts.json` transpiles to CommonJS here, where `import.meta.dirname` is
`undefined`; `import.meta.url` is populated in both modes.

**Lesson:** resolve script-relative paths with
`dirname(fileURLToPath(import.meta.url))`. The typechecker accepts
`import.meta.dirname` happily; it fails only at runtime.

**Trigger:** any new file under `scripts/` run through `npm run …` / `tsx`; a script
that dies with `undefined` in a `path.join` before doing any work.

---

## 2026-09-17 — Ship code ahead of a migration: the read side and the write side fail differently

**Context:** Migration 004 (party link, `source`, `party_addresses`) was written on the
branch but applied to production later, by hand. The admin loader, the guest-facing
self-report insert and the new add-gift insert all name the new columns.

**Lesson:** on a select, a missing column resolves as Postgres `42703` and a missing
table as `42P01` (studio #85). On an **insert** naming an unknown column, PostgREST
rejects with `PGRST204` ("Could not find the 'x' column … in the schema cache") — a
different code, from the schema cache, not Postgres. `error.code` is not always
populated either way, so match the message too. The pattern that let this branch merge
in either order lives in `src/lib/loadContributions.ts` (legacy-column fallback, warn
once) and `src/app/actions/selfReportContribution.ts` (retry the insert without the
new key; the migration's own `UPDATE` backfills it). Admin-only writes may simply fail
with a plain sentence until the migration lands; guest-facing writes may not.

**Trigger:** a branch that adds a column and code that names it in the same change;
"Could not find the … column … in the schema cache" in a server log.

---

## 2026-09-17 — `guest_parties.party_name` is already the display name

**Context:** The Contributions export needed a Party column reading "both names, or
the single name". Read-only inspection of all 54 parties: no family labels, no
"Guest of"; two-guest parties are `A & B`, one exception is named after one member (a
plus-one), one four-guest party uses `&`.

**Lesson:** use `party_name` directly; do not rebuild it from `guests.full_name`.
`lookup_aliases` holds three aliases in total and is not a matching surface. Matching
free-text names (contributions, envelope names) to parties is judgment work; leave
ambiguous ones unlinked (see the 2026-09-17 decisions entry and
`scripts/import-party-data.ts`).

**Trigger:** any feature that prints or matches a party's name.

---

## 2026-09-17 — The studio drift checker cannot gate this repo's CSS

**Context:** `sc-hygiene` `drift_check` on the branch returned 45 gating `raw-color`
findings on the two changed CSS modules and 308 repo-wide, all matching the colour
words inside token names (`var(--color-gold)`, `--color-brown`, `--color-sand-linen`,
`--color-teal`, `--color-coral-rose`). Zero real hex or px violations.

**Lesson:** until the checker's `raw-color` rule ignores identifiers inside `var()`,
verify token compliance here by hand: `git diff main -- '*.css' | grep -E '#[0-9a-fA-F]{3,8}|[0-9]+px'`
and read the hits (media-query breakpoints and comments are the expected ones).
Treat the checker's repo verdict as advisory on this repo.

**Trigger:** a Gate-3 pass or verifier brief that says "run the drift check".
