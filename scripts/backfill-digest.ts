/*
 * One-off catch-up digest.
 *
 * The scheduled digest recorded digest_runs rows on accepted-but-undelivered
 * Resend sends from 2026-06-14 onward (see decisions/decisions.md — ADR on
 * verify-before-record). Those responses were never surfaced by email. This
 * replays a single digest covering everything since the last DELIVERED run.
 *
 * DELIVERY IS A PRECONDITION: the Resend account/domain delivery break must be
 * resolved first (a 200 from Resend does NOT mean delivered). Do not run this
 * until a real test digest has been confirmed to land in the inbox.
 *
 * Usage:
 *   SINCE=2026-06-14T13:12:19Z npx tsx scripts/backfill-digest.ts
 *   (defaults to the last delivered run below if SINCE is unset)
 */
import { sendRsvpDigest } from '../src/app/actions/sendRsvpDigest';

// Last digest confirmed delivered to the inbox (Gmail), 2026-06-14 13:12 UTC.
const LAST_DELIVERED_ISO = '2026-06-14T13:12:19Z';

async function main() {
  const since = process.env.SINCE ?? LAST_DELIVERED_ISO;
  console.log(`[backfill-digest] catch-up window: updated_at > ${since}`);
  console.log('[backfill-digest] skipRecord=true (does not touch digest_runs)');

  const result = await sendRsvpDigest({ sinceOverride: since, skipRecord: true });
  console.log('[backfill-digest] result:', result);

  if (!result.sent) {
    console.error('[backfill-digest] NOT sent — reason:', result.reason);
    process.exit(1);
  }
  console.log(
    '[backfill-digest] accepted by Resend. VERIFY it landed in the inbox before declaring done.',
  );
}

main().catch((err) => {
  console.error('[backfill-digest] threw:', err);
  process.exit(1);
});
