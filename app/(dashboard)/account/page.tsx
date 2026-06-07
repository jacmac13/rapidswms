'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getDailyLimit } from '@/lib/plan-features';
import type { Subscription, Profile } from '@/lib/types';

const PLAN_LABELS: Record<string, string> = {
  solo:     'Solo — $22/mo',
  crew:     'Small Crew — $48/mo',
  business: 'Business — $76/mo',
};

const STATUS_LABELS: Record<string, { label: string; colour: string }> = {
  active:     { label: 'Active',      colour: 'text-risk-low' },
  trialing:   { label: 'Trial',       colour: 'text-brand-amber-deep' },
  past_due:   { label: 'Past due',    colour: 'text-risk-high' },
  canceled:   { label: 'Cancelled',   colour: 'text-brand-steel' },
  incomplete: { label: 'Incomplete',  colour: 'text-brand-steel' },
};

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-brand-line rounded ${className ?? ''}`} />;
}

function LogoSection({ profile, onUpload }: {
  profile: Profile | null;
  onUpload: (file: File) => Promise<void>;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError('');
    setUploadSuccess(false);
    try {
      await onUpload(file);
      setUploadSuccess(true);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className="bg-white border border-brand-line rounded-xl p-6 space-y-4">
      <h2 className="font-[family-name:var(--font-archivo-black)] text-brand-ink text-lg">
        Company Logo
      </h2>
      <p className="text-sm text-brand-steel">
        Your logo appears on white-label PDF exports.
      </p>

      <div className="flex items-center gap-4">
        {profile?.company_logo_url ? (
          <img
            src={profile.company_logo_url}
            alt="Company logo"
            className="h-16 w-auto rounded border border-brand-line object-contain bg-brand-paper p-1"
          />
        ) : (
          <div className="h-16 w-32 rounded border border-brand-line bg-brand-paper flex items-center justify-center text-sm text-brand-steel">
            No logo uploaded
          </div>
        )}

        <div className="space-y-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
            disabled={uploading}
            className="block text-sm text-brand-steel file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand-paper file:text-brand-ink hover:file:bg-brand-paper-2 disabled:opacity-50"
          />
          {uploading && (
            <p className="text-sm text-brand-steel">Uploading…</p>
          )}
          {uploadSuccess && (
            <p className="text-sm text-risk-low font-medium">Logo updated.</p>
          )}
          {uploadError && (
            <p className="text-sm text-risk-high">{uploadError}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function PrioritySupportBadge() {
  return (
    <div className="bg-white border border-brand-line rounded-xl p-6 flex items-start gap-3">
      <span className="text-xl text-risk-low shrink-0" aria-hidden="true">✓</span>
      <div>
        <h2 className="font-[family-name:var(--font-archivo-black)] text-brand-ink text-lg leading-tight">
          Priority support included
        </h2>
        <p className="text-sm text-brand-steel mt-1">
          Business plan subscribers get priority email support from our team.
        </p>
      </div>
    </div>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState('');
  const [usageToday, setUsageToday] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState('');

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? '');

      const [subResult, usageResult, profileResult] = await Promise.all([
        supabase.from('subscriptions').select('*').eq('user_id', user.id).single(),
        supabase
          .from('swms_documents')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
        supabase.from('profiles').select('*').eq('id', user.id).single(),
      ]);

      setSubscription(subResult.data as Subscription | null);
      setUsageToday(usageResult.count ?? 0);
      setProfile(profileResult.data as Profile | null);
      setLoading(false);
    }

    load();
  }, []);

  async function handleManage() {
    setPortalLoading(true);
    setPortalError('');
    const res = await fetch('/api/stripe/portal', { method: 'POST' });
    const data = await res.json() as { url?: string; error?: string };
    if (!res.ok || !data.url) {
      setPortalError('Could not open billing portal. Please try again.');
      setPortalLoading(false);
      return;
    }
    router.push(data.url);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  async function handleLogoUpload(file: File) {
    const formData = new FormData();
    formData.append('logo', file);
    const res = await fetch('/api/logo', { method: 'POST', body: formData });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: 'Upload failed' })) as { error?: string };
      throw new Error(body.error ?? 'Upload failed. Please try again.');
    }
    const body = await res.json() as { url?: string };
    if (body.url) {
      setProfile(prev => prev ? { ...prev, company_logo_url: body.url! } : prev);
    }
  }

  const statusInfo = subscription ? STATUS_LABELS[subscription.status] : null;
  const trialEnd = subscription?.trial_ends_at
    ? new Date(subscription.trial_ends_at).toLocaleDateString('en-AU', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : null;

  const dailyLimit = subscription ? getDailyLimit(subscription.plan) : 20;
  const isBusiness = subscription?.plan === 'business';

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-3xl font-[family-name:var(--font-archivo-black)] text-brand-ink">Account</h1>
        <p className="text-brand-steel mt-1">{email}</p>
      </div>

      {/* Subscription card */}
      <div className="bg-white border border-brand-line rounded-xl p-6 space-y-4">
        <h2 className="font-[family-name:var(--font-archivo-black)] text-brand-ink text-lg">
          Subscription
        </h2>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        ) : subscription ? (
          <>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-brand-ink">
                {PLAN_LABELS[subscription.plan] ?? subscription.plan}
              </span>
              {statusInfo && (
                <span className={`text-sm font-semibold ${statusInfo.colour}`}>
                  {statusInfo.label}
                </span>
              )}
            </div>

            {subscription.status === 'trialing' && trialEnd && (
              <p className="text-sm text-brand-steel">
                Free trial ends <strong>{trialEnd}</strong> — you won&apos;t be charged until then.
              </p>
            )}

            {(subscription.status === 'past_due' || subscription.status === 'canceled') && (
              <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-risk-high">
                {subscription.status === 'past_due'
                  ? 'Your last payment failed. Update your payment method to keep generating SWMS.'
                  : 'Your subscription has been cancelled. Reactivate to continue generating SWMS.'}
              </div>
            )}

            {portalError && (
              <p className="text-sm text-risk-high">{portalError}</p>
            )}

            <button
              onClick={handleManage}
              disabled={portalLoading}
              className="h-10 px-4 rounded-md border border-brand-line text-brand-ink text-sm font-semibold hover:bg-brand-paper disabled:opacity-50 transition-colors"
            >
              {portalLoading ? 'Opening…' : 'Manage subscription'}
            </button>
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-brand-steel">You don&apos;t have an active subscription.</p>
            <a
              href="/pricing"
              className="inline-block h-10 px-4 rounded-md bg-brand-amber hover:bg-brand-amber-deep text-brand-ink text-sm font-semibold leading-10"
            >
              Choose a plan
            </a>
          </div>
        )}
      </div>

      {/* Business-only: Company Logo */}
      {!loading && isBusiness && (
        <LogoSection profile={profile} onUpload={handleLogoUpload} />
      )}

      {/* Business-only: Priority Support badge */}
      {!loading && isBusiness && <PrioritySupportBadge />}

      {/* Usage card */}
      <div className="bg-white border border-brand-line rounded-xl p-6 space-y-3">
        <h2 className="font-[family-name:var(--font-archivo-black)] text-brand-ink text-lg">
          Today&apos;s usage
        </h2>
        {loading ? (
          <Skeleton className="h-5 w-1/3" />
        ) : (
          <>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-[family-name:var(--font-archivo-black)] text-brand-ink">
                {usageToday ?? 0}
              </span>
              <span className="text-brand-steel text-sm">
                / {dailyLimit} SWMS generated today
              </span>
            </div>
            <div className="h-2 bg-brand-line rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-amber rounded-full transition-all"
                style={{ width: `${Math.min(((usageToday ?? 0) / dailyLimit) * 100, 100)}%` }}
              />
            </div>
          </>
        )}
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="text-sm text-brand-steel hover:text-brand-ink underline"
      >
        Sign out
      </button>
    </div>
  );
}
