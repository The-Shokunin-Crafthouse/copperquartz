'use server';

import { createServiceClient } from '@/src/lib/supabase/server';
import type { Tables } from '@/types/supabase';

export type DecliningGuest = {
  guest_id: string;
  full_name: string;
  party_name: string;
  accommodation_notes: string | null;
  responded_at: string;
};

export type AdminRsvpSummary = {
  total_invited: number;
  attending_count: number;
  declining_guests: DecliningGuest[];
};

export type AdminRsvpSummaryResult =
  | { ok: true; data: AdminRsvpSummary }
  | { ok: false; error: string };

const EMPTY: AdminRsvpSummary = {
  total_invited: 0,
  attending_count: 0,
  declining_guests: [],
};

type GuestRow = Pick<Tables<'guests'>, 'id' | 'full_name' | 'party_id'>;
type ResponseRow = Pick<
  Tables<'rsvp_responses'>,
  'guest_id' | 'attending' | 'updated_at' | 'submitted_at'
>;
type AccommodationRow = Pick<
  Tables<'rsvp_accommodations'>,
  'party_id' | 'notes'
>;
type PartyRow = Pick<Tables<'guest_parties'>, 'id' | 'party_name'>;

export async function getAdminRsvpSummary(): Promise<AdminRsvpSummaryResult> {
  /* Match fetchContributions: render a clean empty state when Supabase
     env vars are absent (preview deploys, snapshot harness). */
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: true, data: EMPTY };
  }

  try {
    const supabase = createServiceClient();

    const [guestsRes, responsesRes, accomRes, partiesRes] = await Promise.all([
      supabase.from('guests').select('id, full_name, party_id'),
      supabase
        .from('rsvp_responses')
        .select('guest_id, attending, updated_at, submitted_at'),
      supabase.from('rsvp_accommodations').select('party_id, notes'),
      supabase.from('guest_parties').select('id, party_name'),
    ]);

    if (
      guestsRes.error ||
      responsesRes.error ||
      accomRes.error ||
      partiesRes.error
    ) {
      console.error('getAdminRsvpSummary fetch failed:', {
        guests: guestsRes.error,
        responses: responsesRes.error,
        accom: accomRes.error,
        parties: partiesRes.error,
      });
      return { ok: false, error: 'Could not load RSVP summary.' };
    }

    const guests = (guestsRes.data ?? []) as GuestRow[];
    const responses = (responsesRes.data ?? []) as ResponseRow[];
    const accommodations = (accomRes.data ?? []) as AccommodationRow[];
    const parties = (partiesRes.data ?? []) as PartyRow[];

    const partyNameById = new Map(parties.map((p) => [p.id, p.party_name]));
    const notesByParty = new Map(
      accommodations.map((a) => [a.party_id, a.notes]),
    );
    const guestById = new Map(guests.map((g) => [g.id, g]));

    const total_invited = guests.length;
    const attending_count = responses.filter((r) => r.attending).length;

    const declining_guests: DecliningGuest[] = responses
      .filter((r) => !r.attending)
      .map((r): DecliningGuest | null => {
        const guest = guestById.get(r.guest_id);
        if (!guest) return null;
        const responded_at = r.updated_at ?? r.submitted_at;
        if (!responded_at) return null;
        return {
          guest_id: guest.id,
          full_name: guest.full_name,
          party_name: partyNameById.get(guest.party_id) ?? '',
          accommodation_notes: notesByParty.get(guest.party_id) ?? null,
          responded_at,
        };
      })
      .filter((g): g is DecliningGuest => g !== null)
      .sort((a, b) => b.responded_at.localeCompare(a.responded_at));

    return {
      ok: true,
      data: { total_invited, attending_count, declining_guests },
    };
  } catch (err) {
    console.error('getAdminRsvpSummary failed:', err);
    return { ok: false, error: 'Could not load RSVP summary.' };
  }
}
