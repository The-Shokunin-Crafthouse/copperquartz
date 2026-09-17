import type { ContributionSource, Fund, PartyAddress } from './types';

const FUND_LABEL: Record<Fund, string> = {
  honeymoon: 'Honeymoon',
  kiva: 'Kiva',
  'howlin-dog': 'Howlin Dog',
};

export function fundLabel(fund: Fund): string {
  return FUND_LABEL[fund];
}

const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export function formatUsd(amountCents: number): string {
  return USD.format(amountCents / 100);
}

const USD_WHOLE = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export function formatUsdWhole(amountCents: number): string {
  return USD_WHOLE.format(Math.round(amountCents / 100));
}

const DATE_FMT = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});

const TIME_FMT = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return `${DATE_FMT.format(d)} · ${TIME_FMT.format(d)}`;
}

export function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max)}…`;
}

const SOURCE_LABEL: Record<ContributionSource, string> = {
  stripe: 'Stripe',
  'self-reported': 'Self-reported',
  cash: 'Cash',
  check: 'Check',
};

export function sourceLabel(s: ContributionSource): string {
  return SOURCE_LABEL[s];
}

/* One-line mailing address: "street, apt, city, state postal_code, country".
   Every field on party_addresses is nullable because an address can be
   captured a line at a time, so each part is skipped when absent rather
   than rendered as an empty slot with its comma still attached. State and
   postal code share one comma segment, separated by a space, because that
   is how a US or Canadian address is written. Returns '' when nothing is
   known, so a caller can drop it straight into a cell. */
export function formatMailingAddress(a: PartyAddress | null): string {
  if (!a) return '';

  const clean = (v: string | null): string => v?.trim() ?? '';
  const segments: string[] = [];

  const street = clean(a.street);
  if (street) segments.push(street);

  const apt = clean(a.apt);
  if (apt) segments.push(apt);

  const city = clean(a.city);
  if (city) segments.push(city);

  const region = [clean(a.state), clean(a.postal_code)]
    .filter(Boolean)
    .join(' ');
  if (region) segments.push(region);

  const country = clean(a.country);
  if (country) segments.push(country);

  return segments.join(', ');
}
