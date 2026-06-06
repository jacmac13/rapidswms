import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TRADES, STATES, getTradeBySlug, getStateBySlug } from '@/lib/seo-data';

type Props = {
  params: Promise<{ trade: string; state: string }>;
};

export async function generateStaticParams() {
  const params: { trade: string; state: string }[] = [];
  for (const trade of TRADES) {
    for (const state of STATES) {
      params.push({ trade: trade.slug, state: state.slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { trade: tradeSlug, state: stateSlug } = await params;
  const trade = getTradeBySlug(tradeSlug);
  const state = getStateBySlug(stateSlug);
  if (!trade || !state) return {};

  const title = `${trade.name} SWMS ${state.abbr} — ${state.regulator} Compliant | RapidSWMS`;
  const description = `Generate a ${state.name} ${trade.name.toLowerCase()} Safe Work Method Statement in under 60 seconds. Compliant with ${state.whsAct} and ${state.regulator} requirements.`;

  return {
    title,
    description,
    openGraph: { title, description },
  };
}

export default async function TradeStatePage({ params }: Props) {
  const { trade: tradeSlug, state: stateSlug } = await params;
  const tradeData = getTradeBySlug(tradeSlug);
  const stateData = getStateBySlug(stateSlug);
  if (!tradeData || !stateData) notFound();

  const trade = tradeData!;
  const state = stateData!;
  const otherStates = STATES.filter(s => s.slug !== state.slug);

  return (
    <div className="text-brand-ink">

      {/* Breadcrumb */}
      <div className="max-w-4xl mx-auto px-4 pt-8 pb-0">
        <nav className="text-sm text-brand-steel flex items-center gap-2 flex-wrap">
          <Link href="/swms" className="hover:text-brand-ink transition-colors">SWMS Templates</Link>
          <span>/</span>
          <Link href={`/swms/${trade.slug}`} className="hover:text-brand-ink transition-colors">{trade.name}</Link>
          <span>/</span>
          <span className="text-brand-ink font-medium">{state.abbr}</span>
        </nav>
      </div>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 pt-8 pb-12">
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="inline-block bg-brand-amber text-brand-ink text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide">
            {state.abbr}
          </span>
          <span className="inline-block bg-white border border-brand-line text-brand-steel text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide">
            {trade.plural}
          </span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-[family-name:var(--font-archivo-black)] leading-tight mb-4">
          {trade.name} SWMS —{' '}
          <span className="text-brand-amber-deep">{state.name}</span>
        </h1>
        <p className="text-lg text-brand-steel max-w-2xl mb-4">
          Generate a {state.name} {trade.name.toLowerCase()} Safe Work Method Statement in under 60 seconds.
          Legislation and references are automatically tailored to {state.regulator} requirements.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/signup"
            className="inline-block h-12 px-8 rounded-lg bg-brand-amber hover:bg-brand-amber-deep text-brand-ink font-semibold leading-[48px] transition-colors"
          >
            Generate your SWMS — free trial
          </Link>
          <Link
            href={`/swms/${trade.slug}`}
            className="inline-block h-12 px-6 rounded-lg border border-brand-line bg-white hover:bg-brand-paper text-brand-ink font-semibold leading-[48px] transition-colors"
          >
            All {trade.name} states
          </Link>
        </div>
      </section>

      {/* State regulator info */}
      <section className="bg-brand-paper-2 border-y border-brand-line py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-[family-name:var(--font-archivo-black)] mb-6">
            {state.name} WHS Requirements
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-brand-line rounded-xl p-5">
              <h3 className="font-semibold text-brand-ink mb-1">Regulator</h3>
              <p className="text-brand-charcoal">{state.regulator}</p>
            </div>
            <div className="bg-white border border-brand-line rounded-xl p-5">
              <h3 className="font-semibold text-brand-ink mb-1">Governing Legislation</h3>
              <p className="text-brand-charcoal">{state.whsAct}</p>
            </div>
          </div>
          <div className="bg-white border border-brand-line rounded-xl p-5 mt-4">
            <h3 className="font-semibold text-brand-ink mb-2">About {state.name}</h3>
            <p className="text-brand-steel">{state.note}</p>
          </div>
        </div>
      </section>

      {/* Trade info */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-[family-name:var(--font-archivo-black)] mb-4">
          {trade.name} Work in {state.name}
        </h2>
        <p className="text-brand-steel mb-8">{trade.intro}</p>
        <h3 className="font-[family-name:var(--font-archivo-black)] text-lg mb-4">
          Common Jobs
        </h3>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {trade.commonJobs.map(job => (
            <li key={job} className="flex items-start gap-3 bg-white border border-brand-line rounded-lg p-4">
              <span className="text-brand-amber font-bold mt-0.5">✓</span>
              <span className="text-brand-charcoal">{job}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* What's in the SWMS */}
      <section className="bg-brand-charcoal py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-[family-name:var(--font-archivo-black)] text-white mb-6">
            What RapidSWMS Generates for You
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            {[
              `${state.regulator}-compliant legislation references`,
              'High-risk work category flags (WHS Reg 291)',
              'Required PPE and permits for this job',
              'Step-by-step work activity sequence',
              'Hazard identification per activity',
              'Initial and residual risk ratings',
              'Hierarchy of controls for each hazard',
              'Emergency procedures',
              'Worker sign-off table',
              'Your business name, ABN, and document number',
            ].map(item => (
              <div key={item} className="flex items-center gap-3">
                <span className="text-brand-amber font-bold">✓</span>
                <span className="text-white text-sm">{item}</span>
              </div>
            ))}
          </div>
          <Link
            href="/signup"
            className="inline-block h-12 px-8 rounded-lg bg-brand-amber hover:bg-brand-amber-deep text-brand-ink font-semibold leading-[48px] transition-colors"
          >
            Start free — 7-day trial
          </Link>
          <p className="text-brand-steel text-sm mt-3">No credit card required.</p>
        </div>
      </section>

      {/* Other states */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-xl font-[family-name:var(--font-archivo-black)] mb-4">
          {trade.name} SWMS — Other States
        </h2>
        <div className="flex flex-wrap gap-3">
          {otherStates.map(s => (
            <Link
              key={s.slug}
              href={`/swms/${trade.slug}/${s.slug}`}
              className="bg-white border border-brand-line rounded-lg px-4 py-2 text-sm font-semibold text-brand-steel hover:border-brand-amber hover:text-brand-ink transition-all"
            >
              {s.abbr} — {s.name}
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
