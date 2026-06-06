import type { Metadata } from 'next';
import Link from 'next/link';
import { TRADES, STATES, HRCW_CATEGORIES } from '@/lib/seo-data';

export const metadata: Metadata = {
  title: 'SWMS Templates — All Trades and High-Risk Work Categories | RapidSWMS',
  description:
    'Generate a compliant Safe Work Method Statement for any Australian trade or high-risk construction work category. Browse by trade or by WHS Reg 291 work type.',
};

export default function SwmsHubPage() {
  return (
    <div className="text-brand-ink">

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 pt-16 pb-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-[family-name:var(--font-archivo-black)] leading-tight mb-4">
          SWMS for Every Trade and Work Type
        </h1>
        <p className="text-lg text-brand-steel max-w-2xl mx-auto mb-8">
          Select your trade or your type of high-risk construction work to see how RapidSWMS
          generates a Safe Work Australia–aligned SWMS in under 60 seconds.
        </p>
        <Link
          href="/signup"
          className="inline-block h-12 px-8 rounded-lg bg-brand-amber hover:bg-brand-amber-deep text-brand-ink font-semibold leading-[48px] transition-colors"
        >
          Start free — 7-day trial
        </Link>
      </section>

      {/* Browse by Trade */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-[family-name:var(--font-archivo-black)] mb-2">
          Browse by Trade
        </h2>
        <p className="text-brand-steel mb-8">
          Each trade page covers the typical SWMS requirements for that trade, with state-specific
          variants for all 8 Australian states and territories.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {TRADES.map(trade => (
            <Link
              key={trade.slug}
              href={`/swms/${trade.slug}`}
              className="bg-white border border-brand-line rounded-xl p-5 hover:border-brand-amber hover:shadow-sm transition-all group"
            >
              <h3 className="font-[family-name:var(--font-archivo-black)] text-brand-ink group-hover:text-brand-amber-deep transition-colors mb-1">
                {trade.name} SWMS
              </h3>
              <p className="text-sm text-brand-steel line-clamp-2">{trade.tagline}</p>
              <p className="text-xs text-brand-amber-deep font-semibold mt-3">
                8 state variants →
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-brand-line" />

      {/* Browse by HRCW Category */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-[family-name:var(--font-archivo-black)] mb-2">
          Browse by High-Risk Construction Work Type
        </h2>
        <p className="text-brand-steel mb-8">
          WHS Reg 291 lists 18 categories of high-risk construction work, each requiring a SWMS.
          Select the category that applies to your job.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {HRCW_CATEGORIES.map(cat => (
            <Link
              key={cat.slug}
              href={`/swms/high-risk/${cat.slug}`}
              className="bg-white border border-brand-line rounded-xl p-5 hover:border-brand-amber hover:shadow-sm transition-all group"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="font-[family-name:var(--font-mono-plex)] text-xs text-brand-steel">
                  Reg 291({cat.regNum})
                </span>
              </div>
              <h3 className="font-[family-name:var(--font-archivo-black)] text-brand-ink group-hover:text-brand-amber-deep transition-colors mb-1">
                {cat.name}
              </h3>
              <p className="text-xs text-brand-steel line-clamp-2">{cat.whsText}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* State strip */}
      <section className="bg-brand-paper-2 border-y border-brand-line py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm font-semibold text-brand-steel mb-4 uppercase tracking-wide">
            State-specific legislation for all Australian jurisdictions
          </p>
          <div className="flex gap-4 flex-wrap justify-center">
            {STATES.map(s => (
              <span
                key={s.slug}
                className="text-sm font-semibold text-brand-charcoal bg-white border border-brand-line rounded-lg px-3 py-1.5"
              >
                {s.abbr} — {s.regulator}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-charcoal py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-[family-name:var(--font-archivo-black)] text-white mb-4">
            Ready to generate your SWMS?
          </h2>
          <p className="text-brand-steel mb-8">
            Describe the job. We handle the WHS law. Done in under 60 seconds.
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
