import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import {
  anthropicClient,
  SWMS_SYSTEM_PROMPT,
  buildUserMessage,
  parseSwmsJson,
  type SwmsInput,
} from '@/lib/anthropic';

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

function encode(event: string, data: unknown): Uint8Array {
  return new TextEncoder().encode(
    `data: ${JSON.stringify({ event, data })}\n\n`
  );
}

export async function POST(request: Request) {
  // Auth check
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user) {
    console.error('[generate-swms] Auth failed:', authError?.message);
    return Response.json({ error: 'Sign in to generate a SWMS.' }, { status: 401 });
  }

  // Subscription check
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('user_id', user.id)
    .single();

  console.log('[generate-swms] Subscription:', { status: subscription?.status, error: subError?.message });

  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing';
  if (!isActive) {
    return Response.json(
      { error: 'An active subscription is required. Choose a plan to continue.' },
      { status: 402 }
    );
  }

  // Input validation
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { company, abn, trade, state, site, principal, jobDescription } = body as {
    company?: string; abn?: string; trade?: string; state?: string;
    site?: string; principal?: string; jobDescription?: string;
  };

  if (!company?.trim()) return Response.json({ error: 'Business name is required.' }, { status: 400 });
  if (!trade?.trim()) return Response.json({ error: 'Trade is required.' }, { status: 400 });
  if (!state?.trim()) return Response.json({ error: 'State/Territory is required.' }, { status: 400 });
  if (!jobDescription?.trim()) return Response.json({ error: 'Job description is required.' }, { status: 400 });
  if (jobDescription.trim().length < 20) {
    return Response.json({ error: 'Job description must be at least 20 characters.' }, { status: 400 });
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
    return Response.json(
      { error: "You've reached the 20 SWMS daily limit. Try again tomorrow." },
      { status: 429 }
    );
  }

  const input: SwmsInput = {
    company: company.trim(),
    abn: abn?.trim(),
    trade: trade.trim(),
    state: state.trim(),
    site: site?.trim(),
    principal: principal?.trim(),
    jobDescription: jobDescription.trim(),
  };

  // Return a streaming SSE response — keeps the connection alive while
  // Claude generates, preventing Vercel's 10s idle timeout.
  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(encode('progress', { step: 'Reading job description…' }));

        let fullText = '';
        const anthropicStream = anthropicClient.messages.stream({
          model: 'claude-sonnet-4-5',
          max_tokens: 2500,
          system: SWMS_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: buildUserMessage(input) }],
        });

        // Send a heartbeat every 5s so Vercel doesn't close an idle connection
        let stepIndex = 0;
        const STEPS = [
          'Identifying hazards…',
          'Applying controls…',
          'Rating risks…',
          'Compiling document…',
        ];
        const heartbeat = setInterval(() => {
          if (stepIndex < STEPS.length) {
            controller.enqueue(encode('progress', { step: STEPS[stepIndex++] }));
          }
        }, 5000);

        for await (const chunk of anthropicStream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            fullText += chunk.delta.text;
          }
        }

        clearInterval(heartbeat);

        console.log('[generate-swms] Raw Claude output (first 500 chars):', fullText.slice(0, 500));
        console.log('[generate-swms] Output length:', fullText.length, 'chars');

        const swmsJson = parseSwmsJson(fullText);
        console.log('[generate-swms] Parsed OK, jobTitle:', swmsJson.jobTitle);

        // Save to database
        const documentNumber = generateDocNumber();
        const { data: saved, error: dbError } = await admin
          .from('swms_documents')
          .insert({
            user_id: user.id,
            document_number: documentNumber,
            job_title: swmsJson.jobTitle,
            trade: input.trade,
            state: input.state,
            site_address: input.site || null,
            principal_contractor: input.principal || null,
            job_description: input.jobDescription,
            swms_json: swmsJson,
          })
          .select('id')
          .single();

        if (dbError || !saved) {
          console.error('[generate-swms] DB save error:', dbError);
          controller.enqueue(encode('error', { message: 'SWMS generated but could not be saved. Please try again.' }));
          controller.close();
          return;
        }

        controller.enqueue(encode('complete', {
          swms: swmsJson,
          documentId: saved.id,
          documentNumber,
        }));
      } catch (err) {
        const error = err as Error & { status?: number; error?: unknown };
        console.error('[generate-swms] CAUGHT ERROR:', {
          name: error.name,
          message: error.message,
          status: error.status,
          errorBody: JSON.stringify(error.error),
          stack: error.stack?.split('\n').slice(0, 4).join(' | '),
        });
        controller.enqueue(encode('error', { message: 'Could not generate the SWMS right now. Please try again.' }));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}
