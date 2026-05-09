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
    const { error: insertError } = await supabase.from('contributions').insert({
      name: params.name.trim(),
      email: params.email.trim(),
      fund: 'howlin-dog',
      amount_cents: amountCents,
      reference_url: null,
      lenders_choice: false,
      self_reported: true,
      stripe_session_id: null,
      message: trimmedMessage ? trimmedMessage : null,
    });

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
