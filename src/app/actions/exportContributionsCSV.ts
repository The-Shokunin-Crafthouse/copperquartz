'use server';

import { loadContributions } from '@/src/lib/loadContributions';
import type { Contribution } from '@/src/app/admin/types';
import {
  fundLabel,
  formatMailingAddress,
  sourceLabel,
} from '@/src/app/admin/format';
import {
  FUND_ORDER,
  fundTotals,
  giftCents,
  splitLabel,
} from '@/src/lib/contributionTotals';

/* The file the couple opens to write thank-you notes: who gave, to which
   fund, how much, and where to post the card. Email, total charged,
   lender's choice, the Stripe session id and the timestamp are all
   deliberately absent — they answered a reconciliation question that the
   dashboard now answers on screen, and every one of them is a column the
   reader has to skip past. */
const HEADERS = [
  'Party',
  'Contribution Type',
  'Gift Amount',
  'Message',
  'Kiva URL',
  'Mailing Address',
  'Source',
] as const;

function escapeCsv(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function dollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

function toLine(cells: readonly string[]): string {
  return cells.map((c) => escapeCsv(String(c))).join(',');
}

/* guest_parties.party_name is already written as the giver reads it —
   "A & B Surname" for a couple, the single name for one person — so the
   linked party's own name is the display name. A gift from someone not on
   the guest list has no party, and falls back to the name captured at
   checkout. */
function partyCell(r: Contribution): string {
  return r.party_name ?? r.name ?? '';
}

function rowToCsv(r: Contribution): string {
  return toLine([
    partyCell(r),
    fundLabel(r.fund),
    dollars(giftCents(r)),
    r.message ?? '',
    r.reference_url ?? '',
    formatMailingAddress(r.address),
    sourceLabel(r.source),
  ]);
}

export async function exportContributionsCSV(): Promise<
  { csv: string } | { error: string }
> {
  try {
    const result = await loadContributions();
    if (!result.ok) {
      console.error('exportContributionsCSV load failed:', result.error);
      return { error: 'Could not fetch contributions for export.' };
    }

    const { rows } = result;
    /* Same call path as the dashboard cards. The file's totals row and
       the card above it are the same arithmetic, so a discrepancy
       between them is impossible rather than merely unlikely. */
    const totals = fundTotals(rows);

    const lines = [HEADERS.join(','), ...rows.map(rowToCsv)];

    for (const fund of FUND_ORDER) {
      const t = totals[fund];
      lines.push(
        toLine([
          `Total — ${fundLabel(fund)} (${splitLabel(t)})`,
          '',
          dollars(t.totalCents),
          '',
          '',
          '',
          '',
        ]),
      );
    }

    return { csv: lines.join('\r\n') };
  } catch (err) {
    console.error('exportContributionsCSV failed:', err);
    return { error: 'Could not export contributions.' };
  }
}
