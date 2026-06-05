'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const emailError = email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'Enter a valid email address' : '';
  const passwordError = password && password.length < 8 ? 'Password must be at least 8 characters' : '';
  const confirmError = confirm && confirm !== password ? 'Passwords don\'t match' : '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (emailError || passwordError || confirmError) return;
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/generate` },
    });
    if (authError) {
      setError(authError.message.includes('already registered')
        ? 'An account with this email already exists. Try signing in instead.'
        : 'Something went wrong. Please try again.');
      setLoading(false);
      return;
    }
    router.push('/pricing');
    router.refresh();
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <Link href="/" className="text-2xl font-[family-name:var(--font-archivo-black)] text-brand-ink">
          RapidSWMS
        </Link>
        <h1 className="mt-6 text-3xl font-[family-name:var(--font-archivo-black)] text-brand-ink">Create your account</h1>
        <p className="mt-2 text-brand-steel">Already have an account?{' '}
          <Link href="/login" className="text-brand-amber-deep font-medium hover:underline">Sign in</Link>
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
            autoComplete="new-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className={passwordError ? 'border-risk-high focus-visible:ring-risk-high' : ''}
            placeholder="At least 8 characters"
          />
          {passwordError && <p className="text-xs text-risk-high">{passwordError}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            className={confirmError ? 'border-risk-high focus-visible:ring-risk-high' : ''}
            placeholder="••••••••"
          />
          {confirmError && <p className="text-xs text-risk-high">{confirmError}</p>}
        </div>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-risk-high">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={loading || !!emailError || !!passwordError || !!confirmError || !email || !password || !confirm}
          className="w-full h-12 bg-brand-amber hover:bg-brand-amber-deep text-brand-ink font-semibold text-base"
        >
          {loading ? 'Creating account…' : 'Create account — free 7-day trial'}
        </Button>

        <p className="text-center text-xs text-brand-steel">
          By signing up you agree to our terms of service.
        </p>
      </form>
    </div>
  );
}
