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

      const referenceUrl = metadata.referenceUrl?.trim();
      const lendersChoice = metadata.lendersChoice === 'true';
      const messageValue = metadata.message?.trim();

      const supabase = createServiceClient();
      const { error: insertError } = await supabase.from('contributions').insert({
        name: metadata.name ?? null,
        email: session.customer_email,
        fund: metadata.fund ?? null,
        amount_cents: session.amount_total,
        reference_url: referenceUrl ? referenceUrl : null,
        lenders_choice: lendersChoice,
        self_reported: false,
        stripe_session_id: session.id,
        message: messageValue ? messageValue : null,
      });

      if (insertError) {
        console.error('Stripe webhook insert failed:', insertError);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error('Stripe webhook handler failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
