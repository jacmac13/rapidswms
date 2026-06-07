'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UpgradePrompt } from '@/components/shared/UpgradePrompt';
import type { SwmsTemplate, Subscription } from '@/lib/types';

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-brand-line rounded ${className ?? ''}`} />;
}

function TemplateSkeleton() {
  return (
    <div className="bg-white border border-brand-line rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-20 rounded-md" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20">
      <div className="text-5xl mb-4">📂</div>
      <h2 className="text-xl font-[family-name:var(--font-archivo-black)] text-brand-ink mb-2">
        No templates saved yet
      </h2>
      <p className="text-brand-steel">
        Generate a SWMS and save it as a template to reuse it later.
      </p>
    </div>
  );
}

function ToastNotice({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const id = setTimeout(onDismiss, 3000);
    return () => clearTimeout(id);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-brand-ink text-white text-sm font-medium px-4 py-3 rounded-lg shadow-lg">
      {message}
    </div>
  );
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<SwmsTemplate[]>([]);
  const [plan, setPlan] = useState<Subscription['plan'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [subResult, templateResult] = await Promise.all([
        supabase.from('subscriptions').select('plan').eq('user_id', user.id).single(),
        supabase.from('swms_templates').select('*').order('created_at', { ascending: false }),
      ]);

      setPlan((subResult.data?.plan ?? 'solo') as Subscription['plan']);
      setTemplates((templateResult.data ?? []) as SwmsTemplate[]);
      setLoading(false);
    }

    load();
  }, []);

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch {
      // Could show an error toast here; for now silent
    } finally {
      setDeleting(null);
    }
  }

  async function handleLoad(template: SwmsTemplate) {
    try {
      await navigator.clipboard.writeText(template.name);
      setToast(`"${template.name}" name copied to clipboard`);
    } catch {
      setToast(`Loaded: ${template.name}`);
    }
  }

  const isSolo = plan === 'solo';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-[family-name:var(--font-archivo-black)] text-brand-ink">
          SWMS Templates
        </h1>
        <p className="text-brand-steel mt-1">
          Save and reuse SWMS documents as templates for common jobs.
        </p>
      </div>

      {/* Solo plan gate */}
      {!loading && isSolo && (
        <UpgradePrompt requiredPlan="crew" feature="SWMS templates" />
      )}

      {/* Content for crew+ */}
      {!isSolo && (
        <>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(n => <TemplateSkeleton key={n} />)}
            </div>
          ) : templates.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-3">
              {templates.map(template => {
                const date = new Date(template.created_at).toLocaleDateString('en-AU', {
                  day: '2-digit', month: 'short', year: 'numeric',
                });
                return (
                  <div
                    key={template.id}
                    className="bg-white border border-brand-line rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:border-brand-steel transition-colors"
                  >
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold text-brand-ink truncate">{template.name}</h2>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                        <span className="text-xs text-brand-steel">{template.trade}</span>
                        <span className="text-xs text-brand-steel">·</span>
                        <span className="text-xs text-brand-steel">Saved {date}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleLoad(template)}
                        className="h-9 px-3 rounded-md bg-brand-amber hover:bg-brand-amber-deep text-brand-ink text-sm font-medium transition-colors"
                      >
                        Load template
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        disabled={deleting === template.id}
                        className="h-9 px-3 rounded-md border border-brand-line text-risk-high text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition-colors"
                      >
                        {deleting === template.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {toast && (
        <ToastNotice message={toast} onDismiss={() => setToast('')} />
      )}
    </div>
  );
}
