import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { generateSwms, type SwmsInput } from '@/lib/anthropic';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

function adminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function generateDocNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `SWMS-${year}-${rand}`;
}

export async function POST(request: Request) {
  console.log('[generate-swms] POST received');

  // Auth check
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user) {
    console.error('[generate-swms] Auth failed:', authError?.message);
    return NextResponse.json({ error: 'Sign in to generate a SWMS.' }, { status: 401 });
  }
  console.log('[generate-swms] Auth OK, user:', user.id);

  // Subscription check
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('user_id', user.id)
    .single();

  console.log('[generate-swms] Subscription:', { status: subscription?.status, error: subError?.message });

  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing';
  if (!isActive) {
    return NextResponse.json(
      { error: 'An active subscription is required. Choose a plan to continue.' },
      { status: 402 }
    );
  }

  // Input validation
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { company, abn, trade, state, site, principal, jobDescription } = body as {
    company?: string;
    abn?: string;
    trade?: string;
    state?: string;
    site?: string;
    principal?: string;
    jobDescription?: string;
  };

  if (!company?.trim()) return NextResponse.json({ error: 'Business name is required.' }, { status: 400 });
  if (!trade?.trim()) return NextResponse.json({ error: 'Trade is required.' }, { status: 400 });
  if (!state?.trim()) return NextResponse.json({ error: 'State/Territory is required.' }, { status: 400 });
  if (!jobDescription?.trim()) return NextResponse.json({ error: 'Job description is required.' }, { status: 400 });
  if (jobDescription.trim().length < 20) {
    return NextResponse.json({ error: 'Job description must be at least 20 characters.' }, { status: 400 });
  }

  // Rate limit: 20 per day
  const admin = adminClient();
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  const { count } = await admin
    .from('swms_documents')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', dayStart.toISOString());

  if ((count ?? 0) >= 20) {
    return NextResponse.json(
      { error: 'You\'ve reached the 20 SWMS daily limit. Try again tomorrow.' },
      { status: 429 }
    );
  }

  // Generate via Claude
  const input: SwmsInput = {
    company: company.trim(),
    abn: abn?.trim(),
    trade: trade.trim(),
    state: state.trim(),
    site: site?.trim(),
    principal: principal?.trim(),
    jobDescription: jobDescription.trim(),
  };

  console.log('[generate-swms] Starting Claude API call', {
    trade: input.trade,
    state: input.state,
    jobDescriptionLength: input.jobDescription.length,
    hasApiKey: !!process.env.ANTHROPIC_API_KEY,
    apiKeyPrefix: process.env.ANTHROPIC_API_KEY?.slice(0, 15),
  });

  let swmsJson;
  try {
    swmsJson = await generateSwms(input);
    console.log('[generate-swms] Claude API call succeeded, jobTitle:', swmsJson.jobTitle);
  } catch (err) {
    const error = err as Error & { status?: number; error?: unknown };
    console.error('[generate-swms] Claude API error:', {
      message: error.message,
      status: error.status,
      errorBody: error.error,
      stack: error.stack?.split('\n').slice(0, 5).join('\n'),
    });
    return NextResponse.json(
      { error: 'Could not generate the SWMS right now. Please try again in a moment.' },
      { status: 500 }
    );
  }

  // Save to database
  const documentNumber = generateDocNumber();
  const { data: saved, error: dbError } = await admin
    .from('swms_documents')
    .insert({
      user_id: user.id,
      document_number: documentNumber,
      job_title: swmsJson.jobTitle,
      trade: trade.trim(),
      state: state.trim(),
      site_address: site?.trim() || null,
      principal_contractor: principal?.trim() || null,
      job_description: jobDescription.trim(),
      swms_json: swmsJson,
    })
    .select('id')
    .single();

  if (dbError || !saved) {
    console.error('[generate-swms] DB save error:', dbError);
    return NextResponse.json(
      { error: 'SWMS generated but could not be saved. Please try again.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ swms: swmsJson, documentId: saved.id, documentNumber });
}
