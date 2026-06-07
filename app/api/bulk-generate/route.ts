import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { generateSwms, type SwmsInput } from '@/lib/anthropic';
import { hasFeature, getDailyLimit } from '@/lib/plan-features';
import type { PlanKey } from '@/lib/plan-features';
import type { SwmsDocument } from '@/lib/types';

export const dynamic = 'force-dynamic';
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

interface JobInput {
  company: string;
  abn?: string;
  trade: string;
  state: string;
  site?: string;
  principal?: string;
  jobDescription: string;
}

interface BulkResult {
  swms?: SwmsDocument;
  documentId?: string;
  documentNumber?: string;
  error?: string;
  jobIndex: number;
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

  if (!hasFeature(subscription?.plan as PlanKey, 'bulk_generate')) {
    return Response.json({ error: 'Upgrade to Small Crew to use bulk generation.' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const jobs = body.jobs;
  if (!Array.isArray(jobs) || jobs.length === 0) {
    return Response.json({ error: 'jobs must be a non-empty array.' }, { status: 400 });
  }
  if (jobs.length > 5) {
    return Response.json({ error: 'Maximum 5 jobs per bulk request.' }, { status: 400 });
  }

  // Validate each job
  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i] as Record<string, unknown>;
    if (!job.company || typeof job.company !== 'string' || !job.company.trim()) {
      return Response.json({ error: `Job ${i + 1}: business name is required.` }, { status: 400 });
    }
    if (!job.trade || typeof job.trade !== 'string' || !job.trade.trim()) {
      return Response.json({ error: `Job ${i + 1}: trade is required.` }, { status: 400 });
    }
    if (!job.state || typeof job.state !== 'string' || !job.state.trim()) {
      return Response.json({ error: `Job ${i + 1}: state is required.` }, { status: 400 });
    }
    if (!job.jobDescription || typeof job.jobDescription !== 'string') {
      return Response.json({ error: `Job ${i + 1}: job description is required.` }, { status: 400 });
    }
    if (job.jobDescription.trim().length < 20) {
      return Response.json({ error: `Job ${i + 1}: job description must be at least 20 characters.` }, { status: 400 });
    }
  }

  // Check daily limit: existing count + jobs.length must not exceed limit
  const admin = adminClient();
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  const { count } = await admin
    .from('swms_documents')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', dayStart.toISOString());

  const dailyLimit = getDailyLimit(subscription?.plan as PlanKey);
  const existing = count ?? 0;

  if (existing + jobs.length > dailyLimit) {
    const remaining = Math.max(0, dailyLimit - existing);
    return Response.json(
      { error: `Only ${remaining} SWMS remaining in your daily limit. Reduce the number of jobs.` },
      { status: 429 }
    );
  }

  const isBusinessPlan = hasFeature(subscription?.plan as PlanKey, 'version_history');

  // Generate all SWMS in parallel
  const results: BulkResult[] = await Promise.all(
    (jobs as JobInput[]).map(async (job, index) => {
      const input: SwmsInput = {
        company: job.company.trim(),
        abn: typeof job.abn === 'string' ? job.abn.trim() : undefined,
        trade: job.trade.trim(),
        state: job.state.trim(),
        site: typeof job.site === 'string' ? job.site.trim() : undefined,
        principal: typeof job.principal === 'string' ? job.principal.trim() : undefined,
        jobDescription: job.jobDescription.trim(),
      };

      try {
        const swmsJson = await generateSwms(input);
        const documentNumber = generateDocNumber();

        const { data: saved, error: dbError } = await admin
          .from('swms_documents')
          .insert({
            user_id: user.id,
            document_number: documentNumber,
            job_title: swmsJson.jobTitle,
            trade: input.trade,
            state: input.state,
            site_address: input.site ?? null,
            principal_contractor: input.principal ?? null,
            job_description: input.jobDescription,
            swms_json: swmsJson,
          })
          .select('id')
          .single();

        if (dbError || !saved) {
          console.error('[bulk-generate] DB save error for job', index, dbError?.message);
          return { jobIndex: index, error: 'Generated but could not be saved.' };
        }

        if (isBusinessPlan) {
          await admin.from('swms_versions').insert({
            swms_document_id: saved.id,
            user_id: user.id,
            version_number: 1,
            swms_json: swmsJson,
          });
        }

        return {
          jobIndex: index,
          swms: swmsJson,
          documentId: saved.id,
          documentNumber,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('[bulk-generate] Generation error for job', index, message);
        return { jobIndex: index, error: 'Could not generate SWMS for this job.' };
      }
    })
  );

  const succeeded = results.filter(r => !r.error).length;
  const failed = results.filter(r => r.error).length;

  return Response.json({ results, succeeded, failed });
}
