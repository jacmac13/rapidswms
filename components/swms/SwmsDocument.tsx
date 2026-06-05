'use client';

import type { SwmsDocument as SwmsDoc } from '@/lib/types';
import { ActivityCard } from './ActivityCard';
import { SignoffSheet } from './SignoffSheet';

interface Props {
  swms: SwmsDoc;
  documentNumber: string;
  trade: string;
  state: string;
  company: string;
  siteAddress?: string;
  onExportPdf?: () => void;
  exporting?: boolean;
  documentId: string;
}

export function SwmsDocument({
  swms,
  documentNumber,
  trade,
  state,
  company,
  siteAddress,
  onExportPdf,
  exporting,
}: Props) {
  const today = new Date().toLocaleDateString('en-AU', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  return (
    <div className="bg-white rounded-2xl border border-brand-line shadow-sm overflow-hidden print:shadow-none print:border-none">

      {/* Disclaimer */}
      <div className="disclaimer-banner bg-brand-amber px-4 py-3 flex items-center gap-2">
        <span className="text-brand-ink font-semibold text-sm shrink-0">⚠</span>
        <p className="text-brand-ink text-sm font-medium">
          AI-generated draft — review before use on site
        </p>
      </div>

      {/* Header */}
      <div className="px-4 sm:px-6 py-5 border-b border-brand-line bg-brand-paper">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-[family-name:var(--font-archivo-black)] text-brand-ink leading-tight">
              {swms.jobTitle}
            </h1>
            <p className="text-brand-steel text-sm mt-1 break-words">{company} · {trade} · {state}</p>
            {siteAddress && (
              <p className="text-brand-steel text-sm mt-0.5 break-words">{siteAddress}</p>
            )}
          </div>
          <div className="sm:text-right shrink-0">
            <p className="font-[family-name:var(--font-mono-plex)] text-xs text-brand-steel">
              {documentNumber}
            </p>
            <p className="text-xs text-brand-steel mt-0.5">{today}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 mt-4 print:hidden">
          <button
            onClick={onExportPdf}
            disabled={exporting}
            className="h-11 px-5 rounded-md bg-brand-ink text-white text-sm font-semibold hover:bg-brand-charcoal disabled:opacity-50 transition-colors"
          >
            {exporting ? 'Generating PDF…' : 'Export PDF'}
          </button>
          <button
            onClick={() => window.print()}
            className="h-11 px-5 rounded-md border border-brand-line bg-white text-brand-ink text-sm font-semibold hover:bg-brand-paper transition-colors"
          >
            Print
          </button>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-6 space-y-8">

        {/* High-risk work flags */}
        {swms.highRiskWork.length > 0 && (
          <section>
            <h2 className="text-base sm:text-lg font-[family-name:var(--font-archivo-black)] text-brand-ink mb-3">
              High-Risk Construction Work
            </h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <ul className="space-y-1.5">
                {swms.highRiskWork.map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm text-risk-high font-medium">
                    <span className="shrink-0">⚠</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* PPE */}
        <section>
          <h2 className="text-base sm:text-lg font-[family-name:var(--font-archivo-black)] text-brand-ink mb-3">
            Required PPE
          </h2>
          <div className="flex flex-wrap gap-2">
            {swms.ppe.map((item, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-brand-paper border border-brand-line rounded-full text-sm text-brand-charcoal"
              >
                {item}
              </span>
            ))}
          </div>
        </section>

        {/* Permits */}
        {swms.permits.length > 0 && (
          <section>
            <h2 className="text-base sm:text-lg font-[family-name:var(--font-archivo-black)] text-brand-ink mb-3">
              Licences &amp; Permits Required
            </h2>
            <ul className="space-y-1.5">
              {swms.permits.map((p, i) => (
                <li key={i} className="flex gap-2 text-sm text-brand-charcoal">
                  <span className="text-brand-amber-deep shrink-0 mt-0.5">•</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Activities */}
        <section>
          <h2 className="text-base sm:text-lg font-[family-name:var(--font-archivo-black)] text-brand-ink mb-4">
            Work Activities &amp; Risk Controls
          </h2>
          <div className="space-y-4">
            {swms.activities.map((activity, i) => (
              <ActivityCard key={i} activity={activity} index={i + 1} />
            ))}
          </div>
        </section>

        {/* Emergency procedures */}
        <section>
          <h2 className="text-base sm:text-lg font-[family-name:var(--font-archivo-black)] text-brand-ink mb-3">
            Emergency Procedures
          </h2>
          <div className="bg-brand-paper rounded-lg border border-brand-line p-4">
            <ul className="space-y-2">
              {swms.emergencyProcedures.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-brand-charcoal">
                  <span className="font-[family-name:var(--font-mono-plex)] text-brand-steel shrink-0 tabular-nums w-5">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Legislation */}
        <section>
          <h2 className="text-base sm:text-lg font-[family-name:var(--font-archivo-black)] text-brand-ink mb-3">
            Relevant Legislation &amp; Standards
          </h2>
          <ul className="space-y-1.5">
            {swms.legislation.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-brand-charcoal">
                <span className="text-brand-steel shrink-0">—</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Sign-off */}
        <div className="signoff-section">
          <SignoffSheet />
        </div>

      </div>
    </div>
  );
}
