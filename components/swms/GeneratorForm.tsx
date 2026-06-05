'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { SwmsDocument } from '@/lib/types';

const TRADES = [
  'Electrician', 'Plumber', 'Carpenter', 'Roofer', 'Solar Installer',
  'Concreter', 'Painter', 'Bricklayer', 'Tiler', 'HVAC Technician',
  'Demolition', 'Excavation', 'Scaffolding', 'Landscaping', 'General Construction',
];

const STATES = [
  'NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT',
];

const PROGRESS_STEPS = [
  'Reading job description…',
  'Identifying hazards…',
  'Applying controls…',
  'Rating risks…',
  'Compiling document…',
];

const SAMPLE_JOB = {
  company: 'Sunshine Solar Pty Ltd',
  abn: '12 345 678 901',
  trade: 'Solar Installer',
  state: 'QLD',
  site: '14 Hillcrest Drive, Kenmore QLD 4069',
  principal: 'Sunstate Builders',
  jobDescription: 'Supply and installation of a 10kW rooftop solar PV system on a two-storey residential dwelling. Work includes mounting rails on a tiled pitched roof at approximately 5 metres height, cable runs through roof cavity and wall to inverter location in garage, and connection to switchboard.',
};

interface GenerateResult {
  swms: SwmsDocument;
  documentId: string;
  documentNumber: string;
}

interface Props {
  onResult: (result: GenerateResult, formData: {
    company: string; trade: string; state: string; site: string;
  }) => void;
}

