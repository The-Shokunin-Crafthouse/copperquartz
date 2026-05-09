/* Stripe processing-fee math — single source of truth. Imported by both
   the client-side checkout modals (for live fee preview) and the
   server-side createCheckoutSession action (for the actual unit_amount
   sent to Stripe). Drift between the two would silently overcharge or
   undercharge donors. */

export const STRIPE_PERCENT_FEE = 0.029;
export const STRIPE_FIXED_FEE_CENTS = 30;

/* When the donor opts to cover the fee, the card is charged enough that
   the net (after Stripe takes 2.9% + 30¢) equals the gift amount the
   couple receives. */
export function chargedCentsCoveringFee(amountCents: number): number {
  return Math.round(
    (amountCents + STRIPE_FIXED_FEE_CENTS) / (1 - STRIPE_PERCENT_FEE),
  );
}

/* Stripe's fee on a given charged amount (cents in → cents out). */
export function stripeFeeOn(chargedCents: number): number {
  return Math.round(chargedCents * STRIPE_PERCENT_FEE) + STRIPE_FIXED_FEE_CENTS;
}
