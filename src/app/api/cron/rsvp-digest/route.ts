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

  try {
    const result = await sendRsvpDigest();
    const reason = 'reason' in result ? result.reason : undefined;
    return NextResponse.json({ sent: result.sent, reason }, { status: 200 });
  } catch (err) {
    console.error('rsvp-digest cron handler failed:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
