'use server';

import { createServiceClient } from '@/src/lib/supabase/server';
import type { Tables } from '@/types/supabase';

export type PartyResult = {
  party: { id: string; party_name: string };
  guests: Array<{
    id: string;
    full_name: string;
    first_name: string;
    existing_rsvp: {
      attending: boolean;
      monday_meetup: boolean | null;
      needs_transport: boolean | null;
      beverage_category: string | null;
      beverage_selection: string | null;
      updated_at: string;
    } | null;
  }>;
  existing_accommodations: {
    notes: string;
    last_edited_by_first_name: string | null;
    updated_at: string;
  } | null;
};

export type LookupError = { error: 'no_match' | 'ambiguous' | 'server_error' };

type GuestLookupRow = Pick<
  Tables<'guests'>,
  'id' | 'party_id' | 'full_name' | 'first_name' | 'last_name' | 'lookup_aliases'
>;

const GUEST_LOOKUP_COLS =
  'id, party_id, full_name, first_name, last_name, lookup_aliases';

export async function lookupParty(
  name: string,
): Promise<PartyResult | LookupError> {
  const trimmed = typeof name === 'string' ? name.trim() : '';
  if (trimmed.length === 0) return { error: 'no_match' };
  const lower = trimmed.toLowerCase();

  try {
    const supabase = createServiceClient();

    /* Step 2a: exact full_name match (case-insensitive). */
    const { data: fullMatchData, error: fullMatchErr } = await supabase
      .from('guests')
      .select(GUEST_LOOKUP_COLS)
      .ilike('full_name', lower);

    if (fullMatchErr) {
      console.error('lookupParty full_name query failed:', fullMatchErr);
      return { error: 'server_error' };
    }

    const fullMatches = (fullMatchData ?? []) as GuestLookupRow[];
    let matched: GuestLookupRow | null = null;

    if (fullMatches.length > 1) return { error: 'ambiguous' };
    if (fullMatches.length === 1) {
      matched = fullMatches[0];
    } else {
      /* Step 2b: first_name OR last_name OR aliases. */
      const [firstRes, lastRes, aliasRes] = await Promise.all([
        supabase
          .from('guests')
          .select(GUEST_LOOKUP_COLS)
          .ilike('first_name', lower),
        supabase
          .from('guests')
          .select(GUEST_LOOKUP_COLS)
          .ilike('last_name', lower),
        supabase
          .from('guests')
          .select(GUEST_LOOKUP_COLS)
          .contains('lookup_aliases', [lower]),
      ]);

      if (firstRes.error || lastRes.error || aliasRes.error) {
        console.error('lookupParty alt-match query failed:', {
          first: firstRes.error,
          last: lastRes.error,
          alias: aliasRes.error,
        });
        return { error: 'server_error' };
      }

      const dedup = new Map<string, GuestLookupRow>();
      for (const row of [
        ...((firstRes.data ?? []) as GuestLookupRow[]),
        ...((lastRes.data ?? []) as GuestLookupRow[]),
        ...((aliasRes.data ?? []) as GuestLookupRow[]),
      ]) {
        dedup.set(row.id, row);
      }

      const candidates = Array.from(dedup.values());
      if (candidates.length === 0) return { error: 'no_match' };
      if (candidates.length > 1) return { error: 'ambiguous' };
      matched = candidates[0];
    }

    const partyId = matched.party_id;

    const [partyRes, guestsRes, responsesRes, accomRes] = await Promise.all([
      supabase
        .from('guest_parties')
        .select('id, party_name')
        .eq('id', partyId)
        .maybeSingle(),
      supabase
        .from('guests')
        .select('id, full_name, first_name, party_id')
        .eq('party_id', partyId),
      supabase
        .from('rsvp_responses')
        .select(
          'guest_id, attending, monday_meetup, needs_transport, beverage_category, beverage_selection, submitted_at, updated_at',
        ),
      supabase
        .from('rsvp_accommodations')
        .select(
          'id, party_id, notes, last_edited_by_guest_id, submitted_at, updated_at',
        )
        .eq('party_id', partyId)
        .maybeSingle(),
    ]);

    if (partyRes.error || guestsRes.error || responsesRes.error || accomRes.error) {
      console.error('lookupParty fetch failed:', {
        party: partyRes.error,
        guests: guestsRes.error,
        responses: responsesRes.error,
        accom: accomRes.error,
      });
      return { error: 'server_error' };
    }

    const partyRow = partyRes.data as Pick<
      Tables<'guest_parties'>,
      'id' | 'party_name'
    > | null;
    if (!partyRow) return { error: 'server_error' };

    const partyGuests = (guestsRes.data ?? []) as Array<
      Pick<Tables<'guests'>, 'id' | 'full_name' | 'first_name' | 'party_id'>
    >;
    const guestIds = new Set(partyGuests.map((g) => g.id));

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
    const allResponses = (responsesRes.data ?? []) as ResponseRow[];
    const responseByGuest = new Map<string, ResponseRow>();
    for (const r of allResponses) {
      if (guestIds.has(r.guest_id)) responseByGuest.set(r.guest_id, r);
    }

    const accomRow = accomRes.data as Pick<
      Tables<'rsvp_accommodations'>,
      'id' | 'party_id' | 'notes' | 'last_edited_by_guest_id' | 'submitted_at' | 'updated_at'
    > | null;
    let existing_accommodations: PartyResult['existing_accommodations'] = null;
    if (accomRow && accomRow.notes !== null && accomRow.notes !== '') {
      const accomTimestamp = accomRow.updated_at ?? accomRow.submitted_at;
      if (accomTimestamp !== null) {
        let editorFirstName: string | null = null;
        if (accomRow.last_edited_by_guest_id) {
          const { data: editorData, error: editorErr } = await supabase
            .from('guests')
            .select('first_name')
            .eq('id', accomRow.last_edited_by_guest_id)
            .maybeSingle();
          if (editorErr) {
            console.error('lookupParty editor fetch failed:', editorErr);
            return { error: 'server_error' };
          }
          const editor = editorData as Pick<
            Tables<'guests'>,
            'first_name'
          > | null;
          editorFirstName = editor?.first_name ?? null;
        }
        existing_accommodations = {
          notes: accomRow.notes,
          last_edited_by_first_name: editorFirstName,
          updated_at: accomTimestamp,
        };
      }
    }

    const guests: PartyResult['guests'] = partyGuests.map((g) => {
      const r = responseByGuest.get(g.id) ?? null;
      const rsvpTimestamp = r ? r.updated_at ?? r.submitted_at : null;
      return {
        id: g.id,
        full_name: g.full_name,
        first_name: g.first_name,
        existing_rsvp:
          r && rsvpTimestamp !== null
            ? {
                attending: r.attending,
                monday_meetup: r.monday_meetup,
                needs_transport: r.needs_transport,
                beverage_category: r.beverage_category,
                beverage_selection: r.beverage_selection,
                updated_at: rsvpTimestamp,
              }
            : null,
      };
    });

    return {
      party: { id: partyRow.id, party_name: partyRow.party_name },
      guests,
      existing_accommodations,
    };
  } catch (err) {
    console.error('lookupParty failed:', err);
    return { error: 'server_error' };
  }
}
