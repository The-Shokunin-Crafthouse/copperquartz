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
