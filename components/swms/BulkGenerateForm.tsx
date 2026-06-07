'use client';

import { useState } from 'react';
import type { SwmsDocument } from '@/lib/types';

interface BulkJob {
  jobDescription: string;
}

interface BulkResult {
  swms: SwmsDocument;
  documentId: string;
  documentNumber: string;
  jobDescription: string;
}

interface Props {
  onResults: (results: BulkResult[]) => void;
}

const TRADES = [
  'Electrician', 'Plumber', 'Carpenter', 'Roofer', 'Concreter',
  'Painter', 'Solar Installer', 'HVAC Technician', 'Welder', 'General Construction',
];

const STATES = [
  'NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT',
];

export function BulkGenerateForm({ onResults }: Props) {
  const [businessName, setBusinessName] = useState('');
  const [abn, setAbn] = useState('');
  const [trade, setTrade] = useState('');
  const [state, setState] = useState('');
  const [jobs, setJobs] = useState<BulkJob[]>([{ jobDescription: '' }, { jobDescription: '' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleAddJob() {
    if (jobs.length >= 5) return;
    setJobs(prev => [...prev, { jobDescription: '' }]);
  }

  function handleRemoveJob(index: number) {
    if (jobs.length <= 2) return;
    setJobs(prev => prev.filter((_, i) => i !== index));
  }

  function handleJobChange(index: number, value: string) {
    setJobs(prev => prev.map((job, i) => i === index ? { jobDescription: value } : job));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!businessName.trim()) { setError('Business name is required.'); return; }
    if (!trade) { setError('Trade is required.'); return; }
    if (!state) { setError('State is required.'); return; }
    const filledJobs = jobs.filter(j => j.jobDescription.trim().length >= 20);
    if (filledJobs.length === 0) {
      setError('At least one job description must be at least 20 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/bulk-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: businessName.trim(),
          abn: abn.trim() || undefined,
          trade,
          state,
          jobs: filledJobs.map(j => j.jobDescription.trim()),
        }),
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? 'Bulk generation failed. Please try again.');
      }

      const data = await res.json() as { results: BulkResult[] };
      onResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  const filledCount = jobs.filter(j => j.jobDescription.trim().length >= 20).length;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Shared fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="bulk-business" className="block text-sm font-medium text-brand-ink mb-1">
            Business name <span className="text-risk-high">*</span>
          </label>
          <input
            id="bulk-business"
            type="text"
            value={businessName}
            onChange={e => setBusinessName(e.target.value)}
            placeholder="e.g. Smith Plumbing Pty Ltd"
            className="w-full h-10 px-3 rounded-md border border-brand-line text-brand-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber bg-white"
            required
          />
        </div>
        <div>
          <label htmlFor="bulk-abn" className="block text-sm font-medium text-brand-ink mb-1">
            ABN <span className="text-brand-steel font-normal">(optional)</span>
          </label>
          <input
            id="bulk-abn"
            type="text"
            value={abn}
            onChange={e => setAbn(e.target.value)}
            placeholder="e.g. 12 345 678 901"
            className="w-full h-10 px-3 rounded-md border border-brand-line text-brand-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber bg-white"
          />
        </div>
        <div>
          <label htmlFor="bulk-trade" className="block text-sm font-medium text-brand-ink mb-1">
            Trade <span className="text-risk-high">*</span>
          </label>
          <select
            id="bulk-trade"
            value={trade}
            onChange={e => setTrade(e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-brand-line text-brand-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber bg-white"
            required
          >
            <option value="">Select trade…</option>
            {TRADES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="bulk-state" className="block text-sm font-medium text-brand-ink mb-1">
            State / Territory <span className="text-risk-high">*</span>
          </label>
          <select
            id="bulk-state"
            value={state}
            onChange={e => setState(e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-brand-line text-brand-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber bg-white"
            required
          >
            <option value="">Select state…</option>
            {STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Job descriptions */}
      <div className="space-y-4">
        <p className="text-sm font-medium text-brand-ink">
          Job descriptions ({jobs.length} of 5)
        </p>
        {jobs.map((job, index) => (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between">
              <label
                htmlFor={`bulk-job-${index}`}
                className="text-sm font-medium text-brand-ink"
              >
                Job {index + 1}
              </label>
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => handleRemoveJob(index)}
                  className="text-xs text-brand-steel hover:text-risk-high transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
            <textarea
              id={`bulk-job-${index}`}
              value={job.jobDescription}
              onChange={e => handleJobChange(index, e.target.value)}
              placeholder="Describe the job in detail — what work is being done, where, and any specific conditions…"
              rows={3}
              className="w-full px-3 py-2 rounded-md border border-brand-line text-brand-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber bg-white resize-none"
            />
            {job.jobDescription.trim().length > 0 && job.jobDescription.trim().length < 20 && (
              <p className="text-xs text-risk-high">Minimum 20 characters required.</p>
            )}
          </div>
        ))}
      </div>

      {jobs.length < 5 && (
        <button
          type="button"
          onClick={handleAddJob}
          className="h-10 px-4 rounded-md border border-brand-line text-brand-ink hover:bg-brand-paper text-sm font-medium transition-colors"
        >
          + Add another job
        </button>
      )}

      {error && (
        <p className="text-sm text-risk-high bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || filledCount === 0}
        className="h-10 px-4 rounded-md bg-brand-amber hover:bg-brand-amber-deep text-brand-ink font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? `Generating ${filledCount} SWMS…` : `Generate ${filledCount || ''} SWMS`}
      </button>
    </form>
  );
}
