import { createClient } from '@/lib/supabase/server';
import { hasFeature } from '@/lib/plan-features';
import type { PlanKey } from '@/lib/plan-features';

export const dynamic = 'force-dynamic';

export async function GET(
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

  if (!hasFeature(subscription?.plan as PlanKey, 'version_history')) {
    return Response.json({ error: 'Upgrade to Business to access version history.' }, { status: 403 });
  }

  const { id } = await params; // id = swms_document_id
  if (!id) return Response.json({ error: 'Document ID is required.' }, { status: 400 });

  // Verify the user owns the parent SWMS document
  const { data: swmsDoc, error: docError } = await supabase
    .from('swms_documents')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (docError || !swmsDoc) {
    return Response.json({ error: 'Document not found.' }, { status: 404 });
  }

  const { data: versions, error: versionsError } = await supabase
    .from('swms_versions')
    .select('id, swms_document_id, version_number, swms_json, created_at')
    .eq('swms_document_id', id)
    .order('version_number', { ascending: false });

  if (versionsError) {
    console.error('[swms-versions GET] DB error:', versionsError.message);
    return Response.json({ error: 'Could not fetch version history.' }, { status: 500 });
  }

  return Response.json({ versions: versions ?? [] });
}
