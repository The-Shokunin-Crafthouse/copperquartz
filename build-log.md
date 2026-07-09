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
