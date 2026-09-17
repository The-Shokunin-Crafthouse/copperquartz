'use server';

import { createServiceClient } from '@/src/lib/supabase/server';

export type SelfReportFund = 'howlin-dog';

export type SelfReportParams = {
  name: string;
  email: string;
  fund: SelfReportFund;
  amountCents?: number | null;
  message?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* PostgREST rejects an insert naming a column it cannot find in the
   schema cache with PGRST204; Postgres itself reports an undefined column
   as 42703. Neither code is always populated, so the message is matched
   too — same detection idea as src/lib/loadContributions.ts, which reads
   the other side of this column. */
function isMissingSourceColumn(error: {
  code?: string | null;
  message?: string | null;
}): boolean {
  if (error.code === 'PGRST204' || error.code === '42703') return true;
  const message = error.message ?? '';
  return /source/i.test(message) && /column/i.test(message);
}

/* Warn once per process, not once per guest. */
let warnedNoSourceColumn = false;

export async function selfReportContribution(
  params: SelfReportParams,
): Promise<{ success: true } | { error: string }> {
  if (typeof params.name !== 'string' || params.name.trim().length === 0) {
    return { error: 'Name is required' };
  }
  if (typeof params.email !== 'string' || !EMAIL_PATTERN.test(params.email.trim())) {
    return { error: 'A valid email is required' };
  }
  if (params.fund !== 'howlin-dog') {
    return { error: 'Invalid fund' };
  }
  let amountCents = 0;
  if (params.amountCents != null) {
    if (!Number.isInteger(params.amountCents) || params.amountCents < 0) {
      return { error: 'Amount must be a non-negative whole number of cents' };
    }
    amountCents = params.amountCents;
  }

  const trimmedMessage = params.message?.trim();

  try {
    const supabase = createServiceClient();

    /* The row as it should be written once migration 004 has landed. */
    const row = {
      name: params.name.trim(),
      email: params.email.trim(),
      fund: 'howlin-dog',
      amount_cents: amountCents,
      reference_url: null,
      lenders_choice: false,
      self_reported: true,
      stripe_session_id: null,
      message: trimmedMessage ? trimmedMessage : null,
    };

    let { error: insertError } = await supabase
      .from('contributions')
      .insert({ ...row, source: 'self-reported' });

    /* This is a guest-facing path and it ships ahead of the migration
       that adds contributions.source. Retry once without the column so a
       donation is never lost to a schema the database has not caught up
       to yet. self_reported is still written, and 004's own UPDATE
       backfills source from it — so the retried row ends up identical to
       one written after the migration. Post-migration the first attempt
       succeeds and this branch never runs. */
    if (insertError && isMissingSourceColumn(insertError)) {
      if (!warnedNoSourceColumn) {
        warnedNoSourceColumn = true;
        console.warn(
          'selfReportContribution: migration 004 is not applied (contributions.source missing). Writing the row without it; the migration backfills source from self_reported.',
        );
      }
      ({ error: insertError } = await supabase
        .from('contributions')
        .insert(row));
    }

    if (insertError) {
      console.error('selfReportContribution insert failed:', insertError);
      return { error: 'Could not record contribution. Please try again.' };
    }

    return { success: true };
  } catch (err) {
    console.error('selfReportContribution failed:', err);
    return { error: 'Could not record contribution. Please try again.' };
  }
}
