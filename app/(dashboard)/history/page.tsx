'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { SwmsRecord } from '@/lib/types';

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-brand-line rounded ${className ?? ''}`} />;
}

function RowSkeleton() {
  return (
    <div className="bg-white border border-brand-line rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-16 rounded-md" />
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20">
      <div className="text-5xl mb-4">📋</div>
      <h2 className="text-xl font-[family-name:var(--font-archivo-black)] text-brand-ink mb-2">
        No SWMS yet
      </h2>
      <p className="text-brand-steel mb-6">
        Generate your first Safe Work Method Statement in under 60 seconds.
      </p>
      <Link
        href="/generate"
        className="inline-block h-11 px-6 rounded-md bg-brand-amber hover:bg-brand-amber-deep text-brand-ink font-semibold text-sm leading-[44px]"
      >
        Generate your first SWMS
      </Link>
    </div>
  );
}

export default function HistoryPage() {
  const [records, setRecords] = useState<SwmsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('swms_documents')
      .select('id, document_number, job_title, trade, state, created_at, job_description')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setRecords((data ?? []) as unknown as SwmsRecord[]);
        setLoading(false);
      });
  }, []);

  async function handleDownload(record: SwmsRecord) {
    setDownloading(record.id);
    try {
      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ swmsId: record.id }),
      });
      if (!res.ok) throw new Error('Failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${record.document_number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silently ignore — PDF step already handles errors server-side
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-[family-name:var(--font-archivo-black)] text-brand-ink">
            Your SWMS
          </h1>
          <p className="text-brand-steel mt-1">All your generated documents, newest first.</p>
        </div>
        <Link
          href="/generate"
          className="h-10 px-4 rounded-md bg-brand-amber hover:bg-brand-amber-deep text-brand-ink font-semibold text-sm leading-10 hidden sm:block"
        >
          + New SWMS
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(n => <RowSkeleton key={n} />)}
        </div>
      ) : records.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {records.map(record => {
            const date = new Date(record.created_at).toLocaleDateString('en-AU', {
              day: '2-digit', month: 'short', year: 'numeric',
            });
            return (
              <div
                key={record.id}
                className="bg-white border border-brand-line rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:border-brand-steel transition-colors"
              >
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-brand-ink truncate">{record.job_title}</h2>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                    <span className="text-xs text-brand-steel">{record.trade}</span>
                    <span className="text-xs text-brand-steel">·</span>
                    <span className="text-xs text-brand-steel">{record.state}</span>
                    <span className="text-xs text-brand-steel">·</span>
                    <span className="text-xs font-[family-name:var(--font-mono-plex)] text-brand-steel">
                      {record.document_number}
                    </span>
                    <span className="text-xs text-brand-steel">·</span>
                    <span className="text-xs text-brand-steel">{date}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/generate?view=${record.id}`}
                    className="h-9 px-3 rounded-md border border-brand-line text-brand-ink text-sm font-medium hover:bg-brand-paper transition-colors leading-9"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleDownload(record)}
                    disabled={downloading === record.id}
                    className="h-9 px-3 rounded-md bg-brand-ink text-white text-sm font-medium hover:bg-brand-charcoal disabled:opacity-50 transition-colors"
                  >
                    {downloading === record.id ? 'Downloading…' : 'Download PDF'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mobile new button */}
      <div className="sm:hidden">
        <Link
          href="/generate"
          className="block w-full h-11 rounded-md bg-brand-amber hover:bg-brand-amber-deep text-brand-ink font-semibold text-sm text-center leading-11"
        >
          + New SWMS
        </Link>
      </div>
    </div>
  );
}
