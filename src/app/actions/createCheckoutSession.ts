'use server';

import Stripe from 'stripe';
import { chargedCentsCoveringFee } from '@/src/lib/stripe/fees';

export type CheckoutFund = 'honeymoon' | 'kiva';

export type CheckoutParams = {
  name: string;
  email: string;
  amountCents: number;
  coverFee: boolean;
  fund: CheckoutFund;
  referenceUrl?: string;
  lendersChoice?: boolean;
  message?: string;
};

const FUND_DISPLAY_NAME: Record<CheckoutFund, string> = {
  honeymoon: 'Honeymoon Fund',
  kiva: 'Kiva Microloan',
};

const ALLOWED_FUNDS: readonly CheckoutFund[] = ['honeymoon', 'kiva'];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STRIPE_MIN_CENTS = 50;
const MESSAGE_MAX = 450;

function validate(params: CheckoutParams): string | null {
  if (typeof params.name !== 'string' || params.name.trim().length === 0) {
    return 'Please enter your name.';
  }
  if (typeof params.email !== 'string' || !EMAIL_PATTERN.test(params.email.trim())) {
    return 'Please enter a valid email address.';
  }
  if (
    !Number.isInteger(params.amountCents) ||
    params.amountCents < STRIPE_MIN_CENTS
  ) {
    return 'Minimum contribution is $0.50.';
  }
  if (!ALLOWED_FUNDS.includes(params.fund)) {
    return 'Invalid fund.';
  }
  if (typeof params.message === 'string' && params.message.length > MESSAGE_MAX) {
    return `Note must be ${MESSAGE_MAX} characters or fewer.`;
  }
  return null;
}

export async function createCheckoutSession(
  params: CheckoutParams,
): Promise<{ url: string } | { error: string }> {
  const validationError = validate(params);
  if (validationError) return { error: validationError };

  try {
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) throw new Error('STRIPE_SECRET_KEY is not set');

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!siteUrl) throw new Error('NEXT_PUBLIC_SITE_URL is not set');

    const stripe = new Stripe(secret);

    const giftAmountCents = params.amountCents;
    const finalAmountCents = params.coverFee
      ? chargedCentsCoveringFee(giftAmountCents)
      : giftAmountCents;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: params.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: finalAmountCents,
            product_data: { name: FUND_DISPLAY_NAME[params.fund] },
          },
        },
      ],
      metadata: {
        name: params.name,
        fund: params.fund,
        giftAmountCents: String(giftAmountCents),
        referenceUrl: params.referenceUrl ?? '',
        lendersChoice: String(params.lendersChoice ?? false),
        message: params.message ?? '',
      },
      success_url: `${siteUrl}/registry?success=true&fund=${params.fund}`,
      cancel_url: `${siteUrl}/registry`,
    });

    if (!session.url) {
      throw new Error('Stripe did not return a checkout URL');
    }

    return { url: session.url };
  } catch (err) {
    console.error('createCheckoutSession failed:', err);
    return { error: 'Failed to create checkout session' };
  }
}
