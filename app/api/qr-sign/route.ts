import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { hasFeature } from '@/lib/plan-features';
import type { PlanKey } from '@/lib/plan-features';
import QRCode from 'qrcode';

export const dynamic = 'force-dynamic';

function adminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// POST /api/qr-sign — generate or return existing QR token for a SWMS
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

  if (!hasFeature(subscription?.plan as PlanKey, 'qr_signoff')) {
    return Response.json({ error: 'Upgrade to Business to use QR sign-off.' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const swmsId = typeof body.swmsId === 'string' ? body.swmsId.trim() : '';
  if (!swmsId) return Response.json({ error: 'swmsId is required.' }, { status: 400 });

  // Verify user owns this SWMS and check for existing token
  const { data: swmsDoc, error: docError } = await supabase
    .from('swms_documents')
    .select('id, qr_token')
    .eq('id', swmsId)
    .eq('user_id', user.id)
    .single();

  if (docError || !swmsDoc) {
    return Response.json({ error: 'Document not found.' }, { status: 404 });
  }

  // Return existing token if already set
  let token = typeof swmsDoc.qr_token === 'string' ? swmsDoc.qr_token : null;

  if (!token) {
    token = crypto.randomUUID();
    const admin = adminClient();
    const { error: updateError } = await admin
      .from('swms_documents')
      .update({ qr_token: token })
      .eq('id', swmsId);

    if (updateError) {
      console.error('[qr-sign POST] Token update error:', updateError.message);
      return Response.json({ error: 'Could not create QR token.' }, { status: 500 });
    }
  }

  const signUrl = `${process.env.NEXT_PUBLIC_APP_URL}/sign/${token}`;

  let qrDataUrl: string;
  try {
    qrDataUrl = await QRCode.toDataURL(signUrl, { width: 300 });
  } catch (err) {
    console.error('[qr-sign POST] QR generation error:', err instanceof Error ? err.message : 'unknown');
    return Response.json({ error: 'Could not generate QR code.' }, { status: 500 });
  }

  return Response.json({ token, signUrl, qrDataUrl });
}

// GET /api/qr-sign?swmsId=xxx — list signatures for a SWMS
export async function GET(request: Request) {
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

  if (!hasFeature(subscription?.plan as PlanKey, 'qr_signoff')) {
    return Response.json({ error: 'Upgrade to Business to use QR sign-off.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const swmsId = searchParams.get('swmsId') ?? '';
  if (!swmsId) return Response.json({ error: 'swmsId query param is required.' }, { status: 400 });

  // Verify user owns this SWMS
  const { data: swmsDoc, error: docError } = await supabase
    .from('swms_documents')
    .select('id')
    .eq('id', swmsId)
    .eq('user_id', user.id)
    .single();

  if (docError || !swmsDoc) {
    return Response.json({ error: 'Document not found.' }, { status: 404 });
  }

  const { data: signatures, error: sigError } = await supabase
    .from('qr_signatures')
    .select('id, qr_token, worker_name, worker_role, signed_at')
    .eq('swms_document_id', swmsId)
    .order('signed_at', { ascending: false });

  if (sigError) {
    console.error('[qr-sign GET] DB error:', sigError.message);
    return Response.json({ error: 'Could not fetch signatures.' }, { status: 500 });
  }

  return Response.json({ signatures: signatures ?? [] });
}
