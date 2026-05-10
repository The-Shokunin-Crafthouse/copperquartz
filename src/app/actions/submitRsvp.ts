'use server';

import { createServiceClient } from '@/src/lib/supabase/server';
import type { Tables, TablesInsert } from '@/types/supabase';

export type RsvpResponseInput = {
  guest_id: string;
  attending: boolean;
  monday_meetup?: boolean | null;
  needs_transport?: boolean | null;
  beverage_category?: string | null;
  beverage_selection?: string | null;
};

export type RsvpPayload = {
  party_id: string;
  submitter_guest_id: string;
  responses: RsvpResponseInput[];
  accommodation_notes?: string | null;
};

export async function submitRsvp(
  payload: RsvpPayload,
): Promise<{ success: true; partyId: string } | { error: string }> {
  if (
    !payload ||
    typeof payload.party_id !== 'string' ||
    typeof payload.submitter_guest_id !== 'string' ||
    !Array.isArray(payload.responses)
  ) {
    return { error: 'invalid_payload' };
  }

  try {
    const supabase = createServiceClient();

    const { data: partyGuestsData, error: guestsErr } = await supabase
      .from('guests')
      .select('id, party_id')
      .eq('party_id', payload.party_id);

    if (guestsErr) {
      console.error('submitRsvp guests fetch failed:', guestsErr);
      return { error: 'submission_failed' };
    }

    const partyGuests = (partyGuestsData ?? []) as Array<
      Pick<Tables<'guests'>, 'id' | 'party_id'>
    >;

    if (partyGuests.length === 0) {
      console.error('submitRsvp: no guests for party', payload.party_id);
      return { error: 'submission_failed' };
    }

    const partyGuestIds = new Set(partyGuests.map((g) => g.id));

    if (!partyGuestIds.has(payload.submitter_guest_id)) {
      console.error(
        'submitRsvp: submitter not in party',
        payload.submitter_guest_id,
        payload.party_id,
      );
      return { error: 'submission_failed' };
    }

    const responseGuestIds = new Set<string>();
    for (const r of payload.responses) {
      if (typeof r.guest_id !== 'string' || typeof r.attending !== 'boolean') {
        return { error: 'invalid_payload' };
      }
      if (!partyGuestIds.has(r.guest_id)) {
        console.error('submitRsvp: response guest_id not in party', r.guest_id);
        return { error: 'submission_failed' };
      }
      responseGuestIds.add(r.guest_id);
    }

    if (
      payload.responses.length !== partyGuests.length ||
      responseGuestIds.size !== partyGuests.length
    ) {
      console.error(
        'submitRsvp: response coverage mismatch',
        responseGuestIds.size,
        partyGuests.length,
      );
      return { error: 'submission_failed' };
    }

    const now = new Date().toISOString();

    const upsertRows: TablesInsert<'rsvp_responses'>[] = payload.responses.map(
      (r) => {
        if (r.attending) {
          return {
            guest_id: r.guest_id,
            attending: true,
            monday_meetup: r.monday_meetup ?? null,
            needs_transport: r.needs_transport ?? null,
            beverage_category: r.beverage_category ?? null,
            beverage_selection: r.beverage_selection ?? null,
            updated_at: now,
          };
        }
        return {
          guest_id: r.guest_id,
          attending: false,
          monday_meetup: null,
          needs_transport: null,
          beverage_category: null,
          beverage_selection: null,
          updated_at: now,
        };
      },
    );

    const { error: respUpsertErr } = await supabase
      .from('rsvp_responses')
      .upsert(upsertRows, { onConflict: 'guest_id' });

    if (respUpsertErr) {
      console.error('submitRsvp rsvp_responses upsert failed:', respUpsertErr);
      return { error: 'submission_failed' };
    }

    const trimmedNotes = payload.accommodation_notes?.trim() ?? '';
    const notesValue = trimmedNotes.length === 0 ? null : trimmedNotes;

    const accomUpsert: TablesInsert<'rsvp_accommodations'> = {
      party_id: payload.party_id,
      notes: notesValue,
      last_edited_by_guest_id: payload.submitter_guest_id,
      updated_at: now,
    };

    const { error: accomUpsertErr } = await supabase
      .from('rsvp_accommodations')
      .upsert(accomUpsert, { onConflict: 'party_id' });

    if (accomUpsertErr) {
      console.error(
        'submitRsvp rsvp_accommodations upsert failed:',
        accomUpsertErr,
      );
      return { error: 'submission_failed' };
    }

    return { success: true, partyId: payload.party_id };
  } catch (err) {
    console.error('submitRsvp failed:', err);
    return { error: 'submission_failed' };
  }
}
