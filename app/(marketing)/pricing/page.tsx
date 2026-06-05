'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

interface Plan {
  key: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  highlight?: boolean;
}

const PLANS: Plan[] = [
  {
    key: 'solo',
    name: 'Solo',
    price: 29,
    description: '1 user',
    features: ['Unlimited SWMS (20/day)', 'PDF export', 'SWMS history', '7-day free trial'],
  },
  {
    key: 'crew',
    name: 'Small Crew',
    price: 49,
    description: 'Up to 5 workers',
    features: ['Everything in Solo', 'Up to 5 worker sign-offs', '7-day free trial'],
    highlight: true,
  },
  {
    key: 'business',
    name: 'Business',
    price: 99,
    description: 'Unlimited workers',
    features: ['Everything in Crew', 'Unlimited workers', 'White-label PDF', '7-day free trial'],
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function handleSelect(plan: string) {
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <h2 className="text-xl font-[family-name:var(--font-archivo-black)] text-brand-ink">{plan.name}</h2>
            <p className="text-brand-steel text-sm mt-1">{plan.description}</p>
            <div className="mt-4 mb-6">
              <span className="text-4xl font-[family-name:var(--font-archivo-black)] text-brand-ink">${plan.price}</span>
              <span className="text-brand-steel">/mo</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {plan.features.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-brand-charcoal">
                  <span className="text-risk-low mt-0.5">✓</span>
                  {f}
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
