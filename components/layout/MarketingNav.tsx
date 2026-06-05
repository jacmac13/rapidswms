'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function MarketingNav() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setLoggedIn(!!session);
    });
  }, []);

  return (
    <nav className="border-b border-brand-line bg-white/95 backdrop-blur-sm sticky top-0 z-50 px-4 py-3 flex items-center justify-between">
      <Link
        href="/"
        className="font-[family-name:var(--font-archivo-black)] text-brand-ink text-xl tracking-tight"
      >
        RapidSWMS
      </Link>
      <div className="flex items-center gap-4">
        <Link href="/pricing" className="text-sm text-brand-steel hover:text-brand-ink transition-colors hidden sm:block">
          Pricing
        </Link>
        {loggedIn ? (
          <Link
            href="/generate"
            className="h-9 px-4 rounded-md bg-brand-amber hover:bg-brand-amber-deep text-brand-ink text-sm font-semibold leading-9 transition-colors"
          >
            Dashboard
          </Link>
        ) : (
          <>
            <Link href="/login" className="text-sm text-brand-steel hover:text-brand-ink transition-colors">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="h-9 px-4 rounded-md bg-brand-amber hover:bg-brand-amber-deep text-brand-ink text-sm font-semibold leading-9 transition-colors"
            >
              Start free trial
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
