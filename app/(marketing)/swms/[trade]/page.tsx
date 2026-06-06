import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TRADES, STATES, getTradeBySlug } from '@/lib/seo-data';

type Props = {
  params: Promise<{ trade: string }>;
};

export async function generateStaticParams() {
  return TRADES.map(t => ({ trade: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { trade: tradeSlug } = await params;
  const trade = getTradeBySlug(tradeSlug);
  if (!trade) return {};

  const title = `${trade.name} SWMS Template — Generate in 60 Seconds | RapidSWMS`;
  const description = `Generate a compliant ${trade.name} Safe Work Method Statement in under 60 seconds. Safe Work Australia aligned, state-specific legislation, print-ready PDF.`;

  return {
    title,
    description,
    openGraph: { title, description },
  };
}

export default async function TradePage({ params }: Props) {
  const { trade: tradeSlug } = await params;
  const tradeData = getTradeBySlug(tradeSlug);
  if (!tradeData) notFound();
  const trade = tradeData!;

  return (
    <div className="text-brand-ink">

      {/* Breadcrumb */}
      <div className="max-w-4xl mx-auto px-4 pt-8 pb-0">
        <nav className="text-sm text-brand-steel flex items-center gap-2">
          <Link href="/swms" className="hover:text-brand-ink transition-colors">SWMS Templates</Link>
          <span>/</span>
          <span className="text-brand-ink font-medium">{trade.name}</span>
        </nav>
      </div>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 pt-8 pb-12">
        <div className="inline-block bg-brand-amber text-brand-ink text-xs font-semibold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
          {trade.plural}
        </div>
        <h1 className="text-4xl sm:text-5xl font-[family-name:var(--font-archivo-black)] leading-tight mb-4">
          {trade.name} SWMS —{' '}
          <span className="text-brand-amber-deep">Generated in 60 Seconds</span>
        </h1>
        <p className="text-lg text-brand-steel max-w-2xl mb-6">{trade.intro}</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/signup"
            className="inline-block h-12 px-8 rounded-lg bg-brand-amber hover:bg-brand-amber-deep text-brand-ink font-semibold leading-[48px] transition-colors"
          >
            Generate your SWMS — free trial
          </Link>
          <Link
            href="/swms"
            className="inline-block h-12 px-6 rounded-lg border border-brand-line bg-white hover:bg-brand-paper text-brand-ink font-semibold leading-[48px] transition-colors"
          >
            All trades
          </Link>
        </div>
      </section>

      {/* Common jobs */}
      <section className="bg-brand-paper-2 border-y border-brand-line py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-[family-name:var(--font-archivo-black)] mb-6">
            Common {trade.name} Jobs Requiring a SWMS
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {trade.commonJobs.map(job => (
              <li key={job} className="flex items-start gap-3 bg-white border border-brand-line rounded-lg p-4">
                <span className="text-brand-amber font-bold mt-0.5">✓</span>
                <span className="text-brand-charcoal">{job}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Licence note */}
      <section className="max-w-4xl mx-auto px-4 py-10">
        <div className="bg-white border border-brand-line rounded-xl p-6">
          <h3 className="font-[family-name:var(--font-archivo-black)] text-brand-ink mb-2">
            Licensing
          </h3>
          <p className="text-brand-steel">{trade.licenceNote}</p>
        </div>
      </section>

      {/* State pages grid */}
      <section className="max-w-4xl mx-auto px-4 pb-12">
        <h2 className="text-2xl font-[family-name:var(--font-archivo-black)] mb-2">
          {trade.name} SWMS by State
        </h2>
        <p className="text-brand-steel mb-6">
          Every state and territory has its own WHS regulator and legislation references.
          Select your state for a jurisdiction-specific SWMS.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STATES.map(state => (
            <Link
              key={state.slug}
              href={`/swms/${trade.slug}/${state.slug}`}
              className="bg-white border border-brand-line rounded-xl p-4 text-center hover:border-brand-amber hover:shadow-sm transition-all group"
            >
              <div className="font-[family-name:var(--font-archivo-black)] text-2xl text-brand-ink group-hover:text-brand-amber-deep transition-colors">
                {state.abbr}
              </div>
              <div className="text-xs text-brand-steel mt-1">{state.name}</div>
              <div className="text-xs text-brand-amber-deep font-semibold mt-2">View →</div>
            </Link>
          ))}
        </div>
      </section>

      {/* What's included */}
      <section className="bg-brand-charcoal py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-[family-name:var(--font-archivo-black)] text-white mb-6">
            What's in Every {trade.name} SWMS
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              'High-risk work category flags (WHS Reg 291)',
              'Required PPE and permits',
              'Step-by-step work activity sequence',
              'Hazard identification per activity',
              'Initial and residual risk ratings (5×5 matrix)',
              'Hierarchy of controls for each hazard',
              'Emergency procedures',
              'Relevant legislation and Australian Standards',
              'Worker sign-off table (8 workers)',
              'Your business name, ABN, and document number',
            ].map(item => (
              <div key={item} className="flex items-center gap-3">
                <span className="text-brand-amber font-bold">✓</span>
                <span className="text-white text-sm">{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Link
              href="/signup"
              className="inline-block h-12 px-8 rounded-lg bg-brand-amber hover:bg-brand-amber-deep text-brand-ink font-semibold leading-[48px] transition-colors"
            >
              Start your free 7-day trial
            </Link>
            <p className="text-brand-steel text-sm mt-3">No credit card required.</p>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="max-w-4xl mx-auto px-4 py-8">
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
