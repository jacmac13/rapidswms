'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const emailError = email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'Enter a valid email address' : '';
  const passwordError = password && password.length < 6 ? 'Password must be at least 6 characters' : '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (emailError || passwordError) return;
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError('Incorrect email or password. Check your details and try again.');
      setLoading(false);
      return;
    }
    router.push('/generate');
    router.refresh();
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <Link href="/" className="text-2xl font-[family-name:var(--font-archivo-black)] text-brand-ink">
          RapidSWMS
        </Link>
        <h1 className="mt-6 text-3xl font-[family-name:var(--font-archivo-black)] text-brand-ink">Sign in</h1>
        <p className="mt-2 text-brand-steel">Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-brand-amber-deep font-medium hover:underline">Sign up free</Link>
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className={emailError ? 'border-risk-high focus-visible:ring-risk-high' : ''}
            placeholder="you@example.com"
          />
          {emailError && <p className="text-xs text-risk-high">{emailError}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className={passwordError ? 'border-risk-high focus-visible:ring-risk-high' : ''}
            placeholder="••••••••"
          />
          {passwordError && <p className="text-xs text-risk-high">{passwordError}</p>}
        </div>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-risk-high">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={loading || !!emailError || !!passwordError || !email || !password}
          className="w-full h-12 bg-brand-amber hover:bg-brand-amber-deep text-brand-ink font-semibold text-base"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </div>
  );
}
