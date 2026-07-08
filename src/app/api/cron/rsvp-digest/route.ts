import { NextResponse } from 'next/server';

import { sendRsvpDigest } from '@/src/app/actions/sendRsvpDigest';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<Response> {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error('rsvp-digest cron: CRON_SECRET is not set');
    return NextResponse.json(
      { error: 'CRON_SECRET is not configured' },
      { status: 500 },
    );
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  /* Reasons that are a legitimate no-op (not a failure): nothing new to
     send. Every other non-sent reason is a real failure and must surface as
     a non-2xx run so a scheduled failure is never silently green. Send-time
     failures throw inside sendRsvpDigest and are caught below as 500. */
  const BENIGN_REASONS = new Set(['no_new_rsvps']);

  try {
    const result = await sendRsvpDigest();
    if (result.sent) {
      return NextResponse.json({ sent: true }, { status: 200 });
    }
    if (BENIGN_REASONS.has(result.reason)) {
      return NextResponse.json(
        { sent: false, reason: result.reason },
        { status: 200 },
      );
    }
    console.error('rsvp-digest cron: non-sent failure reason:', result.reason);
    return NextResponse.json(
      { sent: false, reason: result.reason },
      { status: 500 },
    );
  } catch (err) {
    console.error('rsvp-digest cron handler failed:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
