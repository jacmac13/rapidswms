'use client';

import { useState, useRef } from 'react';
import { GeneratorForm } from '@/components/swms/GeneratorForm';
import { SwmsDocument } from '@/components/swms/SwmsDocument';
import type { SwmsDocument as SwmsDoc } from '@/lib/types';

interface Result {
  swms: SwmsDoc;
  documentId: string;
  documentNumber: string;
  company: string;
  trade: string;
  state: string;
  site: string;
}

export default function GeneratePage() {
  const [result, setResult] = useState<Result | null>(null);
  const [exporting, setExporting] = useState(false);
  const documentRef = useRef<HTMLDivElement>(null);

  function handleResult(
    res: { swms: SwmsDoc; documentId: string; documentNumber: string },
    formData: { company: string; trade: string; state: string; site: string },
  ) {
    setResult({ ...res, ...formData });
    // Scroll to the rendered document after a short tick
    setTimeout(() => {
      documentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
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
      // PDF not yet implemented — silent for now; will be wired in Step 8
    } finally {
      setExporting(false);
    }
  }

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

      {/* Form card */}
      <div className="bg-white rounded-2xl border border-brand-line p-6 shadow-sm">
        <GeneratorForm onResult={handleResult} />
      </div>

      {/* Result */}
      {result && (
        <div ref={documentRef}>
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
        </div>
      )}
    </div>
  );
}
