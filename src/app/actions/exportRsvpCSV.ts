'use server';

import { createServiceClient } from '@/src/lib/supabase/server';
import type { Tables } from '@/types/supabase';

const HEADERS = [
  'Guest Name',
  'Party',
  'Attending',
  'Monday Meetup',
  'Needs Transport',
  'Beverage Category',
  'Beverage Selection',
  'Accommodation Notes',
  'Responded At',
] as const;

type GuestRow = Pick<
  Tables<'guests'>,
  'id' | 'full_name' | 'party_id'
>;
type ResponseRow = Pick<
  Tables<'rsvp_responses'>,
  | 'guest_id'
  | 'attending'
  | 'monday_meetup'
  | 'needs_transport'
  | 'beverage_category'
  | 'beverage_selection'
  | 'updated_at'
  | 'submitted_at'
>;
type AccommodationRow = Pick<
  Tables<'rsvp_accommodations'>,
  'party_id' | 'notes'
>;
type PartyRow = Pick<Tables<'guest_parties'>, 'id' | 'party_name'>;

function escapeCsv(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function yesNo(value: boolean | null): string {
  if (value === null) return '';
  return value ? 'Yes' : 'No';
}

export async function exportRsvpCSV(): Promise<
  { csv: string } | { error: string }
> {
  try {
    const supabase = createServiceClient();

    const [guestsRes, responsesRes, accomRes, partiesRes] = await Promise.all([
      supabase
        .from('guests')
        .select('id, full_name, party_id')
        .order('full_name', { ascending: true }),
      supabase
        .from('rsvp_responses')
        .select(
          'guest_id, attending, monday_meetup, needs_transport, beverage_category, beverage_selection, updated_at, submitted_at',
        ),
      supabase.from('rsvp_accommodations').select('party_id, notes'),
      supabase.from('guest_parties').select('id, party_name'),
    ]);

    if (
      guestsRes.error ||
      responsesRes.error ||
      accomRes.error ||
      partiesRes.error
    ) {
      console.error('exportRsvpCSV select failed:', {
        guests: guestsRes.error,
        responses: responsesRes.error,
        accom: accomRes.error,
        parties: partiesRes.error,
      });
      return { error: 'Could not fetch RSVPs for export.' };
    }

    const guests = (guestsRes.data ?? []) as GuestRow[];
    const responses = (responsesRes.data ?? []) as ResponseRow[];
    const accommodations = (accomRes.data ?? []) as AccommodationRow[];
    const parties = (partiesRes.data ?? []) as PartyRow[];

    const partyNameById = new Map(parties.map((p) => [p.id, p.party_name]));
    const notesByParty = new Map(
      accommodations.map((a) => [a.party_id, a.notes ?? '']),
    );
    const responseByGuest = new Map(responses.map((r) => [r.guest_id, r]));

    const lines = [HEADERS.join(',')];
    for (const g of guests) {
      const r = responseByGuest.get(g.id) ?? null;
      const respondedRaw = r ? r.updated_at ?? r.submitted_at : null;
      const cells = [
        g.full_name,
        partyNameById.get(g.party_id) ?? '',
        r ? (r.attending ? 'Yes' : 'No') : '',
        r ? yesNo(r.monday_meetup) : '',
        r ? yesNo(r.needs_transport) : '',
        r?.beverage_category ?? '',
        r?.beverage_selection ?? '',
        notesByParty.get(g.party_id) ?? '',
        respondedRaw ? new Date(respondedRaw).toISOString() : '',
      ];
      lines.push(cells.map((c) => escapeCsv(String(c))).join(','));
    }

    return { csv: lines.join('\r\n') };
  } catch (err) {
    console.error('exportRsvpCSV failed:', err);
    return { error: 'Could not export RSVPs.' };
  }
}
