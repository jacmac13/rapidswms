'use client';
export function LoadingSpinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-brand-steel">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-amber border-t-transparent" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}
