export type Fund = 'honeymoon' | 'kiva' | 'howlin-dog';

/* How a gift reached the couple. Mirrors the contributions_source_check
   constraint added in migration 004 — keep the two in lockstep. */
export type ContributionSource = 'stripe' | 'self-reported' | 'cash' | 'check';

/* The subset of ContributionSource an admin can pick when logging a gift that
   never touched Stripe. 'self-reported' is guest-entered, not admin-entered. */
export type OfflineMethod = 'cash' | 'check';

/* A guest party as offered in the admin's party picker — id plus display name,
   never the party's address or guest list. */
export type PartyOption = { id: string; party_name: string };

/* One mailing address per guest party (table party_addresses). Every field is
   nullable: an address may be captured a line at a time. postal_code is text,
   not digits — at least one address is Canadian. */
export type PartyAddress = {
  street: string | null;
  apt: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
};

export type Contribution = {
  id: string;
  name: string;
  /* Null on an offline gift (cash, check, or a self-reported loan) — those are
     logged by an admin who has no email address for the giver. */
  email: string | null;
  fund: Fund;
  /* Total amount charged to the donor's card. Equal to gift_cents
     when the donor declined to cover the Stripe fee, otherwise larger. */
  amount_cents: number;
  /* Amount the couple actually receives (donor's chosen gift). Null on
     legacy rows written before migration 003 — fall back to amount_cents
     in display code. */
  gift_cents: number | null;
  message: string | null;
  reference_url: string | null;
  lenders_choice: boolean;
  self_reported: boolean;
  /* How the gift arrived. NOT NULL in the database, defaulting to 'stripe';
     migration 004 backfilled 'self-reported' from the self_reported flag. */
  source: ContributionSource;
  /* The guest party this gift is credited to, or null when the giver is not on
     the guest list. Set null by the database if the party is ever deleted. */
  party_id: string | null;
  /* Display name of the linked party, joined from guest_parties. Null when
     party_id is null. Not a stored column on contributions. */
  party_name: string | null;
  /* The linked party's mailing address, joined from party_addresses. Null when
     there is no linked party or no address has been recorded for it. */
  address: PartyAddress | null;
  stripe_session_id: string | null;
  created_at: string;
};
