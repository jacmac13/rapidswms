'use client';
import Link from 'next/link';

export function DashboardNav() {
  return (
    <nav className="border-b border-brand-line bg-white px-4 py-3 flex items-center justify-between">
      <Link href="/generate" className="font-black text-brand-ink text-lg">RapidSWMS</Link>
      <div className="flex gap-4 text-sm text-brand-steel">
        <Link href="/generate">Generate</Link>
        <Link href="/history">History</Link>
        <Link href="/account">Account</Link>
      </div>
    </nav>
  );
}
