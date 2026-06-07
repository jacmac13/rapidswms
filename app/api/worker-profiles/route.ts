import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { hasFeature } from '@/lib/plan-features';
import type { PlanKey } from '@/lib/plan-features';

export const dynamic = 'force-dynamic';

function adminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Sign in required.' }, { status: 401 });

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', user.id)
    .single();

  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing';
  if (!isActive) return Response.json({ error: 'Active subscription required.' }, { status: 402 });

  if (!hasFeature(subscription?.plan as PlanKey, 'worker_profiles')) {
    return Response.json({ error: 'Upgrade to Small Crew to use worker profiles.' }, { status: 403 });
  }

  const { data: profiles, error } = await supabase
    .from('worker_profiles')
    .select('id, name, role, created_at')
    .eq('user_id', user.id)
    .order('name', { ascending: true });

  if (error) {
    console.error('[worker-profiles GET] DB error:', error.message);
    return Response.json({ error: 'Could not fetch worker profiles.' }, { status: 500 });
  }

  return Response.json({ profiles: profiles ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Sign in required.' }, { status: 401 });

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', user.id)
    .single();

  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing';
  if (!isActive) return Response.json({ error: 'Active subscription required.' }, { status: 402 });

  if (!hasFeature(subscription?.plan as PlanKey, 'worker_profiles')) {
    return Response.json({ error: 'Upgrade to Small Crew to use worker profiles.' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const role = typeof body.role === 'string' ? body.role.trim() : '';

  if (!name) return Response.json({ error: 'Worker name is required.' }, { status: 400 });
  if (!role) return Response.json({ error: 'Worker role is required.' }, { status: 400 });

  const admin = adminClient();
  const { data: profile, error: insertError } = await admin
    .from('worker_profiles')
    .insert({ user_id: user.id, name, role })
    .select('id, name, role, created_at')
    .single();

  if (insertError || !profile) {
    console.error('[worker-profiles POST] DB error:', insertError?.message);
    return Response.json({ error: 'Could not save worker profile.' }, { status: 500 });
  }

  return Response.json({ profile }, { status: 201 });
}
