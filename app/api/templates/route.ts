import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { hasFeature } from '@/lib/plan-features';
import type { PlanKey } from '@/lib/plan-features';
import type { SwmsDocument } from '@/lib/types';

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

  if (!hasFeature(subscription?.plan as PlanKey, 'templates')) {
    return Response.json({ error: 'Upgrade to Small Crew to use templates.' }, { status: 403 });
  }

  const { data: templates, error } = await supabase
    .from('swms_templates')
    .select('id, name, trade, swms_json, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[templates GET] DB error:', error.message);
    return Response.json({ error: 'Could not fetch templates.' }, { status: 500 });
  }

  return Response.json({ templates: templates ?? [] });
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

  if (!hasFeature(subscription?.plan as PlanKey, 'templates')) {
    return Response.json({ error: 'Upgrade to Small Crew to use templates.' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const trade = typeof body.trade === 'string' ? body.trade.trim() : '';
  const swmsId = typeof body.swmsId === 'string' ? body.swmsId.trim() : '';

  if (!name) return Response.json({ error: 'Template name is required.' }, { status: 400 });
  if (!trade) return Response.json({ error: 'Trade is required.' }, { status: 400 });
  if (!swmsId) return Response.json({ error: 'swmsId is required.' }, { status: 400 });

  // Fetch the SWMS to get swms_json — RLS verifies ownership
  const { data: swmsDoc, error: swmsError } = await supabase
    .from('swms_documents')
    .select('swms_json')
    .eq('id', swmsId)
    .eq('user_id', user.id)
    .single();

  if (swmsError || !swmsDoc) {
    return Response.json({ error: 'SWMS document not found.' }, { status: 404 });
  }

  const admin = adminClient();
  const { data: template, error: insertError } = await admin
    .from('swms_templates')
    .insert({
      user_id: user.id,
      name,
      trade,
      swms_json: swmsDoc.swms_json as SwmsDocument,
    })
    .select('id, name, trade, swms_json, created_at')
    .single();

  if (insertError || !template) {
    console.error('[templates POST] DB error:', insertError?.message);
    return Response.json({ error: 'Could not save template.' }, { status: 500 });
  }

  return Response.json({ template }, { status: 201 });
}
