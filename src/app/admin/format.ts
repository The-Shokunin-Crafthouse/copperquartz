import type { Fund } from './types';

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
