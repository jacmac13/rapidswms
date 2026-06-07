import { createClient } from '@/lib/supabase/server';
import { hasFeature } from '@/lib/plan-features';
import type { PlanKey } from '@/lib/plan-features';

export const dynamic = 'force-dynamic';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;
  if (!id) return Response.json({ error: 'Profile ID is required.' }, { status: 400 });

  // RLS ensures user_id matches; also add explicit eq for defence-in-depth
  const { error } = await supabase
    .from('worker_profiles')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('[worker-profiles DELETE] DB error:', error.message);
    return Response.json({ error: 'Could not delete worker profile.' }, { status: 500 });
  }

  return Response.json({ success: true });
}
