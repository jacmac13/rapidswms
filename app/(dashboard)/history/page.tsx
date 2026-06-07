'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { UpgradePrompt } from '@/components/shared/UpgradePrompt';
import type { SwmsRecord, Subscription, SwmsVersion } from '@/lib/types';

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

function VersionList({ recordId }: { recordId: string }) {
  const [versions, setVersions] = useState<SwmsVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/swms-versions/${recordId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load versions');
        return res.json() as Promise<SwmsVersion[]>;
      })
      .then(data => {
        setVersions(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load version history.');
        setLoading(false);
      });
  }, [recordId]);

  if (loading) {
    return (
      <div className="mt-3 space-y-2 pl-4 border-l-2 border-brand-line">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    );
  }

  if (error) {
    return <p className="mt-3 text-sm text-risk-high pl-4">{error}</p>;
  }

  if (versions.length === 0) {
    return (
      <p className="mt-3 text-sm text-brand-steel pl-4 border-l-2 border-brand-line">
        No previous versions saved.
      </p>
    );
  }

  return (
    <ul className="mt-3 space-y-2 pl-4 border-l-2 border-brand-line">
      {versions.map(v => {
        const vDate = new Date(v.created_at).toLocaleDateString('en-AU', {
          day: '2-digit', month: 'short', year: 'numeric',
        });
        return (
          <li key={v.id} className="flex items-center justify-between text-sm">
            <span className="text-brand-steel">
              Version {v.version_number} — {vDate}
            </span>
            <a
              href={`/generate?view=${v.swms_document_id}&version=${v.id}`}
              className="h-7 px-3 rounded-md border border-brand-line text-brand-ink text-xs font-medium hover:bg-brand-paper transition-colors leading-7"
            >
              View
            </a>
          </li>
        );
      })}
    </ul>
  );
}

function HistoryRow({
  record,
  isBusiness,
  downloading,
  onDownload,
}: {
  record: SwmsRecord;
  isBusiness: boolean;
  downloading: string | null;
  onDownload: (record: SwmsRecord) => void;
}) {
  const [versionsOpen, setVersionsOpen] = useState(false);

  const date = new Date(record.created_at).toLocaleDateString('en-AU', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  return (
    <div className="bg-white border border-brand-line rounded-xl p-4 hover:border-brand-steel transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
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
          {isBusiness && (
            <button
              onClick={() => setVersionsOpen(v => !v)}
              className="h-9 px-3 rounded-md border border-brand-line text-brand-ink text-sm font-medium hover:bg-brand-paper transition-colors leading-9"
            >
              {versionsOpen ? 'Hide versions' : 'Versions'}
            </button>
          )}
          <Link
            href={`/generate?view=${record.id}`}
            className="h-9 px-3 rounded-md border border-brand-line text-brand-ink text-sm font-medium hover:bg-brand-paper transition-colors leading-9"
          >
            View
          </Link>
          <button
            onClick={() => onDownload(record)}
            disabled={downloading === record.id}
            className="h-9 px-3 rounded-md bg-brand-ink text-white text-sm font-medium hover:bg-brand-charcoal disabled:opacity-50 transition-colors"
          >
            {downloading === record.id ? 'Downloading…' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* Version history panel */}
      {isBusiness && versionsOpen && <VersionList recordId={record.id} />}
    </div>
  );
}

export default function HistoryPage() {
  const [records, setRecords] = useState<SwmsRecord[]>([]);
  const [subscription, setSubscription] = useState<Pick<Subscription, 'plan'> | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90);

      const [subResult, docsResult] = await Promise.all([
        supabase.from('subscriptions').select('plan').eq('user_id', user.id).single(),
        supabase
          .from('swms_documents')
          .select('id, document_number, job_title, trade, state, created_at, job_description, qr_token')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

      const plan = (subResult.data?.plan ?? 'solo') as Subscription['plan'];
      setSubscription({ plan });

      let docs = (docsResult.data ?? []) as unknown as SwmsRecord[];

      // For non-business plans, filter to 90 days
      if (plan !== 'business') {
        docs = docs.filter(d => new Date(d.created_at) >= cutoffDate);
      }

      setRecords(docs);
      setLoading(false);
    }

    load();
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

  const isBusiness = subscription?.plan === 'business';
  const showHistoryNotice = !loading && subscription && subscription.plan !== 'business';

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

      {/* History limit notice for solo/crew */}
      {showHistoryNotice && (
        <div className="rounded-lg bg-brand-paper border border-brand-line p-4">
          <p className="text-sm text-brand-steel mb-2">
            Solo and Small Crew plans show 90 days of history.
          </p>
          <UpgradePrompt requiredPlan="business" feature="unlimited SWMS history" />
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(n => <RowSkeleton key={n} />)}
        </div>
      ) : records.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {records.map(record => (
            <HistoryRow
              key={record.id}
              record={record}
              isBusiness={isBusiness}
              downloading={downloading}
              onDownload={handleDownload}
            />
          ))}
        </div>
      )}

      {/* Mobile new button */}
      <div className="sm:hidden">
        <Link
          href="/generate"
          className="block w-full h-11 rounded-md bg-brand-amber hover:bg-brand-amber-deep text-brand-ink font-semibold text-sm text-center leading-[44px]"
        >
          + New SWMS
        </Link>
      </div>
    </div>
  );
}
