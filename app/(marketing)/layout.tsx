import { MarketingNav } from '@/components/layout/MarketingNav';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-paper flex flex-col">
      <MarketingNav />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-brand-line bg-white px-4 py-8">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-brand-steel">
          <span className="font-[family-name:var(--font-archivo-black)] text-brand-ink">RapidSWMS</span>
          <p>© {new Date().getFullYear()} RapidSWMS. Built for Australian tradies.</p>
          <div className="flex gap-4">
            <a href="/pricing" className="hover:text-brand-ink transition-colors">Pricing</a>
            <a href="/login" className="hover:text-brand-ink transition-colors">Sign in</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
