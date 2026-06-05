import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { generateSwms, type SwmsInput } from '@/lib/anthropic';

export const maxDuration = 60;

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
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Sign in to generate a SWMS.' }, { status: 401 });
  }

  // Subscription check
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('user_id', user.id)
    .single();

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

  let swmsJson;
  try {
    swmsJson = await generateSwms(input);
  } catch (err) {
    console.error('[generate-swms] Claude API error:', err);
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
