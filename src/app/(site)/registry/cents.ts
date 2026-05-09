/* Client-side checkout helpers shared across the registry modals —
   currency formatting and the email-format check. Stripe fee math is
   re-exported from the shared module at src/lib/stripe/fees.ts so the
   server-side checkout session and the client-side fee preview cannot
   drift. */

export {
  STRIPE_PERCENT_FEE,
  STRIPE_FIXED_FEE_CENTS,
  chargedCentsCoveringFee,
  stripeFeeOn,
} from '@/src/lib/stripe/fees';

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

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
