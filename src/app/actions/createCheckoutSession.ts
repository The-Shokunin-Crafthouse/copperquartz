'use server';

import Stripe from 'stripe';

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

const STRIPE_PERCENT_FEE = 0.029;
const STRIPE_FIXED_FEE_CENTS = 30;

function calculateFinalAmountCents(amountCents: number, coverFee: boolean): number {
  if (!coverFee) return amountCents;
  return Math.round((amountCents + STRIPE_FIXED_FEE_CENTS) / (1 - STRIPE_PERCENT_FEE));
}

export async function createCheckoutSession(
  params: CheckoutParams,
): Promise<{ url: string } | { error: string }> {
  try {
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) throw new Error('STRIPE_SECRET_KEY is not set');

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!siteUrl) throw new Error('NEXT_PUBLIC_SITE_URL is not set');

    const stripe = new Stripe(secret);

    const finalAmountCents = calculateFinalAmountCents(params.amountCents, params.coverFee);

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
        referenceUrl: params.referenceUrl ?? '',
        lendersChoice: String(params.lendersChoice ?? false),
      },
      success_url: `${siteUrl}/registry?success=true`,
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
