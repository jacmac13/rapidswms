'use client';

import { useState } from 'react';

interface TemplateActionProps {
  documentId: string;
  documentNumber: string;
  trade: string;
}

export function TemplateAction({ documentId, trade }: TemplateActionProps) {
  const [saving, setSaving] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [name, setName] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!name.trim()) { setError('Template name is required.'); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), trade, swmsId: documentId }),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        throw new Error(d.error ?? 'Could not save template.');
      }
      setFeedback('Template saved!');
      setShowInput(false);
      setName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setSaving(false);
    }
  }

  if (feedback) {
    return <span className="text-sm text-risk-low font-medium">{feedback}</span>;
  }

  if (showInput) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Template name…"
          className="h-10 px-3 rounded-md border border-brand-line text-brand-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber bg-white w-48"
          autoFocus
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="h-10 px-4 rounded-md bg-brand-amber hover:bg-brand-amber-deep text-brand-ink font-semibold text-sm disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={() => { setShowInput(false); setError(null); }}
          className="h-10 px-4 rounded-md border border-brand-line text-brand-ink hover:bg-brand-paper text-sm font-medium transition-colors"
        >
          Cancel
        </button>
        {error && <p className="w-full text-xs text-risk-high">{error}</p>}
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowInput(true)}
      className="h-10 px-4 rounded-md border border-brand-line text-brand-ink hover:bg-brand-paper text-sm font-medium transition-colors"
    >
      Save as Template
    </button>
  );
}

interface EmailActionProps {
  documentId: string;
}

export function EmailAction({ documentId }: EmailActionProps) {
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    if (!email.trim()) { setError('Email address is required.'); return; }
    setSending(true);
    setError(null);
    try {
      const res = await fetch('/api/email-swms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ swmsId: documentId, toEmail: email.trim() }),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        throw new Error(d.error ?? 'Could not send email.');
      }
      setFeedback(`Sent to ${email.trim()}`);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setSending(false);
    }
  }

  if (feedback) {
    return <span className="text-sm text-risk-low font-medium">{feedback}</span>;
  }

  if (showForm) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="recipient@email.com"
          className="h-10 px-3 rounded-md border border-brand-line text-brand-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber bg-white w-52"
          autoFocus
        />
        <button
          onClick={handleSend}
          disabled={sending}
          className="h-10 px-4 rounded-md bg-brand-amber hover:bg-brand-amber-deep text-brand-ink font-semibold text-sm disabled:opacity-50 transition-colors"
        >
          {sending ? 'Sending…' : 'Send'}
        </button>
        <button
          onClick={() => { setShowForm(false); setError(null); }}
          className="h-10 px-4 rounded-md border border-brand-line text-brand-ink hover:bg-brand-paper text-sm font-medium transition-colors"
        >
          Cancel
        </button>
        {error && <p className="w-full text-xs text-risk-high">{error}</p>}
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowForm(true)}
      className="h-10 px-4 rounded-md border border-brand-line text-brand-ink hover:bg-brand-paper text-sm font-medium transition-colors"
    >
      Email SWMS
    </button>
  );
}

interface DocxActionProps {
  documentId: string;
  documentNumber: string;
}

export function DocxAction({ documentId, documentNumber }: DocxActionProps) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setDownloading(true);
    setError(null);
    try {
      const res = await fetch('/api/docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ swmsId: documentId }),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        throw new Error(d.error ?? 'Could not generate DOCX.');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${documentNumber}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="h-10 px-4 rounded-md border border-brand-line text-brand-ink hover:bg-brand-paper text-sm font-medium disabled:opacity-50 transition-colors"
      >
        {downloading ? 'Preparing DOCX…' : 'Download DOCX'}
      </button>
      {error && <p className="text-xs text-risk-high">{error}</p>}
    </div>
  );
}

interface QrActionProps {
  documentId: string;
}

export function QrAction({ documentId }: QrActionProps) {
  const [loading, setLoading] = useState(false);
  const [qrData, setQrData] = useState<{ qrDataUrl: string; signUrl: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/qr-sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ swmsId: documentId }),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        throw new Error(d.error ?? 'Could not generate QR code.');
      }
      const d = await res.json() as { qrDataUrl: string; signUrl: string };
      setQrData(d);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!qrData) return;
    await navigator.clipboard.writeText(qrData.signUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-2">
      {!qrData && (
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="h-10 px-4 rounded-md border border-brand-line text-brand-ink hover:bg-brand-paper text-sm font-medium disabled:opacity-50 transition-colors"
        >
          {loading ? 'Generating QR…' : 'QR Sign-off'}
        </button>
      )}
      {error && <p className="text-xs text-risk-high">{error}</p>}
      {qrData && (
        <div className="bg-brand-paper border border-brand-line rounded-xl p-4 space-y-3 max-w-xs">
          <p className="text-sm font-semibold text-brand-ink">QR Sign-off</p>
          <img
            src={qrData.qrDataUrl}
            alt="QR code for worker sign-off"
            className="w-32 h-32 block"
          />
          <div className="space-y-1">
            <p className="text-xs text-brand-steel">Share this link with workers:</p>
            <div className="flex items-center gap-2">
              <span className="text-xs font-[family-name:var(--font-mono-plex)] text-brand-ink break-all flex-1 min-w-0">
                {qrData.signUrl}
              </span>
              <button
                onClick={handleCopy}
                className="shrink-0 h-8 px-3 rounded-md border border-brand-line text-brand-ink text-xs font-medium hover:bg-white transition-colors"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          <button
            onClick={() => setQrData(null)}
            className="text-xs text-brand-steel hover:text-brand-ink transition-colors"
          >
            Hide
          </button>
        </div>
      )}
    </div>
  );
}
