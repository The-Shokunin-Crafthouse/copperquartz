'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

import { createServiceClient } from '@/src/lib/supabase/server';
import { adminAuthDecision } from '@/src/lib/adminAuth';
import type { Fund, OfflineMethod } from '@/src/app/admin/types';

export type AddOfflineGiftInput = {
  partyId: string;
  fund: Fund;
  amountCents: number;
  method: OfflineMethod;
  note?: string;
};

export type AddOfflineGiftResult =
  | { success: true; contributionId: string }
  | { error: string };

const FUNDS: readonly Fund[] = ['honeymoon', 'kiva', 'howlin-dog'];
const METHODS: readonly OfflineMethod[] = ['cash', 'check'];

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const NOTE_MAX = 500;

export async function addOfflineGift(
  input: AddOfflineGiftInput,
): Promise<AddOfflineGiftResult> {
  /* A server action is a POST endpoint reachable from any route, and the
     middleware gate only covers /admin/*. Without this check the write
     path is open to anyone who knows the action id. The gate is re-read
     here rather than trusted from the page render that produced the
     form. */
  const requestHeaders = await headers();
  const decision = adminAuthDecision(requestHeaders.get('authorization'));
  if (decision !== 'ok') {
    console.warn(`addOfflineGift refused: admin auth ${decision}`);
    return { error: 'Not authorized.' };
  }

  const { partyId, fund, amountCents, method } = input;

  if (typeof partyId !== 'string' || !UUID_RE.test(partyId)) {
    return { error: 'Pick a guest party for this gift.' };
  }
  if (!FUNDS.includes(fund)) {
    return { error: 'Pick a fund for this gift.' };
  }
  if (!METHODS.includes(method)) {
    return { error: 'Pick whether this gift arrived as cash or a check.' };
  }
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    return { error: 'Enter a gift amount greater than zero.' };
  }

  const trimmedNote = input.note?.trim() ?? '';
  if (trimmedNote.length > NOTE_MAX) {
    return { error: `Keep the note to ${NOTE_MAX} characters or fewer.` };
  }
  const note = trimmedNote.length > 0 ? trimmedNote : null;

  try {
    const supabase = createServiceClient();

    /* The party has to exist, and its name becomes the row's name: an
       offline gift has no checkout to capture a name from, and reading it
       from the party keeps the export's Party column consistent whether
       the gift is linked or not. */
    const { data: party, error: partyError } = await supabase
      .from('guest_parties')
      .select('id, party_name')
      .eq('id', partyId)
      .maybeSingle();

    if (partyError) {
      console.error('addOfflineGift party lookup failed:', partyError);
      return { error: 'Could not look up that guest party. Please try again.' };
    }
    if (!party) {
      return { error: 'That guest party no longer exists.' };
    }

    const partyName =
      typeof party.party_name === 'string' ? party.party_name : '';
    if (!partyName) {
      return { error: 'That guest party has no name recorded.' };
    }

    const { data: inserted, error: insertError } = await supabase
      .from('contributions')
      .insert({
        name: partyName,
        /* No email: nobody hands over a cash gift with an address for
           the receipt. Migration 004 drops the NOT NULL that used to
           make this impossible. */
        email: null,
        fund,
        /* Nothing was charged, so the gift and the "charge" are the same
           number. Both are written so every reader — including one that
           predates gift_cents — sees the right figure. */
        amount_cents: amountCents,
        gift_cents: amountCents,
        message: note,
        reference_url: null,
        lenders_choice: false,
        /* self_reported is the guest-entered flag. An admin logging a
           cash gift is not a guest self-reporting one; `source` carries
           that distinction now. */
        self_reported: false,
        source: method,
        party_id: partyId,
        stripe_session_id: null,
      })
      .select('id')
      .single();

    if (insertError) {
      /* Never log `note` — it is the giver's own words and may be
         personal. The Postgres error is enough to debug the write. */
      console.error('addOfflineGift insert failed:', insertError);
      return { error: 'Could not record the gift. Please try again.' };
    }

    const contributionId =
      inserted && typeof inserted.id === 'string' ? inserted.id : '';
    if (!contributionId) {
      console.error('addOfflineGift insert returned no id');
      return { error: 'The gift was saved but could not be confirmed.' };
    }

    revalidatePath('/admin');
    return { success: true, contributionId };
  } catch (err) {
    console.error('addOfflineGift failed:', err);
    return { error: 'Could not record the gift. Please try again.' };
  }
}
