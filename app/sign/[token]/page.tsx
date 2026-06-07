'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface SwmsInfo {
  jobTitle: string;
  documentNumber: string;
  trade: string;
  state: string;
}

type PageState =
  | { status: 'loading' }
  | { status: 'invalid' }
  | { status: 'ready'; swms: SwmsInfo }
  | { status: 'success'; jobTitle: string }
  | { status: 'error'; message: string };

export default function QrSignPage() {
  const params = useParams();
  const token = typeof params.token === 'string' ? params.token : '';

  const [pageState, setPageState] = useState<PageState>({ status: 'loading' });
  const [workerName, setWorkerName] = useState('');
  const [workerRole, setWorkerRole] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    if (!token) {
      setPageState({ status: 'invalid' });
      return;
    }

    fetch(`/api/qr-sign/${token}`)
      .then(res => {
        if (res.status === 404) throw new Error('invalid');
        if (!res.ok) throw new Error('fetch_failed');
        return res.json() as Promise<SwmsInfo>;
      })
      .then(swms => setPageState({ status: 'ready', swms }))
      .catch(err => {
        if (err instanceof Error && err.message === 'invalid') {
          setPageState({ status: 'invalid' });
        } else {
          setPageState({ status: 'error', message: 'Could not load this sign-off page. Please try again.' });
        }
      });
  }, [token]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setNameError('');

    const trimmedName = workerName.trim();
    if (!trimmedName) {
      setNameError('Please enter your name.');
      return;
    }

    if (pageState.status !== 'ready') return;
    const jobTitle = pageState.swms.jobTitle;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/qr-sign/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerName: trimmedName, workerRole: workerRole.trim() || null }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Submission failed' })) as { error?: string };
        setPageState({ status: 'error', message: body.error ?? 'Submission failed. Please try again.' });
        return;
      }

      setPageState({ status: 'success', jobTitle });
    } catch {
      setPageState({ status: 'error', message: 'Network error. Please check your connection and try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-paper flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="text-2xl font-[family-name:var(--font-archivo-black)] text-brand-ink">
              RapidSWMS
            </span>
          </div>
          <p className="text-sm text-brand-steel">Safe Work Method Statement Sign-off</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-brand-line rounded-xl p-8 shadow-sm">
          {pageState.status === 'loading' && (
            <div className="space-y-4">
              <div className="animate-pulse bg-brand-line rounded h-6 w-3/4" />
              <div className="animate-pulse bg-brand-line rounded h-4 w-1/2" />
              <div className="animate-pulse bg-brand-line rounded h-10 w-full mt-6" />
            </div>
          )}

          {pageState.status === 'invalid' && (
            <div className="text-center space-y-3">
              <div className="text-4xl">⚠️</div>
              <h1 className="text-xl font-[family-name:var(--font-archivo-black)] text-brand-ink">
                Invalid QR code
              </h1>
              <p className="text-sm text-brand-steel">
                This QR code is invalid or has expired. Please ask your site supervisor for an updated copy.
              </p>
            </div>
          )}

          {pageState.status === 'error' && (
            <div className="text-center space-y-3">
              <div className="text-4xl">⚠️</div>
              <h1 className="text-xl font-[family-name:var(--font-archivo-black)] text-brand-ink">
                Something went wrong
              </h1>
              <p className="text-sm text-risk-high">{pageState.message}</p>
            </div>
          )}

          {pageState.status === 'success' && (
            <div className="text-center space-y-3">
              <div className="text-4xl">✅</div>
              <h1 className="text-xl font-[family-name:var(--font-archivo-black)] text-brand-ink">
                Signed successfully
              </h1>
              <p className="text-sm text-brand-steel">
                Your signature has been recorded for{' '}
                <strong className="text-brand-ink">{pageState.jobTitle}</strong>.
              </p>
              <p className="text-xs text-brand-steel pt-2">
                You may now close this page.
              </p>
            </div>
          )}

          {pageState.status === 'ready' && (
            <>
              {/* SWMS details */}
              <div className="mb-6">
                <h1 className="text-xl font-[family-name:var(--font-archivo-black)] text-brand-ink leading-tight">
                  {pageState.swms.jobTitle}
                </h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                  <span className="text-xs text-brand-steel">{pageState.swms.trade}</span>
                  <span className="text-xs text-brand-steel">·</span>
                  <span className="text-xs text-brand-steel">{pageState.swms.state}</span>
                  <span className="text-xs text-brand-steel">·</span>
                  <span className="text-xs font-[family-name:var(--font-mono-plex)] text-brand-steel">
                    {pageState.swms.documentNumber}
                  </span>
                </div>
              </div>

              <div className="h-px bg-brand-line mb-6" />

              {/* Sign-off form */}
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div>
                  <label htmlFor="workerName" className="block text-sm font-semibold text-brand-ink mb-1">
                    Your full name <span className="text-risk-high" aria-label="required">*</span>
                  </label>
                  <input
                    id="workerName"
                    type="text"
                    autoComplete="name"
                    value={workerName}
                    onChange={e => setWorkerName(e.target.value)}
                    className={`w-full h-10 px-3 rounded-md border text-brand-ink text-sm placeholder:text-brand-steel focus:outline-none focus:ring-2 focus:ring-brand-amber transition-colors ${
                      nameError ? 'border-risk-high' : 'border-brand-line'
                    }`}
                    placeholder="e.g. Jane Smith"
                    required
                    aria-describedby={nameError ? 'nameError' : undefined}
                  />
                  {nameError && (
                    <p id="nameError" className="mt-1 text-xs text-risk-high">{nameError}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="workerRole" className="block text-sm font-semibold text-brand-ink mb-1">
                    Role / trade <span className="text-brand-steel font-normal">(optional)</span>
                  </label>
                  <input
                    id="workerRole"
                    type="text"
                    value={workerRole}
                    onChange={e => setWorkerRole(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-brand-line text-brand-ink text-sm placeholder:text-brand-steel focus:outline-none focus:ring-2 focus:ring-brand-amber transition-colors"
                    placeholder="e.g. Licensed Electrician"
                  />
                </div>

                <p className="text-xs text-brand-steel">
                  By signing, you confirm you have read and understood the Safe Work Method Statement for this job.
                </p>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-11 rounded-md bg-brand-amber hover:bg-brand-amber-deep text-brand-ink font-semibold text-sm transition-colors disabled:opacity-60"
                >
                  {submitting ? 'Submitting…' : 'Sign off on this SWMS'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-brand-steel mt-6">
          Powered by RapidSWMS · Australian WHS compliant
        </p>
      </div>
    </div>
  );
}
