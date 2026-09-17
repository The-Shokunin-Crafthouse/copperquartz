import type { Contribution, Fund } from '@/src/app/admin/types';

/* Pure derivation of the per-fund gift totals. No server imports, no
   environment reads, no `server-only` marker — the admin dashboard is a
   client component and imports this module directly, so the export action
   and the cards are guaranteed to be reading the same arithmetic rather
   than two copies of it that drift.

   Deliberately structural parameter types (Pick<...>) so a caller holding
   a narrower row shape can still use these helpers. */

/* Canonical fund order. Cards, export totals and any future summary read
   left-to-right in this order so the two surfaces never disagree on
   sequence. */
export const FUND_ORDER: readonly Fund[] = ['honeymoon', 'kiva', 'howlin-dog'];

/* The amount the couple actually receives. gift_cents is null on rows
   written before migration 003, where the charge and the gift were the
   same number. */
export function giftCents(
  row: Pick<Contribution, 'gift_cents' | 'amount_cents'>,
): number {
  return row.gift_cents ?? row.amount_cents;
}

/* Cash and check are the two sources that never touched a payment
   processor — the gifts an admin logs by hand. 'self-reported' is a guest
   telling us about an online Kiva loan, so it counts as online. */
export function isOffline(row: Pick<Contribution, 'source'>): boolean {
  return row.source === 'cash' || row.source === 'check';
}

export type FundTotals = {
  fund: Fund;
  totalCents: number;
  count: number;
  onlineCount: number;
  offlineCount: number;
};

function emptyTotals(fund: Fund): FundTotals {
  return { fund, totalCents: 0, count: 0, onlineCount: 0, offlineCount: 0 };
}

/* Sums every source into the fund's total. This replaces the older
   self_reported-filtered sums, which hid a self-reported Kiva loan from
   the Kiva card and would have hidden every cash gift from every card. */
export function fundTotals(rows: Contribution[]): Record<Fund, FundTotals> {
  const totals: Record<Fund, FundTotals> = {
    honeymoon: emptyTotals('honeymoon'),
    kiva: emptyTotals('kiva'),
    'howlin-dog': emptyTotals('howlin-dog'),
  };

  for (const row of rows) {
    const bucket = totals[row.fund];
    /* A fund value the database holds but the union does not know about
       would index to undefined. Skip rather than throw — a dashboard that
       renders three correct cards beats one that 500s. */
    if (!bucket) continue;
    bucket.totalCents += giftCents(row);
    bucket.count += 1;
    if (isOffline(row)) bucket.offlineCount += 1;
    else bucket.onlineCount += 1;
  }

  return totals;
}

/* "12 online · 3 cash/check" — the one-line split shown under a card and
   inside the export's totals row. */
export function splitLabel(t: FundTotals): string {
  return `${t.onlineCount} online · ${t.offlineCount} cash/check`;
}
