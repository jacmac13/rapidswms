'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function DashboardNav() {
  const pathname = usePathname();

  const links = [
    { href: '/generate', label: 'Generate' },
    { href: '/history', label: 'History' },
    { href: '/templates', label: 'Templates' },
    { href: '/account', label: 'Account' },
  ];

  return (
    <nav className="border-b border-brand-line bg-white sticky top-0 z-50">
      <div className="px-4 py-3 flex items-center justify-between">
        <Link
          href="/generate"
          className="font-[family-name:var(--font-archivo-black)] text-brand-ink text-lg tracking-tight"
        >
          RapidSWMS
        </Link>
        <div className="flex gap-1">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`h-9 px-3 sm:px-4 rounded-md text-sm font-medium transition-colors flex items-center ${
                pathname === href
                  ? 'bg-brand-paper text-brand-ink'
                  : 'text-brand-steel hover:text-brand-ink hover:bg-brand-paper'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
