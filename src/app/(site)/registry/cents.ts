/* Client-side checkout helpers shared across the registry modals —
   Stripe fee math, currency formatting, and the email-format check
   (mirrors selfReportContribution.ts so client-side validation and
   server-side validation use the same pattern). */

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

export const STRIPE_PERCENT_FEE = 0.029;
export const STRIPE_FIXED_FEE_CENTS = 30;

const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export function formatCents(cents: number): string {
  return USD.format(cents / 100);
}

/* Whole-dollar values render without `.00` ($100), partial values keep
   two decimals ($103.30). Matches the spec copy example. */
export function formatCentsCompact(cents: number): string {
  if (cents % 100 === 0) return `$${cents / 100}`;
  return USD.format(cents / 100);
}

/* Parse a free-form dollar string into integer cents. Strips $ and
   commas; returns null on anything unparseable or non-positive. */
export function parseDollarsToCents(input: string): number | null {
  const trimmed = input.trim().replace(/[$,]/g, '');
  if (!trimmed) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const cents = Math.round(parseFloat(trimmed) * 100);
  return cents > 0 ? cents : null;
}

/* When the donor covers the fee, the card is charged enough that the
   net (after Stripe takes 2.9% + 30¢) equals the gift amount. */
export function chargedCentsCoveringFee(amountCents: number): number {
  return Math.round((amountCents + STRIPE_FIXED_FEE_CENTS) / (1 - STRIPE_PERCENT_FEE));
}

/* Stripe's fee on a given charged amount (cents in → cents out). */
export function stripeFeeOn(chargedCents: number): number {
  return Math.round(chargedCents * STRIPE_PERCENT_FEE) + STRIPE_FIXED_FEE_CENTS;
}
