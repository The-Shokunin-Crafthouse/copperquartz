'use server';

import { createElement } from 'react';
import { render } from '@react-email/render';
import { Resend } from 'resend';

import { createServiceClient } from '@/src/lib/supabase/server';
import RsvpDigest, {
  type RsvpDigestAccommodation,
  type RsvpDigestResponse,
} from '@/src/emails/RsvpDigest';
import type { Tables } from '@/types/supabase';

export type SendRsvpDigestResult =
  | { sent: true }
  | { sent: false; reason: string };

const DIGEST_TO = ['levi@levibahn.com', 'meghancave@yahoo.com'];
const DIGEST_FROM = 'rsvp@levibahn.com';
const DIGEST_REPLY_TO = 'levi@levibahn.com';

const DAY_MS = 24 * 60 * 60 * 1000;
const FALLBACK_DAYS = 30;

type ResponseRow = Pick<
  Tables<'rsvp_responses'>,
  | 'guest_id'
  | 'attending'
  | 'monday_meetup'
  | 'needs_transport'
  | 'beverage_category'
  | 'beverage_selection'
  | 'submitted_at'
  | 'updated_at'
>;
type AccommodationRow = Pick<
  Tables<'rsvp_accommodations'>,
  'party_id' | 'notes' | 'last_edited_by_guest_id' | 'updated_at'
>;
type GuestRow = Pick<
  Tables<'guests'>,
  'id' | 'full_name' | 'first_name' | 'party_id'
>;
type PartyRow = Pick<Tables<'guest_parties'>, 'id' | 'party_name'>;

function thirtyDaysAgoIso(): string {
  return new Date(Date.now() - FALLBACK_DAYS * DAY_MS).toISOString();
}

/* Out-of-band failure alert. The digest itself IS email, so a failure can't
   be reported over email — post to an optional webhook (Slack/Discord-style
   incoming webhook URL in DIGEST_ALERT_WEBHOOK) so a broken send is never
   silent again (guardrail for the Jun-2026 silent-rot incident). Always
   best-effort: alerting must never mask the original failure. */
async function alertDigestFailure(code: string, detail: string): Promise<void> {
  const webhook = process.env.DIGEST_ALERT_WEBHOOK;
  if (!webhook) return;
  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        text: `⚠️ RSVP digest failure [${code}]: ${detail}`,
      }),
      signal: AbortSignal.timeout(5000),
    });
  } catch (err) {
    console.error('alertDigestFailure webhook post failed:', err);
  }
}

/* Post-accept delivery verification (studio learnings #45). A 200 + message
   id means Resend ACCEPTED the send, not that it delivered — the exact gap
   that hid the Jun-2026 outage. When a read-capable key is available
   (RESEND_VERIFY_API_KEY, full-access), poll the email's event once after a
   short settle and fail loudly on a terminal non-delivery event. Absent a
   verify key this degrades to accept-only recording with a logged warning. */
const DELIVERY_FAIL_EVENTS = new Set([
  'bounced',
  'failed',
  'complained',
  'canceled',
]);

