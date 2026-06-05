'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Subscription } from '@/lib/types';

const PLAN_LABELS: Record<string, string> = {
  solo:     'Solo — $29/mo',
  crew:     'Small Crew — $49/mo',
  business: 'Business — $99/mo',
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

export default function AccountPage() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
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

      const [subResult, usageResult] = await Promise.all([
        supabase.from('subscriptions').select('*').eq('user_id', user.id).single(),
        supabase
          .from('swms_documents')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
      ]);

      setSubscription(subResult.data as Subscription | null);
      setUsageToday(usageResult.count ?? 0);
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

  const statusInfo = subscription ? STATUS_LABELS[subscription.status] : null;
  const trialEnd = subscription?.trial_ends_at
    ? new Date(subscription.trial_ends_at).toLocaleDateString('en-AU', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : null;

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
              <span className="text-brand-steel text-sm">/ 20 SWMS generated today</span>
            </div>
            <div className="h-2 bg-brand-line rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-amber rounded-full transition-all"
                style={{ width: `${Math.min(((usageToday ?? 0) / 20) * 100, 100)}%` }}
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