export function GeneratorForm({ onResult }: Props) {
  const [company, setCompany] = useState('');
  const [abn, setAbn] = useState('');
  const [trade, setTrade] = useState('');
  const [state, setState] = useState('');
  const [site, setSite] = useState('');
  const [principal, setPrincipal] = useState('');
  const [jobDescription, setJobDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [error, setError] = useState('');

  // Inline validation — only show after first touch
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const companyError = touched.company && !company.trim() ? 'Business name is required' : '';
  const tradeError = touched.trade && !trade ? 'Trade is required' : '';
  const stateError = touched.state && !state ? 'State/Territory is required' : '';
  const jobError = touched.jobDescription && !jobDescription.trim()
    ? 'Job description is required'
    : touched.jobDescription && jobDescription.trim().length < 20
    ? 'Please describe the job in more detail (at least 20 characters)'
    : '';

  // Cycle through progress labels while loading
  useEffect(() => {
    if (!loading) { setProgressStep(0); return; }
    const interval = setInterval(() => {
      setProgressStep(s => (s + 1) % PROGRESS_STEPS.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [loading]);

  function loadSample() {
    setCompany(SAMPLE_JOB.company);
    setAbn(SAMPLE_JOB.abn);
    setTrade(SAMPLE_JOB.trade);
    setState(SAMPLE_JOB.state);
    setSite(SAMPLE_JOB.site);
    setPrincipal(SAMPLE_JOB.principal);
    setJobDescription(SAMPLE_JOB.jobDescription);
    setTouched({});
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ company: true, trade: true, state: true, jobDescription: true });
    if (!company.trim() || !trade || !state || !jobDescription.trim() || jobDescription.trim().length < 20) return;

    setLoading(true);
    setError('');

    const res = await fetch('/api/generate-swms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company, abn, trade, state, site, principal, jobDescription }),
    });

    const data = await res.json() as GenerateResult & { error?: string };
    setLoading(false);

    if (!res.ok || !data.swms) {
      setError(data.error ?? 'Something went wrong. Please try again.');
      return;
    }

    onResult(
      { swms: data.swms, documentId: data.documentId, documentNumber: data.documentNumber },
      { company, trade, state, site },
    );
  }

  const canSubmit = !!company.trim() && !!trade && !!state && jobDescription.trim().length >= 20;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Top row */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-[family-name:var(--font-archivo-black)] text-brand-ink">
          Job details
        </h2>
        <button
          type="button"
          onClick={loadSample}
          className="text-sm text-brand-amber-deep font-medium hover:underline"
        >
          Load sample job
        </button>
      </div>

      {/* Business + ABN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="company">Business name <span className="text-risk-high">*</span></Label>
          <Input
            id="company"
            value={company}
            onChange={e => setCompany(e.target.value)}
            onBlur={() => setTouched(t => ({ ...t, company: true }))}
            className={companyError ? 'border-risk-high' : ''}
            placeholder="e.g. Smith Electrical Pty Ltd"
          />
          {companyError && <p className="text-xs text-risk-high">{companyError}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="abn">ABN <span className="text-brand-steel font-normal">(optional)</span></Label>
          <Input
            id="abn"
            value={abn}
            onChange={e => setAbn(e.target.value)}
            placeholder="e.g. 12 345 678 901"
          />
        </div>
      </div>

      {/* Trade + State */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="trade">Trade <span className="text-risk-high">*</span></Label>
          <Select value={trade} onValueChange={v => { setTrade(v); setTouched(t => ({ ...t, trade: true })); }}>
            <SelectTrigger id="trade" className={tradeError ? 'border-risk-high' : ''}>
              <SelectValue placeholder="Select trade…" />
            </SelectTrigger>
            <SelectContent>
              {TRADES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          {tradeError && <p className="text-xs text-risk-high">{tradeError}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="state">State / Territory <span className="text-risk-high">*</span></Label>
          <Select value={state} onValueChange={v => { setState(v); setTouched(t => ({ ...t, state: true })); }}>
            <SelectTrigger id="state" className={stateError ? 'border-risk-high' : ''}>
              <SelectValue placeholder="Select state…" />
            </SelectTrigger>
            <SelectContent>
              {STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          {stateError && <p className="text-xs text-risk-high">{stateError}</p>}
        </div>
      </div>

      {/* Site + Principal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="site">Worksite address <span className="text-brand-steel font-normal">(optional)</span></Label>
          <Input
            id="site"
            value={site}
            onChange={e => setSite(e.target.value)}
            placeholder="e.g. 42 Smith St, Sydney NSW 2000"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="principal">Principal contractor <span className="text-brand-steel font-normal">(optional)</span></Label>
          <Input
            id="principal"
            value={principal}
            onChange={e => setPrincipal(e.target.value)}
            placeholder="e.g. Ace Constructions"
          />
        </div>
      </div>

      {/* Job description */}
      <div className="space-y-1.5">
        <Label htmlFor="jobDescription">
          Job description <span className="text-risk-high">*</span>
        </Label>
        <Textarea
          id="jobDescription"
          value={jobDescription}
          onChange={e => setJobDescription(e.target.value)}
          onBlur={() => setTouched(t => ({ ...t, jobDescription: true }))}
          className={`min-h-[140px] resize-y ${jobError ? 'border-risk-high' : ''}`}
          placeholder="Describe the work in plain English — what you're doing, where, and any key details (e.g. heights, confined spaces, energised equipment)."
        />
        <div className="flex justify-between">
          {jobError
            ? <p className="text-xs text-risk-high">{jobError}</p>
            : <span />
          }
          <p className="text-xs text-brand-steel ml-auto">{jobDescription.length} chars</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-risk-high">
          {error}
        </div>
      )}

      {/* Submit */}
      <div>
        <Button
          type="submit"
          disabled={loading || !canSubmit}
          className="w-full h-12 bg-brand-amber hover:bg-brand-amber-deep text-brand-ink font-semibold text-base disabled:opacity-60"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-ink border-t-transparent" />
              {PROGRESS_STEPS[progressStep]}
            </span>
          ) : (
            'Generate SWMS'
          )}
        </Button>
        {loading && (
          <div className="mt-3 h-1.5 bg-brand-line rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-amber rounded-full transition-all duration-[2200ms] ease-linear"
              style={{ width: `${((progressStep + 1) / PROGRESS_STEPS.length) * 100}%` }}
            />
          </div>
        )}
      </div>
    </form>
  );
}
