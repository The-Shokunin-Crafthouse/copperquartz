# LEARNINGS — copper-and-quartz

Repo-specific lessons (quirks, gotchas, stack fixes). Append-only; newest at the
bottom. Studio-wide lessons are promoted separately via `sc-learn` (Tier 2).

---

## 2026-07-08 — A Resend 200 + message id is acceptance, not delivery

The RSVP digest silently stopped landing after 2026-06-14 while `digest_runs`
kept recording success. Root: `resend.emails.send()` returns
`{ data: { id }, error: null }` (HTTP 200) when Resend *accepts* a send — this
does **not** mean the mail was delivered. A post-acceptance drop (account/domain
status, bounce, suppression) still returns a clean 200 + id. The old code
recorded the run on `!sendRes.error`, so accepted-but-undelivered sends advanced
the cutoff over responses no one saw.

- **Diagnose at the destination, never the sender's 200.** Confirmed via Gmail
  `in:anywhere` (both recipients) + two live probe sends that returned 200 + id
  and never arrived. This is studio learning #45 in email form.
- **Three disjoint failure modes on a send** (studio #46): auth/permission
  reject (401/403 / `restricted_api_key`), generic API error, and shape failure
  (200 with no `data.id`). Handle and log them separately.
- **Record only after acceptance; throw on failure.** Not writing `digest_runs`
  on failure leaves the cutoff unadvanced, so the next scheduled run re-covers
  the window — a self-healing backlog instead of lost data.
- **A send-only Resend key can't introspect delivery.** `GET /domains` and
  `GET /emails/{id}` 401 with a restricted key (`This API key is restricted to
  only send emails`). Real delivery verification needs a full-access key
  (`RESEND_VERIFY_API_KEY`) or a Resend webhook.
- **Trigger was Vercel cron, not GH Actions.** `vercel.json` `crons` `0 13 * * *`;
  the 13:12→13:44 UTC drift is Vercel cron jitter, not an Actions schedule. Only
  `preview-deploy.yml` exists under `.github/workflows/`.
- **Alert out-of-band.** The digest *is* email, so a failure can't be reported
  over email — post to `DIGEST_ALERT_WEBHOOK` (Slack/Discord-style).

_Studio-promotion candidate:_ "A send-API 200 is acceptance, not delivery —
record/verify against a delivery event, not the send response." Passes the
compounding test (any Resend/SES/Postmark/Twilio integration). Flag for
`sc-learn` Tier-2 review.
