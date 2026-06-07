import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generatePdf } from '@/lib/pdf';
import type { SwmsDocument } from '@/lib/types';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  let body: { swmsId?: string; company?: string };
  try {
    body = await request.json() as { swmsId?: string; company?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!body.swmsId) return NextResponse.json({ error: 'swmsId is required.' }, { status: 400 });

  // Fetch document — RLS ensures user_id matches
  const { data: doc, error } = await supabase
    .from('swms_documents')
    .select('document_number, job_title, trade, state, site_address, swms_json, user_id')
    .eq('id', body.swmsId)
    .eq('user_id', user.id)
    .single();

  if (error || !doc) {
    return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
  }

  // Get company name, logo, and subscription in parallel
  const [{ data: profile }, { data: subscription }] = await Promise.all([
    supabase
      .from('profiles')
      .select('business_name, company_logo_url')
      .eq('id', user.id)
      .single(),
    supabase
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', user.id)
      .single(),
  ]);

  const isBusinessPlan = subscription?.plan === 'business' &&
    (subscription?.status === 'active' || subscription?.status === 'trialing');

  const logoUrl = isBusinessPlan && profile?.company_logo_url
    ? profile.company_logo_url
    : undefined;

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await generatePdf({
      swms: doc.swms_json as SwmsDocument,
      documentNumber: doc.document_number,
      company: body.company?.trim() || profile?.business_name || 'Unknown',
      trade: doc.trade,
      state: doc.state,
      siteAddress: doc.site_address ?? undefined,
      logoUrl,
    });
  } catch (err) {
    console.error('[pdf] generation error:', err);
    return NextResponse.json({ error: 'Could not generate PDF. Please try again.' }, { status: 500 });
  }

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${doc.document_number}.pdf"`,
      'Content-Length': String(pdfBuffer.length),
    },
  });
}
