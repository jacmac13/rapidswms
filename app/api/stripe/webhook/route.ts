import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';

function adminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function planFromPriceId(priceId: string): 'solo' | 'crew' | 'business' {
  if (priceId === process.env.STRIPE_PRICE_SOLO) return 'solo';
  if (priceId === process.env.STRIPE_PRICE_CREW) return 'crew';
  if (priceId === process.env.STRIPE_PRICE_BUSINESS) return 'business';
  return 'solo';
}

function periodEnd(sub: Stripe.Subscription): string | null {
  const item = sub.items.data[0];
  if (!item) return null;
  return new Date(item.current_period_end * 1000).toISOString();
}

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = adminClient();

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.mode !== 'subscription') return NextResponse.json({ received: true });

    const subId = typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id;
    if (!subId) return NextResponse.json({ received: true });

    const sub = await stripe.subscriptions.retrieve(subId);
    const userId = sub.metadata?.supabase_user_id;
    if (!userId) return NextResponse.json({ received: true });

    const priceId = sub.items.data[0]?.price.id ?? '';

    await supabase.from('subscriptions').upsert({
      user_id: userId,
      stripe_customer_id: typeof session.customer === 'string' ? session.customer : session.customer?.id,
      stripe_subscription_id: sub.id,
      plan: planFromPriceId(priceId),
      status: sub.status,
      trial_ends_at: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
      current_period_end: periodEnd(sub),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  }

  else if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object as Stripe.Subscription;
    const priceId = sub.items.data[0]?.price.id ?? '';

    await supabase.from('subscriptions').update({
      plan: planFromPriceId(priceId),
      status: sub.status,
      trial_ends_at: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
      current_period_end: periodEnd(sub),
      updated_at: new Date().toISOString(),
    }).eq('stripe_subscription_id', sub.id);
  }

  else if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription;
    await supabase.from('subscriptions').update({
      status: 'canceled',
      updated_at: new Date().toISOString(),
    }).eq('stripe_subscription_id', sub.id);
  }

  else if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice;
    // In the 2026 API, subscription ID is accessed via invoice.parent
    const parent = invoice.parent as { type: string; subscription_details?: { subscription: string } } | null;
    const subId = parent?.subscription_details?.subscription;
    if (subId) {
      await supabase.from('subscriptions').update({
        status: 'past_due',
        updated_at: new Date().toISOString(),
      }).eq('stripe_subscription_id', subId);
    }
  }

  return NextResponse.json({ received: true });
}
