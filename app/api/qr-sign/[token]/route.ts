import { createClient as createAdminClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Public endpoint — no auth required.

function adminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET /api/qr-sign/[token] — return basic doc info for the sign page
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!token) return Response.json({ error: 'Token is required.' }, { status: 400 });

  const admin = adminClient();
  const { data: doc, error } = await admin
    .from('swms_documents')
    .select('job_title, document_number, trade, state')
    .eq('qr_token', token)
    .single();

  if (error || !doc) {
    return Response.json({ error: 'Invalid or expired sign-off link.' }, { status: 404 });
  }

  return Response.json({
    jobTitle: doc.job_title,
    documentNumber: doc.document_number,
    trade: doc.trade,
    state: doc.state,
  });
}

// POST /api/qr-sign/[token] — worker submits their signature
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!token) return Response.json({ error: 'Token is required.' }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const workerName = typeof body.workerName === 'string' ? body.workerName.trim() : '';
  const workerRole = typeof body.workerRole === 'string' ? body.workerRole.trim() : null;

  if (!workerName) {
    return Response.json({ error: 'Worker name is required.' }, { status: 400 });
  }

  const admin = adminClient();

  // Fetch the SWMS by token to get document ID
  const { data: doc, error: docError } = await admin
    .from('swms_documents')
    .select('id')
    .eq('qr_token', token)
    .single();

  if (docError || !doc) {
    return Response.json({ error: 'Invalid or expired sign-off link.' }, { status: 404 });
  }

  const { error: insertError } = await admin
    .from('qr_signatures')
    .insert({
      swms_document_id: doc.id,
      qr_token: token,
      worker_name: workerName,
      worker_role: workerRole ?? null,
    });

  if (insertError) {
    console.error('[qr-sign token POST] Insert error:', insertError.message);
    return Response.json({ error: 'Could not record signature. Please try again.' }, { status: 500 });
  }

  return Response.json({ success: true });
}
