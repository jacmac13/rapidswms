'use client';

import { useState, useRef, useEffect } from 'react';
import { GeneratorForm } from '@/components/swms/GeneratorForm';
import { SwmsDocument } from '@/components/swms/SwmsDocument';
import { BulkGenerateForm } from '@/components/swms/BulkGenerateForm';
import { TemplateAction, EmailAction, DocxAction, QrAction } from '@/components/swms/SwmsActions';
import { UpgradePrompt } from '@/components/shared/UpgradePrompt';
import { createClient } from '@/lib/supabase/client';
import { hasFeature } from '@/lib/plan-features';
import type { PlanKey } from '@/lib/plan-features';
import type { SwmsDocument as SwmsDoc, WorkerProfile } from '@/lib/types';

interface Result {
  swms: SwmsDoc;
  documentId: string;
  documentNumber: string;
  company: string;
  trade: string;
  state: string;
  site: string;
}

interface BulkResult {
  swms: SwmsDoc;
  documentId: string;
  documentNumber: string;
  jobDescription: string;
}

type Mode = 'single' | 'bulk';

export default function GeneratePage() {
  const [result, setResult] = useState<Result | null>(null);
  const [exporting, setExporting] = useState(false);
  const [mode, setMode] = useState<Mode>('single');
  const [plan, setPlan] = useState<PlanKey>('solo');
  const [bulkResults, setBulkResults] = useState<BulkResult[]>([]);
  const [workerProfiles, setWorkerProfiles] = useState<WorkerProfile[]>([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [showBulkUpgrade, setShowBulkUpgrade] = useState(false);
  const documentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('plan, status')
        .eq('user_id', user.id)
        .single();
      setPlan((subData?.plan as PlanKey) ?? 'solo');
    });
  }, []);

  function handleResult(
    res: { swms: SwmsDoc; documentId: string; documentNumber: string },
    formData: { company: string; trade: string; state: string; site: string },
  ) {
    setResult({ ...res, ...formData });
    setWorkerProfiles([]);
    setTimeout(() => {
      documentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  function handleModeSwitch(next: Mode) {
    if (next === 'bulk' && !hasFeature(plan, 'bulk_generate')) {
      setShowBulkUpgrade(true);
      return;
    }
    setShowBulkUpgrade(false);
    setMode(next);
  }

  async function handleExportPdf() {
    if (!result) return;
    setExporting(true);
    try {
      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ swmsId: result.documentId, company: result.company }),
      });
      if (!res.ok) throw new Error('PDF generation failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${result.documentNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // PDF not yet fully implemented — silent for now
    } finally {
      setExporting(false);
    }
  }

  async function handleLoadWorkerProfiles() {
    setLoadingWorkers(true);
    try {
      const res = await fetch('/api/worker-profiles');
      if (!res.ok) throw new Error('Could not load profiles.');
      const data = await res.json() as WorkerProfile[];
      setWorkerProfiles(data);
    } catch {
      // Profiles not critical — fail silently
    } finally {
      setLoadingWorkers(false);
    }
  }

  async function handleBulkExportPdf(br: BulkResult) {
    try {
      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ swmsId: br.documentId }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${br.documentNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // fail silently
    }
  }

  const canUseCrew = hasFeature(plan, 'templates');
  const canUseBusiness = hasFeature(plan, 'docx_export');

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-[family-name:var(--font-archivo-black)] text-brand-ink">
          Generate SWMS
        </h1>
        <p className="text-brand-steel mt-1">
          Describe the job and we&apos;ll build a complete Safe Work Method Statement in seconds.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 items-start flex-wrap">
        <div className="flex rounded-lg border border-brand-line overflow-hidden">
          <button
            onClick={() => handleModeSwitch('single')}
            className={`h-10 px-5 text-sm font-medium transition-colors ${
              mode === 'single'
                ? 'bg-brand-amber text-brand-ink font-semibold'
                : 'bg-white text-brand-ink hover:bg-brand-paper'
            }`}
          >
            Single SWMS
          </button>
          <button
            onClick={() => handleModeSwitch('bulk')}
            className={`h-10 px-5 text-sm font-medium border-l border-brand-line transition-colors ${
              mode === 'bulk'
                ? 'bg-brand-amber text-brand-ink font-semibold'
                : 'bg-white text-brand-ink hover:bg-brand-paper'
            }`}
          >
            Bulk — up to 5
          </button>
        </div>

        {showBulkUpgrade && (
          <div className="w-full sm:w-auto max-w-sm">
            <UpgradePrompt requiredPlan="crew" feature="bulk generation" />
          </div>
        )}
      </div>

      {/* Form card */}
      <div className="bg-white rounded-2xl border border-brand-line p-6 shadow-sm">
        {mode === 'single' ? (
          <GeneratorForm onResult={handleResult} />
        ) : (
          <BulkGenerateForm
            onResults={results => {
              setBulkResults(results);
              setTimeout(() => {
                documentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 100);
            }}
          />
        )}
      </div>

      {/* Single result */}
      {result && mode === 'single' && (
        <div ref={documentRef} className="space-y-4">
          <SwmsDocument
            swms={result.swms}
            documentNumber={result.documentNumber}
            documentId={result.documentId}
            trade={result.trade}
            state={result.state}
            company={result.company}
            siteAddress={result.site}
            onExportPdf={handleExportPdf}
            exporting={exporting}
          />

          {/* Extra action buttons */}
          <div className="bg-white rounded-2xl border border-brand-line p-6 shadow-sm space-y-4 print:hidden">
            <h2 className="text-base font-[family-name:var(--font-archivo-black)] text-brand-ink">
              More actions
            </h2>

            <div className="flex flex-wrap gap-3">
              {canUseCrew ? (
                <TemplateAction
                  documentId={result.documentId}
                  documentNumber={result.documentNumber}
                  trade={result.trade}
                />
              ) : (
                <div className="opacity-60 cursor-not-allowed">
                  <button disabled className="h-10 px-4 rounded-md border border-brand-line text-brand-ink text-sm font-medium cursor-not-allowed">
                    Save as Template
                  </button>
                </div>
              )}

              {canUseCrew ? (
                <EmailAction documentId={result.documentId} />
              ) : (
                <div className="opacity-60 cursor-not-allowed">
                  <button disabled className="h-10 px-4 rounded-md border border-brand-line text-brand-ink text-sm font-medium cursor-not-allowed">
                    Email SWMS
                  </button>
                </div>
              )}

              {canUseBusiness ? (
                <DocxAction documentId={result.documentId} documentNumber={result.documentNumber} />
              ) : (
                <div className="opacity-60 cursor-not-allowed">
                  <button disabled className="h-10 px-4 rounded-md border border-brand-line text-brand-ink text-sm font-medium cursor-not-allowed">
                    Download DOCX
                  </button>
                </div>
              )}

              {canUseBusiness ? (
                <QrAction documentId={result.documentId} />
              ) : (
                <div className="opacity-60 cursor-not-allowed">
                  <button disabled className="h-10 px-4 rounded-md border border-brand-line text-brand-ink text-sm font-medium cursor-not-allowed">
                    QR Sign-off
                  </button>
                </div>
              )}
            </div>

            {!canUseCrew && (
              <UpgradePrompt requiredPlan="crew" feature="templates, email SWMS, and worker profiles" />
            )}
            {canUseCrew && !canUseBusiness && (
              <UpgradePrompt requiredPlan="business" feature="DOCX export and QR sign-off" />
            )}

            {/* Worker profiles (crew+) */}
            {canUseCrew && (
              <div className="border-t border-brand-line pt-4 space-y-3">
                <button
                  onClick={handleLoadWorkerProfiles}
                  disabled={loadingWorkers}
                  className="h-10 px-4 rounded-md border border-brand-line text-brand-ink hover:bg-brand-paper text-sm font-medium disabled:opacity-50 transition-colors"
                >
                  {loadingWorkers ? 'Loading crew…' : 'Load crew profiles'}
                </button>
                {workerProfiles.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-brand-steel font-medium uppercase tracking-wide">
                      Crew members on sign-off sheet:
                    </p>
                    <p className="text-sm text-brand-charcoal">
                      {workerProfiles.map(w => `${w.name} (${w.role})`).join(', ')}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bulk results */}
      {bulkResults.length > 0 && mode === 'bulk' && (
        <div ref={documentRef} className="space-y-4">
          <h2 className="text-xl font-[family-name:var(--font-archivo-black)] text-brand-ink">
            Generated {bulkResults.length} SWMS
          </h2>
          {bulkResults.map((br, i) => (
            <div key={br.documentId} className="bg-white rounded-2xl border border-brand-line p-6 shadow-sm space-y-4">
              <div>
                <h3 className="font-[family-name:var(--font-archivo-black)] text-brand-ink">
                  {i + 1}. {br.swms.jobTitle}
                </h3>
                <p className="text-xs font-[family-name:var(--font-mono-plex)] text-brand-steel mt-1">
                  {br.documentNumber}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleBulkExportPdf(br)}
                  className="h-10 px-4 rounded-md bg-brand-ink hover:bg-brand-charcoal text-white text-sm font-semibold transition-colors"
                >
                  Export PDF
                </button>
                {canUseCrew && <EmailAction documentId={br.documentId} />}
                {canUseBusiness && (
                  <DocxAction documentId={br.documentId} documentNumber={br.documentNumber} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
