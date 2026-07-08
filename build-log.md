# BUILD LOG — copper-and-quartz

> Append-only sprint log. One entry per sprint/feature close. Newest at the bottom.
> Per the 2026-06-07 per-repo build-log decision (`studio-memory/decisions/decisions.md`).

---

_No entries yet._
## 2026-07-08 — RSVP digest: verify-before-record + silent-rot guardrail

**What shipped.** Fixed the daily RSVP digest that silently stopped delivering
after 2026-06-14 while `digest_runs` kept recording success. `sendRsvpDigest`
now separates auth / API / response-shape failures, requires a Resend-accepted
message id before writing `digest_runs`, throws on any failure (cron route →
non-2xx, cutoff unadvanced → self-healing backlog), optionally verifies the
delivery event via `RESEND_VERIFY_API_KEY`, and alerts out-of-band via
`DIGEST_ALERT_WEBHOOK`. Added `scripts/backfill-digest.ts`
(`npm run backfill:digest`) with `sinceOverride`/`skipRecord` to replay the
missed window once delivery is restored.

**Diagnosis.** Trigger is Vercel cron (`0 13 * * *`), not GH Actions. Resend
accepts sends (HTTP 200 + id) but delivers nothing — verified at destination
(Gmail, both recipients) and via two live probe sends. Send-only API key is
valid; DNS records (DKIM `resend._domainkey`, `send.` SPF+MX, DMARC) present.
The delivery break is Resend account/domain-status level — needs dashboard /
full-access key to resolve; live-send steps (test + backfill) blocked on it.

**Learnings.** See LEARNINGS.md (Resend 200 ≠ delivery) + ADR 2026-07-08 in
decisions/decisions.md. One studio-promotion candidate flagged.
