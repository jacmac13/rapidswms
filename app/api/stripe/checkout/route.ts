import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, PLANS, type PlanKey } from '@/lib/stripe';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const body = await request.json() as { plan?: string };
  const plan = body.plan as PlanKey;
  if (!plan || !PLANS[plan]) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  // Get or create Stripe customer
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single();

  let customerId = existing?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: PLANS[plan].priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: 7,
      metadata: { supabase_user_id: user.id, plan },
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/generate?checkout=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
  });

  return NextResponse.json({ url: session.url });
}
