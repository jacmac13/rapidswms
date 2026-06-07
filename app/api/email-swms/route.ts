import { createClient } from '@/lib/supabase/server';
import { hasFeature } from '@/lib/plan-features';
import type { PlanKey } from '@/lib/plan-features';
import { generatePdf } from '@/lib/pdf';
import type { SwmsDocument } from '@/lib/types';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

const resend = new Resend(process.env.RESEND_API_KEY!);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  if (!hasFeature(subscription?.plan as PlanKey, 'email_swms')) {
    return Response.json({ error: 'Upgrade to Small Crew to email SWMS documents.' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const swmsId = typeof body.swmsId === 'string' ? body.swmsId.trim() : '';
  const toEmail = typeof body.toEmail === 'string' ? body.toEmail.trim() : '';

  if (!swmsId) return Response.json({ error: 'swmsId is required.' }, { status: 400 });
  if (!toEmail) return Response.json({ error: 'toEmail is required.' }, { status: 400 });
  if (!EMAIL_RE.test(toEmail)) {
    return Response.json({ error: 'Invalid email address.' }, { status: 400 });
  }

  // Fetch document — RLS verifies user owns it
  const { data: doc, error: docError } = await supabase
    .from('swms_documents')
    .select('document_number, job_title, trade, state, site_address, swms_json')
    .eq('id', swmsId)
    .eq('user_id', user.id)
    .single();

  if (docError || !doc) {
    return Response.json({ error: 'Document not found.' }, { status: 404 });
  }

  // Get company name from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('business_name')
    .eq('id', user.id)
    .single();

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await generatePdf({
      swms: doc.swms_json as SwmsDocument,
      documentNumber: doc.document_number,
      company: profile?.business_name ?? 'Unknown',
      trade: doc.trade,
      state: doc.state,
      siteAddress: doc.site_address ?? undefined,
    });
  } catch (err) {
    console.error('[email-swms] PDF generation error:', err instanceof Error ? err.message : 'unknown');
    return Response.json({ error: 'Could not generate PDF for email.' }, { status: 500 });
  }

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: [toEmail],
      subject: `Your SWMS: ${doc.job_title}`,
      html: '<p>Please find your Safe Work Method Statement attached. Remember to review before use on site.</p>',
      attachments: [
        {
          filename: `${doc.document_number}.pdf`,
          content: Buffer.from(pdfBuffer),
        },
      ],
    });
  } catch (err) {
    console.error('[email-swms] Resend error:', err instanceof Error ? err.message : 'unknown');
    return Response.json({ error: 'Could not send email. Please try again.' }, { status: 500 });
  }

  return Response.json({ success: true });
}
