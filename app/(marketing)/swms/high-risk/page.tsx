import type { Metadata } from 'next';
import Link from 'next/link';
import { HRCW_CATEGORIES } from '@/lib/seo-data';

export const metadata: Metadata = {
  title: 'High-Risk Construction Work SWMS — WHS Reg 291 Categories | RapidSWMS',
  description:
    'Generate a SWMS for any of the 18 high-risk construction work categories under WHS Reg 291. Safe Work Australia aligned, state-specific legislation included.',
};

export default function HighRiskIndexPage() {
  return (
    <div className="text-brand-ink">
      <div className="max-w-4xl mx-auto px-4 pt-8 pb-0">
        <nav className="text-sm text-brand-steel flex items-center gap-2">
          <Link href="/swms" className="hover:text-brand-ink transition-colors">SWMS Templates</Link>
          <span>/</span>
          <span className="text-brand-ink font-medium">High-Risk Work</span>
        </nav>
      </div>

      <section className="max-w-4xl mx-auto px-4 pt-8 pb-12">
        <h1 className="text-4xl sm:text-5xl font-[family-name:var(--font-archivo-black)] leading-tight mb-4">
          High-Risk Construction Work SWMS
        </h1>
        <p className="text-lg text-brand-steel max-w-2xl">
          WHS Regulation 291 lists 18 categories of high-risk construction work, each requiring a
          Safe Work Method Statement before work begins. Select the category that applies to your job.
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {HRCW_CATEGORIES.map(cat => (
            <Link
              key={cat.slug}
              href={`/swms/high-risk/${cat.slug}`}
              className="bg-white border border-brand-line rounded-xl p-5 hover:border-brand-amber hover:shadow-sm transition-all group"
            >
              <span className="font-[family-name:var(--font-mono-plex)] text-xs text-brand-steel">
                Reg 291({cat.regNum})
              </span>
              <h2 className="font-[family-name:var(--font-archivo-black)] text-brand-ink group-hover:text-brand-amber-deep transition-colors mt-1 mb-2">
                {cat.name}
              </h2>
              <p className="text-xs text-brand-steel line-clamp-2">{cat.whsText}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-brand-charcoal py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-[family-name:var(--font-archivo-black)] text-white mb-4">
            Generate your SWMS now
          </h2>
          <p className="text-brand-steel mb-8">
            Describe the job. RapidSWMS applies the right WHS Reg 291 categories automatically.
          </p>
          <Link
            href="/signup"
            className="inline-block h-12 px-10 rounded-lg bg-brand-amber hover:bg-brand-amber-deep text-brand-ink font-semibold leading-[48px] transition-colors"
          >
            Start your free 7-day trial
          </Link>
        </div>
      </section>
    </div>
  );
}