async function verifyDelivery(messageId: string): Promise<void> {
  const verifyKey = process.env.RESEND_VERIFY_API_KEY;
  if (!verifyKey) {
    console.warn(
      'sendRsvpDigest: RESEND_VERIFY_API_KEY not set — recording on accept only, ' +
        'delivery not confirmed. Set a full-access key to catch silent drops.',
    );
    return;
  }
  const res = await fetch(`https://api.resend.com/emails/${messageId}`, {
    headers: { authorization: `Bearer ${verifyKey}` },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    console.error(
      `sendRsvpDigest verifyDelivery lookup failed: HTTP ${res.status}`,
    );
    return; // don't block recording on a verify-path outage
  }
  const body = (await res.json()) as { last_event?: string };
  const event = body.last_event;
  if (event && DELIVERY_FAIL_EVENTS.has(event)) {
    await alertDigestFailure(
      'resend_delivery_failed',
      `Resend accepted id ${messageId} but last_event=${event}.`,
    );
    throw new Error(`sendRsvpDigest delivery failed: last_event=${event}`);
  }
}

function formatDigestDate(d: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

export interface SendRsvpDigestOptions {
  /* Explicit window start (ISO). Overrides the digest_runs-derived cutoff.
     Used by the one-off catch-up backfill to re-cover a window whose
     digest_runs rows were written on accepted-but-undelivered sends. */
  sinceOverride?: string;
  /* When true, do not write a digest_runs row after a successful send. The
     backfill is a manual replay, not a scheduled boundary — recording it
     would corrupt the automatic cutoff for the next scheduled run. */
  skipRecord?: boolean;
}

export async function sendRsvpDigest(
  opts: SendRsvpDigestOptions = {},
): Promise<SendRsvpDigestResult> {
  try {
    const supabase = createServiceClient();

    /* Cutoff = explicit override, else last digest's sent_at, else 30 days
       ago for the very first run. Exclusive `.gt` so the boundary row is
       never re-sent across consecutive runs. */
    let cutoff: string;
    if (opts.sinceOverride) {
      cutoff = opts.sinceOverride;
    } else {
      const lastRunRes = await supabase
        .from('digest_runs')
        .select('sent_at')
        .order('sent_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastRunRes.error) {
        console.error(
          'sendRsvpDigest digest_runs select failed:',
          lastRunRes.error,
        );
        return { sent: false, reason: 'digest_runs_query_error' };
      }

      cutoff = lastRunRes.data?.sent_at ?? thirtyDaysAgoIso();
    }

    const [responsesRes, accomRes] = await Promise.all([
      supabase
        .from('rsvp_responses')
        .select(
          'guest_id, attending, monday_meetup, needs_transport, beverage_category, beverage_selection, submitted_at, updated_at',
        )
        .gt('updated_at', cutoff)
        .order('updated_at', { ascending: true }),
      supabase
        .from('rsvp_accommodations')
        .select('party_id, notes, last_edited_by_guest_id, updated_at')
        .gt('updated_at', cutoff)
        .not('notes', 'is', null)
        .order('updated_at', { ascending: true }),
    ]);

    if (responsesRes.error || accomRes.error) {
      console.error('sendRsvpDigest window fetch failed:', {
        responses: responsesRes.error,
        accom: accomRes.error,
      });
      return { sent: false, reason: 'window_query_error' };
    }

    const responseRows = (responsesRes.data ?? []) as ResponseRow[];
    const accomRows = (accomRes.data ?? []) as AccommodationRow[];

    if (responseRows.length === 0 && accomRows.length === 0) {
      return { sent: false, reason: 'no_new_rsvps' };
    }

    const guestIdsToLookup = new Set<string>();
    for (const r of responseRows) guestIdsToLookup.add(r.guest_id);
    for (const a of accomRows) {
      if (a.last_edited_by_guest_id) {
        guestIdsToLookup.add(a.last_edited_by_guest_id);
      }
    }

    const guestLookupRes =
      guestIdsToLookup.size > 0
        ? await supabase
            .from('guests')
            .select('id, full_name, first_name, party_id')
            .in('id', Array.from(guestIdsToLookup))
        : { data: [] as GuestRow[], error: null };

    if (guestLookupRes.error) {
      console.error('sendRsvpDigest guests lookup failed:', guestLookupRes.error);
      return { sent: false, reason: 'guest_lookup_error' };
    }

    const guestById = new Map<string, GuestRow>();
    for (const g of (guestLookupRes.data ?? []) as GuestRow[]) {
      guestById.set(g.id, g);
    }

    const partyIdsToLookup = new Set<string>();
    for (const a of accomRows) partyIdsToLookup.add(a.party_id);
    for (const g of guestById.values()) partyIdsToLookup.add(g.party_id);

    const partiesRes =
      partyIdsToLookup.size > 0
        ? await supabase
            .from('guest_parties')
            .select('id, party_name')
            .in('id', Array.from(partyIdsToLookup))
        : { data: [] as PartyRow[], error: null };

    if (partiesRes.error) {
      console.error('sendRsvpDigest parties lookup failed:', partiesRes.error);
      return { sent: false, reason: 'party_lookup_error' };
    }

    const partyNameById = new Map<string, string>();
    for (const p of (partiesRes.data ?? []) as PartyRow[]) {
      partyNameById.set(p.id, p.party_name);
    }

    const responses: RsvpDigestResponse[] = responseRows.flatMap((r) => {
      const guest = guestById.get(r.guest_id);
      const updatedAt = r.updated_at;
      /* The cutoff filter is `updated_at > cutoff`, so updated_at can't
         be null on rows that came back. Skip defensively if the guest
         row vanished — the join is missing data, not a row to render. */
      if (!updatedAt || !guest) return [];
      return [
        {
          guest_id: r.guest_id,
          full_name: guest.full_name,
          party_name: partyNameById.get(guest.party_id) ?? '',
          attending: r.attending,
          monday_meetup: r.monday_meetup,
          needs_transport: r.needs_transport,
          beverage_category: r.beverage_category,
          beverage_selection: r.beverage_selection,
          submitted_at: r.submitted_at ?? updatedAt,
          updated_at: updatedAt,
        },
      ];
    });

    const accommodations: RsvpDigestAccommodation[] = accomRows.flatMap((a) => {
      const updatedAt = a.updated_at;
      if (!updatedAt || a.notes === null) return [];
      const editor = a.last_edited_by_guest_id
        ? guestById.get(a.last_edited_by_guest_id)
        : undefined;
      return [
        {
          party_name: partyNameById.get(a.party_id) ?? '',
          notes: a.notes,
          last_edited_by_first_name: editor?.first_name ?? null,
          updated_at: updatedAt,
        },
      ];
    });

    const total = responses.length;
    const formattedDate = formatDigestDate(new Date());

    const html = await render(
      createElement(RsvpDigest, {
        responses,
        accommodations,
        date: formattedDate,
      }),
    );

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('sendRsvpDigest: RESEND_API_KEY is not set');
      return { sent: false, reason: 'resend_not_configured' };
    }

    const resend = new Resend(apiKey);
    const sendRes = await resend.emails.send({
      to: DIGEST_TO,
      from: DIGEST_FROM,
      replyTo: DIGEST_REPLY_TO,
      subject: `RSVP digest · ${total} new responses · ${formattedDate}`,
      html,
    });

    /* Verify BEFORE recording (studio learnings #45/#46). Two disjoint
       failure modes, handled separately:
         1. sendRes.error present  → Resend rejected the call. A 401/403
            (name === 'restricted_api_key' / 'validation_error', or a 4xx
            statusCode) is an AUTH/PERMISSION failure — bad, rotated, or
            wrong-scope key. Anything else is an API/transport error.
         2. sendRes.error absent but no message id  → response-shape
            failure: the call "succeeded" without an accepted message.
       In every failure case we THROW so the cron route surfaces a non-2xx
       run, and we do NOT write digest_runs — leaving the cutoff unadvanced
       so the next run re-covers this exact window (self-healing backlog).
       Nothing is recorded as sent until Resend confirms acceptance. */
    if (sendRes.error) {
      const err = sendRes.error as { name?: string; message?: string } & {
        statusCode?: number;
      };
      const status = err.statusCode;
      const isAuth =
        status === 401 ||
        status === 403 ||
        err.name === 'restricted_api_key' ||
        err.name === 'missing_api_key';
      const mode = isAuth ? 'auth' : 'api';
      console.error(
        `sendRsvpDigest resend ${mode}-failure:`,
        JSON.stringify(sendRes.error),
      );
      await alertDigestFailure(
        `resend_${mode}_failure`,
        `Resend ${mode} failure: ${err.name ?? 'unknown'} — ${err.message ?? ''}`,
      );
      throw new Error(`sendRsvpDigest resend ${mode} failure: ${err.name}`);
    }

    const messageId = sendRes.data?.id;
    if (!messageId) {
      /* No error object, but Resend returned no accepted message id — a
         response-shape failure distinct from an auth reject (#46). */
      console.error(
        'sendRsvpDigest resend shape-failure: 200 with no message id',
        JSON.stringify(sendRes),
      );
      await alertDigestFailure(
        'resend_shape_failure',
        'Resend returned no message id on a non-error response.',
      );
      throw new Error('sendRsvpDigest resend shape failure: no message id');
    }

    /* Confirm delivery (or at least a non-terminal event) before recording,
       when a verify key is configured. Throws on a bounced/failed event so
       the run surfaces as failed and the cutoff is not advanced. */
    await verifyDelivery(messageId);

    if (opts.skipRecord) {
      console.info(
        `sendRsvpDigest catch-up send accepted (id ${messageId}); digest_runs not recorded (skipRecord).`,
      );
      return { sent: true };
    }

    const insertRes = await supabase.from('digest_runs').insert({
      responses_included: responses.length,
      accommodations_included: accommodations.length,
    });

    if (insertRes.error) {
      /* Email was accepted (we have a message id). Skipping the
         digest_runs row would make the next run re-cover this window and
         duplicate — duplicates over a clean miss is the right tradeoff.
         Log loudly and alert; do not throw (the send already happened). */
      console.error(
        'sendRsvpDigest digest_runs insert failed AFTER accepted send:',
        insertRes.error,
      );
      await alertDigestFailure(
        'digest_runs_insert_failed',
        `Digest sent (id ${messageId}) but digest_runs insert failed: ${insertRes.error.message}`,
      );
    }

    console.info(`sendRsvpDigest accepted by Resend: id ${messageId}`);
    return { sent: true };
  } catch (err) {
    console.error('sendRsvpDigest threw:', err);
    throw err instanceof Error ? err : new Error(String(err));
  }
}
