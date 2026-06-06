import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { HRCW_CATEGORIES, TRADES, getHrcwBySlug } from '@/lib/seo-data';

type Props = {
  params: Promise<{ category: string }>;
};

export async function generateStaticParams() {
  return HRCW_CATEGORIES.map(c => ({ category: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const cat = getHrcwBySlug(category);
  if (!cat) return {};

  const title = `${cat.name} SWMS — WHS Reg 291(${cat.regNum}) Compliant | RapidSWMS`;
  const description = `Generate a Safe Work Method Statement for ${cat.name.toLowerCase()} work in under 60 seconds. Covers WHS Reg 291(${cat.regNum}): ${cat.whsText}.`;

  return {
    title,
    description,
    openGraph: { title, description },
  };
}

export default async function HrcwCategoryPage({ params }: Props) {
  const { category } = await params;
  const catData = getHrcwBySlug(category);
  if (!catData) notFound();
  const cat = catData!;

  const relatedTrades = TRADES.filter(t => cat.commonTrades.includes(t.slug));

  return (
    <div className="text-brand-ink">

      {/* Breadcrumb */}
      <div className="max-w-4xl mx-auto px-4 pt-8 pb-0">
        <nav className="text-sm text-brand-steel flex items-center gap-2 flex-wrap">
          <Link href="/swms" className="hover:text-brand-ink transition-colors">SWMS Templates</Link>
          <span>/</span>
          <Link href="/swms/high-risk" className="hover:text-brand-ink transition-colors">High-Risk Work</Link>
          <span>/</span>
          <span className="text-brand-ink font-medium">{cat.name}</span>
        </nav>
      </div>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 pt-8 pb-12">
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="inline-block bg-brand-amber text-brand-ink text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide">
            High-Risk Work
          </span>
          <span className="inline-block bg-white border border-brand-line text-brand-steel font-[family-name:var(--font-mono-plex)] text-xs px-3 py-1 rounded-full">
            WHS Reg 291({cat.regNum})
          </span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-[family-name:var(--font-archivo-black)] leading-tight mb-4">
          {cat.name} SWMS
        </h1>
        <div className="inline-block bg-brand-paper border border-brand-line rounded-lg px-4 py-2 mb-6">
          <p className="text-sm text-brand-steel">
            <strong className="text-brand-ink">WHS Reg 291({cat.regNum}):</strong> {cat.whsText}
          </p>
        </div>
        <p className="text-lg text-brand-steel max-w-2xl mb-8">{cat.intro}</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/signup"
            className="inline-block h-12 px-8 rounded-lg bg-brand-amber hover:bg-brand-amber-deep text-brand-ink font-semibold leading-[48px] transition-colors"
          >
            Generate your SWMS — free trial
          </Link>
          <Link
            href="/swms/high-risk"
            className="inline-block h-12 px-6 rounded-lg border border-brand-line bg-white hover:bg-brand-paper text-brand-ink font-semibold leading-[48px] transition-colors"
          >
            All HRCW categories
          </Link>
        </div>
      </section>

      {/* Key controls */}
      <section className="bg-brand-paper-2 border-y border-brand-line py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-[family-name:var(--font-archivo-black)] mb-6">
            Key Controls for {cat.name}
          </h2>
          <p className="text-brand-steel mb-6">
            These are the minimum control measures your SWMS should address for this work type,
            applying the hierarchy of controls under the WHS Regulations.
          </p>
          <ol className="space-y-3">
            {cat.keyControls.map((control, i) => (
              <li key={i} className="flex items-start gap-4 bg-white border border-brand-line rounded-xl p-4">
                <span className="font-[family-name:var(--font-mono-plex)] text-brand-amber font-bold text-sm w-6 shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-brand-charcoal">{control}</span>
              </li>
            ))}
          </ol>
          <p className="text-sm text-brand-steel mt-4">
            RapidSWMS generates all applicable controls automatically based on your job description.
          </p>
        </div>
      </section>

      {/* Related trades */}
      {relatedTrades.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-[family-name:var(--font-archivo-black)] mb-4">
            Trades That Commonly Perform This Work
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {relatedTrades.map(trade => (
              <Link
                key={trade.slug}
                href={`/swms/${trade.slug}`}
                className="bg-white border border-brand-line rounded-xl p-4 hover:border-brand-amber hover:shadow-sm transition-all group"
              >
                <h3 className="font-[family-name:var(--font-archivo-black)] text-brand-ink group-hover:text-brand-amber-deep transition-colors mb-1">
                  {trade.name}
                </h3>
                <p className="text-sm text-brand-steel line-clamp-2">{trade.tagline}</p>
                <p className="text-xs text-brand-amber-deep font-semibold mt-2">{trade.name} SWMS →</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="bg-brand-charcoal py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-[family-name:var(--font-archivo-black)] text-white mb-6">
            How RapidSWMS Handles {cat.name} Work
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[
              {
                step: '01',
                title: 'Describe the job',
                body: 'Tell us the trade, the work location, and what you\'re doing. Mention any site-specific conditions.',
              },
              {
                step: '02',
                title: 'AI identifies the hazards',
                body: `Our AI flags WHS Reg 291(${cat.regNum}) automatically and identifies the specific hazards for your job.`,
              },
              {
                step: '03',
                title: 'Download and sign',
                body: 'Get a print-ready PDF with all required sections, risk ratings, and a worker sign-off table.',
              },
            ].map(item => (
              <div key={item.step}>
                <span className="font-[family-name:var(--font-mono-plex)] text-3xl font-bold text-brand-amber block mb-3">
                  {item.step}
                </span>
                <h3 className="font-[family-name:var(--font-archivo-black)] text-white mb-2">{item.title}</h3>
                <p className="text-brand-steel text-sm">{item.body}</p>
              </div>
            ))}
          </div>
          <Link
            href="/signup"
            className="inline-block h-12 px-8 rounded-lg bg-brand-amber hover:bg-brand-amber-deep text-brand-ink font-semibold leading-[48px] transition-colors"
          >
            Start your free 7-day trial
          </Link>
          <p className="text-brand-steel text-sm mt-3">No credit card required.</p>
        </div>
      </section>

      {/* Other HRCW categories */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-xl font-[family-name:var(--font-archivo-black)] mb-4">
          Other High-Risk Work Categories
        </h2>
        <div className="flex flex-wrap gap-3">
          {HRCW_CATEGORIES.filter(c => c.slug !== cat.slug).map(c => (
            <Link
              key={c.slug}
              href={`/swms/high-risk/${c.slug}`}
              className="bg-white border border-brand-line rounded-lg px-4 py-2 text-sm font-semibold text-brand-steel hover:border-brand-amber hover:text-brand-ink transition-all"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <section className="max-w-4xl mx-auto px-4 pb-8">
        <div className="bg-brand-paper border border-brand-line rounded-xl p-5">
          <p className="text-sm text-brand-steel">
            <strong className="text-brand-ink">Important:</strong> RapidSWMS generates a draft SWMS using AI.
            Always review the output before use on site. You remain responsible for ensuring the SWMS
            is accurate and appropriate for the specific work and conditions.
          </p>
        </div>
      </section>
    </div>
  );
}
