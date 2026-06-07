import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { hasFeature } from '@/lib/plan-features';
import type { PlanKey } from '@/lib/plan-features';

export const dynamic = 'force-dynamic';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_BYTES = 2 * 1024 * 1024; // 2MB

function adminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function extFromMime(mime: string): string {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'jpg';
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

  if (!hasFeature(subscription?.plan as PlanKey, 'white_label')) {
    return Response.json({ error: 'Upgrade to Business to use white label branding.' }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: 'Invalid form data.' }, { status: 400 });
  }

  const file = formData.get('logo');
  if (!(file instanceof File)) {
    return Response.json({ error: 'logo file is required.' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return Response.json({ error: 'Logo must be a PNG, JPEG, or WebP image.' }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return Response.json({ error: 'Logo must be 2MB or smaller.' }, { status: 400 });
  }

  const ext = extFromMime(file.type);
  const storagePath = `${user.id}/logo.${ext}`;
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  const admin = adminClient();
  const { error: uploadError } = await admin.storage
    .from('logos')
    .upload(storagePath, fileBuffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    console.error('[logo] Upload error:', uploadError.message);
    return Response.json({ error: 'Could not upload logo. Please try again.' }, { status: 500 });
  }

  const { data: urlData } = admin.storage.from('logos').getPublicUrl(storagePath);
  const logoUrl = urlData.publicUrl;

  const { error: profileError } = await admin
    .from('profiles')
    .update({ company_logo_url: logoUrl })
    .eq('id', user.id);

  if (profileError) {
    console.error('[logo] Profile update error:', profileError.message);
    return Response.json({ error: 'Logo uploaded but profile could not be updated.' }, { status: 500 });
  }

  return Response.json({ logoUrl });
}
