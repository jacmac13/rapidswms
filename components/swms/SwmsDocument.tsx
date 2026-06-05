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
      <div className="bg-brand-amber px-4 py-2.5 flex items-center gap-2">
        <span className="text-brand-ink font-semibold text-sm">⚠</span>
        <p className="text-brand-ink text-sm font-medium">
          AI-generated draft — review before use on site
        </p>
      </div>

      {/* Header */}
      <div className="px-6 py-5 border-b border-brand-line bg-brand-paper">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-[family-name:var(--font-archivo-black)] text-brand-ink">
              {swms.jobTitle}
            </h1>
            <p className="text-brand-steel mt-1">{company} · {trade} · {state}</p>
            {siteAddress && <p className="text-brand-steel text-sm mt-0.5">{siteAddress}</p>}
          </div>
          <div className="text-right">
            <p className="font-[family-name:var(--font-mono-plex)] text-sm text-brand-steel">
              {documentNumber}
            </p>
            <p className="text-sm text-brand-steel mt-0.5">{today}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 mt-4 print:hidden">
          <button
            onClick={onExportPdf}
            disabled={exporting}
            className="h-10 px-4 rounded-md bg-brand-ink text-white text-sm font-semibold hover:bg-brand-charcoal disabled:opacity-50 transition-colors"
          >
            {exporting ? 'Generating PDF…' : 'Export PDF'}
          </button>
          <button
            onClick={() => window.print()}
            className="h-10 px-4 rounded-md border border-brand-line bg-white text-brand-ink text-sm font-semibold hover:bg-brand-paper transition-colors"
          >
            Print
          </button>
        </div>
      </div>

      <div className="px-6 py-6 space-y-8">
        {/* High-risk work flags */}
        {swms.highRiskWork.length > 0 && (
          <section>
            <h2 className="text-lg font-[family-name:var(--font-archivo-black)] text-brand-ink mb-3">
              High-Risk Construction Work
            </h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <ul className="space-y-1.5">
                {swms.highRiskWork.map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm text-risk-high font-medium">
                    <span className="shrink-0">⚠</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* PPE */}
        <section>
          <h2 className="text-lg font-[family-name:var(--font-archivo-black)] text-brand-ink mb-3">
            Required PPE
          </h2>
          <div className="flex flex-wrap gap-2">
            {swms.ppe.map((item, i) => (
              <span key={i} className="px-3 py-1.5 bg-brand-paper border border-brand-line rounded-full text-sm text-brand-charcoal">
                {item}
              </span>
            ))}
          </div>
        </section>

        {/* Permits */}
        {swms.permits.length > 0 && (
          <section>
            <h2 className="text-lg font-[family-name:var(--font-archivo-black)] text-brand-ink mb-3">
              Licences &amp; Permits Required
            </h2>
            <ul className="space-y-1.5">
              {swms.permits.map((p, i) => (
                <li key={i} className="flex gap-2 text-sm text-brand-charcoal">
                  <span className="text-brand-amber-deep shrink-0">•</span>
                  {p}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Activities */}
        <section>
          <h2 className="text-lg font-[family-name:var(--font-archivo-black)] text-brand-ink mb-4">
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
          <h2 className="text-lg font-[family-name:var(--font-archivo-black)] text-brand-ink mb-3">
            Emergency Procedures
          </h2>
          <div className="bg-brand-paper rounded-lg border border-brand-line p-4">
            <ul className="space-y-2">
              {swms.emergencyProcedures.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-brand-charcoal">
                  <span className="font-[family-name:var(--font-mono-plex)] text-brand-steel shrink-0">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {step}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Legislation */}
        <section>
          <h2 className="text-lg font-[family-name:var(--font-archivo-black)] text-brand-ink mb-3">
            Relevant Legislation &amp; Standards
          </h2>
          <ul className="space-y-1.5">
            {swms.legislation.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-brand-charcoal">
                <span className="text-brand-steel shrink-0">—</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Sign-off */}
        <SignoffSheet />
      </div>
    </div>
  );
}
