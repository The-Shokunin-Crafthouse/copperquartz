export type Fund = 'honeymoon' | 'kiva' | 'howlin-dog';

export type Contribution = {
  id: string;
  name: string;
  email: string;
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
  stripe_session_id: string | null;
  created_at: string;
};
