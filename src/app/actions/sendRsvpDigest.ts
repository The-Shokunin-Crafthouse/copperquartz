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

function formatDigestDate(d: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

export async function sendRsvpDigest(): Promise<SendRsvpDigestResult> {
  try {
    const supabase = createServiceClient();

    /* Cutoff = last digest's sent_at, or 30 days ago for the very first
       run. We deliberately use exclusive `.gt` so the boundary row is
       never re-sent across consecutive runs. */
    const lastRunRes = await supabase
      .from('digest_runs')
      .select('sent_at')
      .order('sent_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastRunRes.error) {
      console.error('sendRsvpDigest digest_runs select failed:', lastRunRes.error);
      return { sent: false, reason: 'digest_runs_query_error' };
    }

    const cutoff = lastRunRes.data?.sent_at ?? thirtyDaysAgoIso();

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
      subject: `RSVP digest — ${total} new responses · ${formattedDate}`,
      html,
    });

    if (sendRes.error) {
      console.error('sendRsvpDigest resend failed:', sendRes.error);
      return { sent: false, reason: 'resend_error' };
    }

    const insertRes = await supabase.from('digest_runs').insert({
      responses_included: responses.length,
      accommodations_included: accommodations.length,
    });

    if (insertRes.error) {
      /* Email already went out. Skipping the digest_runs row would cause
         the next run to overlap with this one — duplicates over a clean
         miss is the right tradeoff. Log loudly. */
      console.error(
        'sendRsvpDigest digest_runs insert failed AFTER successful send:',
        insertRes.error,
      );
    }

    return { sent: true };
  } catch (err) {
    console.error('sendRsvpDigest threw:', err);
    return { sent: false, reason: 'unexpected_error' };
  }
}
