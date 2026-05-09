import { NextResponse } from 'next/server';
import Stripe from 'stripe';

import { createServiceClient } from '@/src/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getStripe(): Stripe {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error('STRIPE_SECRET_KEY is not set');
  return new Stripe(secret);
}

function parseGiftCents(raw: string | undefined, fallback: number | null): number | null {
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export async function POST(request: Request): Promise<Response> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature';
    return NextResponse.json({ error: `Signature verification failed: ${message}` }, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata ?? {};

      /* Stripe will retry on 5xx — refusing the row but acking with 200
         keeps the queue clean while signaling the gap in our logs. */
      if (!session.customer_email) {
        console.warn(
          `Stripe webhook: session ${session.id} has no customer_email — skipping insert.`,
        );
        return NextResponse.json({ received: true, skipped: 'no-email' }, { status: 200 });
      }

      const referenceUrl = metadata.referenceUrl?.trim();
      const lendersChoice = metadata.lendersChoice === 'true';
      const messageValue = metadata.message?.trim();
      const giftCents = parseGiftCents(metadata.giftAmountCents, session.amount_total);

      const supabase = createServiceClient();
      /* Upsert on stripe_session_id so a retried event from Stripe
         updates the existing row instead of throwing a unique-violation.
         Requires the unique constraint added in migration 002. */
      const { error: insertError } = await supabase
        .from('contributions')
        .upsert(
          {
            name: metadata.name ?? null,
            email: session.customer_email,
            fund: metadata.fund ?? null,
            /* amount_cents is the total charged to the donor's card,
               which may include the optional fee-cover amount. The gift
               the couple actually receives is gift_cents — sourced from
               metadata.giftAmountCents written by createCheckoutSession. */
            amount_cents: session.amount_total,
            gift_cents: giftCents,
            reference_url: referenceUrl ? referenceUrl : null,
            lenders_choice: lendersChoice,
            self_reported: false,
            stripe_session_id: session.id,
            message: messageValue ? messageValue : null,
          },
          { onConflict: 'stripe_session_id' },
        );

      if (insertError) {
        console.error('Stripe webhook upsert failed:', insertError);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error('Stripe webhook handler failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
