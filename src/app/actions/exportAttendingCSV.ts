'use server';

import { createServiceClient } from '@/src/lib/supabase/server';
import type { Tables } from '@/types/supabase';

/* The attending-only cut of the RSVP export: the list a caterer, a
   transport coordinator or a seating chart is built from. exportRsvpCSV
   stays as it is — it is the full record, including who declined and the
   accommodation notes, and neither audience wants the other's file. */
const HEADERS = [
  'Guest Name',
  'Party',
  'Monday Meetup',
  'Needs Transport',
  'Beverage Category',
  'Beverage Selection',
  'Responded At',
] as const;

type GuestRow = Pick<Tables<'guests'>, 'id' | 'full_name' | 'party_id'>;
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

export async function exportAttendingCSV(): Promise<
  { csv: string } | { error: string }
> {
  try {
    const supabase = createServiceClient();

    const [guestsRes, responsesRes, partiesRes] = await Promise.all([
      supabase.from('guests').select('id, full_name, party_id'),
      /* Filtered at the database rather than in JS: the file is defined
         by attending = true, so a later reader cannot lose the filter by
         editing the loop. */
      supabase
        .from('rsvp_responses')
        .select(
          'guest_id, attending, monday_meetup, needs_transport, beverage_category, beverage_selection, updated_at, submitted_at',
        )
        .eq('attending', true),
      supabase.from('guest_parties').select('id, party_name'),
    ]);

    if (guestsRes.error || responsesRes.error || partiesRes.error) {
      console.error('exportAttendingCSV select failed:', {
        guests: guestsRes.error,
        responses: responsesRes.error,
        parties: partiesRes.error,
      });
      return { error: 'Could not fetch attending guests for export.' };
    }

    const guests = (guestsRes.data ?? []) as GuestRow[];
    const responses = (responsesRes.data ?? []) as ResponseRow[];
    const parties = (partiesRes.data ?? []) as PartyRow[];

    const partyNameById = new Map(parties.map((p) => [p.id, p.party_name]));
    const guestById = new Map(guests.map((g) => [g.id, g]));

    type Line = {
      partyName: string;
      fullName: string;
      cells: readonly string[];
    };

    const entries: Line[] = [];
    for (const r of responses) {
      const g = guestById.get(r.guest_id);
      /* A response whose guest row is gone has no name and no party to
         file it under. Skip rather than emit a blank line. */
      if (!g) continue;
      const partyName = partyNameById.get(g.party_id) ?? '';
      const respondedRaw = r.updated_at ?? r.submitted_at;
      entries.push({
        partyName,
        fullName: g.full_name,
        cells: [
          g.full_name,
          partyName,
          yesNo(r.monday_meetup),
          yesNo(r.needs_transport),
          r.beverage_category ?? '',
          r.beverage_selection ?? '',
          respondedRaw ? new Date(respondedRaw).toISOString() : '',
        ],
      });
    }

    /* Party first, then guest, so the two halves of a couple sit
       together and the file reads as a list of households. */
    entries.sort((a, b) => {
      const byParty = a.partyName.localeCompare(b.partyName);
      if (byParty !== 0) return byParty;
      return a.fullName.localeCompare(b.fullName);
    });

    const lines = [HEADERS.join(',')];
    for (const e of entries) {
      lines.push(e.cells.map((c) => escapeCsv(String(c))).join(','));
    }

    return { csv: lines.join('\r\n') };
  } catch (err) {
    console.error('exportAttendingCSV failed:', err);
    return { error: 'Could not export attending guests.' };
  }
}
