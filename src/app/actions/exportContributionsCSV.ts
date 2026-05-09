'use server';

import { createServiceClient } from '@/src/lib/supabase/server';
import type { Contribution } from '@/src/app/admin/types';
import { fundLabel } from '@/src/app/admin/format';

const HEADERS = [
  'Name',
  'Email',
  'Fund',
  'Gift Amount (USD)',
  'Total Charged (USD)',
  'Message',
  'Borrower URL',
  'Lenders Choice',
  'Source',
  'Stripe Session ID',
  'Date',
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

function rowToCsv(r: Contribution): string {
  const gift = r.gift_cents ?? r.amount_cents;
  const cells = [
    r.name ?? '',
    r.email ?? '',
    fundLabel(r.fund),
    dollars(gift),
    dollars(r.amount_cents),
    r.message ?? '',
    r.reference_url ?? '',
    r.lenders_choice ? 'Yes' : 'No',
    r.self_reported ? 'Self-reported' : 'Stripe',
    r.stripe_session_id ?? '',
    new Date(r.created_at).toISOString(),
  ];
  return cells.map((c) => escapeCsv(String(c))).join(',');
}

export async function exportContributionsCSV(): Promise<
  { csv: string } | { error: string }
> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('contributions')
      .select(
        'id, name, email, fund, amount_cents, gift_cents, message, reference_url, lenders_choice, self_reported, stripe_session_id, created_at',
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('exportContributionsCSV select failed:', error);
      return { error: 'Could not fetch contributions for export.' };
    }

    const rows = (data ?? []) as Contribution[];
    const lines = [HEADERS.join(','), ...rows.map(rowToCsv)];
    return { csv: lines.join('\r\n') };
  } catch (err) {
    console.error('exportContributionsCSV failed:', err);
    return { error: 'Could not export contributions.' };
  }
}
