'use server';

import { createServiceClient } from '@/src/lib/supabase/server';
import type { Tables } from '@/types/supabase';

export type ConfirmationData = {
  attending_first_names: string[];
  declining_first_names: string[];
  variant: 'attending' | 'declining';
};

export type ConfirmationError = { error: 'not_found' | 'server_error' };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getConfirmationData(
  partyId: string,
): Promise<ConfirmationData | ConfirmationError> {
  if (typeof partyId !== 'string' || !UUID_RE.test(partyId)) {
    return { error: 'not_found' };
  }

  try {
    const supabase = createServiceClient();

    const { data: guestsData, error: guestsErr } = await supabase
      .from('guests')
      .select('id, first_name, party_id')
      .eq('party_id', partyId);

    if (guestsErr) {
      console.error('getConfirmationData guests fetch failed:', guestsErr);
      return { error: 'server_error' };
    }

    const guests = (guestsData ?? []) as Array<
      Pick<Tables<'guests'>, 'id' | 'first_name' | 'party_id'>
    >;

    if (guests.length === 0) return { error: 'not_found' };

    const guestIds = guests.map((g) => g.id);

    const { data: responsesData, error: responsesErr } = await supabase
      .from('rsvp_responses')
      .select('guest_id, attending')
      .in('guest_id', guestIds);

    if (responsesErr) {
      console.error('getConfirmationData responses fetch failed:', responsesErr);
      return { error: 'server_error' };
    }

    const responses = (responsesData ?? []) as Array<
      Pick<Tables<'rsvp_responses'>, 'guest_id' | 'attending'>
    >;

    if (responses.length === 0) return { error: 'not_found' };

    const responseByGuest = new Map<string, boolean>();
    for (const r of responses) responseByGuest.set(r.guest_id, r.attending);

    const attending_first_names: string[] = [];
    const declining_first_names: string[] = [];
    for (const g of guests) {
      const attending = responseByGuest.get(g.id);
      if (attending === true) attending_first_names.push(g.first_name);
      else if (attending === false) declining_first_names.push(g.first_name);
    }

    const variant: 'attending' | 'declining' =
      attending_first_names.length === 0 && declining_first_names.length > 0
        ? 'declining'
        : 'attending';

    return { attending_first_names, declining_first_names, variant };
  } catch (err) {
    console.error('getConfirmationData failed:', err);
    return { error: 'server_error' };
  }
}
