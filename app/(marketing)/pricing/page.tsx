'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

type PlanKey = 'solo' | 'crew' | 'business';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  key: PlanKey;
  name: string;
  price: number;
  tagline: string;
  features: PlanFeature[];
  highlight?: boolean;
}

const PLANS: Plan[] = [
  {
    key: 'solo',
    name: 'Solo',
    price: 22,
    tagline: '1 user',
    features: [
      { text: '1 user', included: true },
      { text: '20 SWMS per day', included: true },
      { text: '90-day SWMS history', included: true },
      { text: 'PDF export', included: true },
      { text: 'Mobile sign-off', included: true },
      { text: '7-day free trial', included: true },
      { text: 'SWMS templates (save & reuse)', included: false },
      { text: 'Bulk generation (up to 5 at once)', included: false },
      { text: 'Worker profiles (auto-fill sign-off)', included: false },
      { text: 'Email SWMS to any address', included: false },
      { text: 'White-label PDF (your company logo)', included: false },
      { text: 'SWMS version history', included: false },
      { text: 'Export to Word / DOCX', included: false },
      { text: 'QR code sign-off for workers', included: false },
      { text: 'Priority support', included: false },
    ],
  },
  {
    key: 'crew',
    name: 'Small Crew',
    price: 48,
    tagline: 'Everything in Solo, plus:',
    highlight: true,
    features: [
      { text: '1 user', included: true },
      { text: '50 SWMS per day', included: true },
      { text: '90-day SWMS history', included: true },
      { text: 'PDF export', included: true },
      { text: 'Mobile sign-off', included: true },
      { text: 'SWMS templates (save & reuse)', included: true },
      { text: 'Bulk generation (up to 5 at once)', included: true },
      { text: 'Worker profiles (auto-fill sign-off)', included: true },
      { text: 'Email SWMS to any address', included: true },
      { text: '7-day free trial', included: true },
      { text: 'White-label PDF (your company logo)', included: false },
      { text: 'SWMS version history', included: false },
      { text: 'Export to Word / DOCX', included: false },
      { text: 'QR code sign-off for workers', included: false },
      { text: 'Priority support', included: false },
    ],
  },
  {
    key: 'business',
    name: 'Business',
    price: 76,
    tagline: 'Everything in Small Crew, plus:',
    features: [
      { text: '1 user', included: true },
      { text: '100 SWMS per day', included: true },
      { text: 'Unlimited SWMS history', included: true },
      { text: 'PDF export', included: true },
      { text: 'Mobile sign-off', included: true },
      { text: 'SWMS templates (save & reuse)', included: true },
      { text: 'Bulk generation (up to 5 at once)', included: true },
      { text: 'Worker profiles (auto-fill sign-off)', included: true },
      { text: 'Email SWMS to any address', included: true },
      { text: 'White-label PDF (your company logo)', included: true },
      { text: 'SWMS version history', included: true },
      { text: 'Export to Word / DOCX', included: true },
      { text: 'QR code sign-off for workers', included: true },
      { text: 'Priority support', included: true },
      { text: '7-day free trial', included: true },
    ],
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function handleSelect(plan: PlanKey) {
    setLoading(plan);
    setError('');

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/signup');
      return;
    }

    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json() as { url?: string; error?: string };

    if (!res.ok || !data.url) {
      setError('Could not start checkout. Please try again.');
      setLoading(null);
      return;
    }

    window.location.href = data.url;
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-[family-name:var(--font-archivo-black)] text-brand-ink mb-3">
          Simple pricing
        </h1>
        <p className="text-brand-steel text-lg">7-day free trial on every plan. No credit card required to start.</p>
      </div>

      {error && (
        <div className="max-w-md mx-auto mb-8 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-risk-high text-center">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {PLANS.map(plan => (
          <div
            key={plan.key}
            className={`rounded-2xl border p-8 flex flex-col ${
              plan.highlight
                ? 'border-brand-amber bg-white shadow-md ring-2 ring-brand-amber'
                : 'border-brand-line bg-white'
            }`}
          >
            {plan.highlight && (
              <div className="mb-4">
                <span className="bg-brand-amber text-brand-ink text-xs font-semibold px-3 py-1 rounded-full">
                  Most popular
                </span>
              </div>
            )}

            <h2 className="text-xl font-[family-name:var(--font-archivo-black)] text-brand-ink">
              {plan.name}
            </h2>
            <p className="text-brand-steel text-sm mt-1">{plan.tagline}</p>

            <div className="mt-4 mb-6">
              <span className="text-4xl font-[family-name:var(--font-archivo-black)] text-brand-ink">
                ${plan.price}
              </span>
              <span className="text-brand-steel">/mo</span>
            </div>

            <ul className="space-y-2 mb-8 flex-1">
              {plan.features.map(f => (
                <li key={f.text} className="flex items-start gap-2 text-sm">
                  {f.included ? (
                    <span className="text-risk-low mt-0.5 shrink-0 font-semibold">✓</span>
                  ) : (
                    <span className="text-brand-line mt-0.5 shrink-0">—</span>
                  )}
                  <span className={f.included ? 'text-brand-ink' : 'text-brand-steel'}>
                    {f.text}
                  </span>
                </li>
              ))}
            </ul>

            <Button
              onClick={() => handleSelect(plan.key)}
              disabled={loading !== null}
              className={`w-full h-12 font-semibold ${
                plan.highlight
                  ? 'bg-brand-amber hover:bg-brand-amber-deep text-brand-ink'
                  : 'bg-brand-ink hover:bg-brand-charcoal text-white'
              }`}
            >
              {loading === plan.key ? 'Redirecting…' : 'Start free trial'}
            </Button>
          </div>
        ))}
      </div>
    </main>
  );
}
