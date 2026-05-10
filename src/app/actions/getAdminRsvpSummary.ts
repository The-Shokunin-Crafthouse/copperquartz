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

export type BeverageBreakdownRow = {
  category: string;
  selection: string | null;
  count: number;
};

export type SpecialRequest = {
  party_name: string;
  notes: string;
  last_edited_by_first_name: string | null;
  updated_at: string;
};

export type AdminRsvpSummary = {
  total_invited: number;
  attending_count: number;
  declining_count: number;
  awaiting_count: number;
  monday_count: number;
  /* Individuals who marked needs_transport — kept for the digest email
     digest so the per-person headcount is preserved alongside the new
     party-level count below. */
  transport_count: number;
  /* Distinct parties with at least one attending member needing transport.
     Drives the Transportation card on the admin dashboard so the number
     reads as "rides to arrange" rather than "seats". */
  transport_party_count: number;
  declining_guests: DecliningGuest[];
  beverage_breakdown: BeverageBreakdownRow[];
  special_requests: SpecialRequest[];
};

export type AdminRsvpSummaryResult =
  | { ok: true; data: AdminRsvpSummary }
  | { ok: false; error: string };

const EMPTY: AdminRsvpSummary = {
  total_invited: 0,
  attending_count: 0,
  declining_count: 0,
  awaiting_count: 0,
  monday_count: 0,
  transport_count: 0,
  transport_party_count: 0,
  declining_guests: [],
  beverage_breakdown: [],
  special_requests: [],
};

type GuestRow = Pick<
  Tables<'guests'>,
  'id' | 'full_name' | 'first_name' | 'party_id'
>;
type ResponseRow = Pick<
  Tables<'rsvp_responses'>,
  | 'guest_id'
  | 'attending'
  | 'updated_at'
  | 'submitted_at'
  | 'monday_meetup'
  | 'needs_transport'
  | 'beverage_category'
  | 'beverage_selection'
>;
type AccommodationRow = Pick<
  Tables<'rsvp_accommodations'>,
  | 'party_id'
  | 'notes'
  | 'updated_at'
  | 'submitted_at'
  | 'last_edited_by_guest_id'
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
      supabase.from('guests').select('id, full_name, first_name, party_id'),
      supabase
        .from('rsvp_responses')
        .select(
          'guest_id, attending, updated_at, submitted_at, monday_meetup, needs_transport, beverage_category, beverage_selection',
        ),
      supabase
        .from('rsvp_accommodations')
        .select(
          'party_id, notes, updated_at, submitted_at, last_edited_by_guest_id',
        ),
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
    const attendingResponses = responses.filter((r) => r.attending);
    const attending_count = attendingResponses.length;
    const declining_count = responses.filter((r) => r.attending === false).length;
    /* Awaiting = invited minus everyone who has answered either way.
       Floored at 0 so a guest list shrunk after responses were collected
       can never produce a negative card value. */
    const awaiting_count = Math.max(
      total_invited - attending_count - declining_count,
      0,
    );
    const monday_count = attendingResponses.filter(
      (r) => r.monday_meetup === true,
    ).length;
    const transport_count = attendingResponses.filter(
      (r) => r.needs_transport === true,
    ).length;
    /* Parties needing a ride. Same filter as transport_count but
       deduped by party_id — one card-readable "X parties need a ride"
       instead of an individual-seat count. */
    const transportPartyIds = new Set<string>();
    for (const r of attendingResponses) {
      if (r.needs_transport !== true) continue;
      const guest = guestById.get(r.guest_id);
      if (!guest) continue;
      transportPartyIds.add(guest.party_id);
    }
    const transport_party_count = transportPartyIds.size;

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

    const beverageBuckets = new Map<string, BeverageBreakdownRow>();
    for (const r of attendingResponses) {
      const category = r.beverage_category;
      if (!category) continue;
      const selection = r.beverage_selection;
      const key = `${category}|${selection ?? ''}`;
      const existing = beverageBuckets.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        beverageBuckets.set(key, { category, selection, count: 1 });
      }
    }
    const beverage_breakdown: BeverageBreakdownRow[] = Array.from(
      beverageBuckets.values(),
    ).sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.category.localeCompare(b.category);
    });

    const special_requests: SpecialRequest[] = accommodations
      .map((a): SpecialRequest | null => {
        const trimmed = a.notes?.trim() ?? '';
        if (!trimmed) return null;
        const updated_at = a.updated_at ?? a.submitted_at;
        if (!updated_at) return null;
        const editor = a.last_edited_by_guest_id
          ? guestById.get(a.last_edited_by_guest_id)
          : undefined;
        return {
          party_name: partyNameById.get(a.party_id) ?? '',
          notes: trimmed,
          last_edited_by_first_name: editor?.first_name ?? null,
          updated_at,
        };
      })
      .filter((r): r is SpecialRequest => r !== null)
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at));

    return {
      ok: true,
      data: {
        total_invited,
        attending_count,
        declining_count,
        awaiting_count,
        monday_count,
        transport_count,
        transport_party_count,
        declining_guests,
        beverage_breakdown,
        special_requests,
      },
    };
  } catch (err) {
    console.error('getAdminRsvpSummary failed:', err);
    return { ok: false, error: 'Could not load RSVP summary.' };
  }
}
