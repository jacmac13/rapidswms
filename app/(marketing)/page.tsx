import Link from 'next/link';

const TRADES = [
  'Electricians', 'Plumbers', 'Roofers', 'Solar Installers',
  'Concreters', 'Carpenters', 'Painters', 'HVAC Techs',
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Describe the job',
    body: 'Type what you\'re doing, where, and any key details — in plain English. No forms, no templates.',
  },
  {
    step: '02',
    title: 'We handle the WHS law',
    body: 'Our AI applies the WHS Act, Regs 291–306, and the right state regulator rules automatically.',
  },
  {
    step: '03',
    title: 'Download and sign on site',
    body: 'Get a complete, print-ready PDF with hazard controls, risk ratings, and a worker sign-off table.',
  },
];

const FEATURES = [
  {
    icon: '⚡',
    title: 'Under 60 seconds',
    body: 'From job description to finished SWMS faster than you can find a blank template.',
  },
  {
    icon: '⚖️',
    title: 'Safe Work Australia aligned',
    body: 'Every SWMS follows WHS Reg 291 high-risk work categories and the hierarchy of controls.',
  },
  {
    icon: '📍',
    title: 'State-specific',
    body: 'Legislation and references are tailored to your state — NSW, VIC, QLD, WA, SA, TAS, ACT or NT.',
  },
  {
    icon: '📋',
    title: 'Print-ready PDF',
    body: 'Professional layout with your business details, risk ratings, and 8-worker sign-off table.',
  },
  {
    icon: '🔒',
    title: 'Your docs, your data',
    body: 'Every SWMS is saved to your account. Pull up any past document and re-download anytime.',
  },
  {
    icon: '📱',
    title: 'Works on your phone',
    body: 'Generate on site from any device. No app to install, no laptop required.',
  },
];

export default function LandingPage() {
  return (
    <div className="text-brand-ink">

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 pt-20 pb-16 text-center">
        <div className="inline-block bg-brand-amber text-brand-ink text-xs font-semibold px-3 py-1.5 rounded-full mb-6 uppercase tracking-wide">
          Built for Australian tradies
        </div>
        <h1 className="text-5xl sm:text-6xl font-[family-name:var(--font-archivo-black)] leading-tight text-brand-ink mb-6">
          SWMS in{' '}
          <span className="text-brand-amber-deep">60 seconds.</span>
        </h1>
        <p className="text-xl text-brand-steel max-w-2xl mx-auto mb-10">
          Describe the job in plain English. RapidSWMS generates a complete,
          Safe Work Australia–aligned Safe Work Method Statement — ready to print and sign on site.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/signup"
            className="inline-block h-13 px-8 rounded-lg bg-brand-amber hover:bg-brand-amber-deep text-brand-ink font-semibold text-lg leading-[52px] transition-colors"
          >
            Start free — 7-day trial
          </Link>
          <Link
            href="/pricing"
            className="inline-block h-13 px-8 rounded-lg border border-brand-line bg-white hover:bg-brand-paper text-brand-ink font-semibold text-lg leading-[52px] transition-colors"
          >
            See pricing
          </Link>
        </div>
        <p className="text-sm text-brand-steel mt-4">No credit card required. Cancel anytime.</p>
      </section>

      {/* Trade strip */}
      <section className="border-y border-brand-line bg-white py-4 overflow-hidden">
        <div className="flex gap-8 items-center justify-center flex-wrap px-4">
          {TRADES.map(t => (
            <span key={t} className="text-sm font-semibold text-brand-steel whitespace-nowrap">
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-[family-name:var(--font-archivo-black)] text-center mb-12">
          Three steps, done.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {HOW_IT_WORKS.map(item => (
            <div key={item.step} className="flex flex-col">
              <span className="font-[family-name:var(--font-mono-plex)] text-4xl font-bold text-brand-amber mb-4">
                {item.step}
              </span>
              <h3 className="text-lg font-[family-name:var(--font-archivo-black)] text-brand-ink mb-2">
                {item.title}
              </h3>
              <p className="text-brand-steel leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sample output preview */}
      <section className="bg-brand-paper-2 border-y border-brand-line py-16">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-[family-name:var(--font-archivo-black)] text-center mb-3">
            What you get
          </h2>
          <p className="text-center text-brand-steel mb-10">
            Every SWMS includes all sections required under WHS Reg 291.
          </p>
          <div className="bg-white rounded-2xl border border-brand-line shadow-sm overflow-hidden">
            {/* Mock disclaimer */}
            <div className="bg-brand-amber px-4 py-2.5">
              <p className="text-brand-ink text-sm font-semibold">⚠ AI-generated draft — review before use on site</p>
            </div>
            {/* Mock header */}
            <div className="px-6 py-5 border-b border-brand-line">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-[family-name:var(--font-archivo-black)]">
                    Rooftop Solar PV Installation
                  </h3>
                  <p className="text-brand-steel text-sm mt-1">Sunshine Solar · Solar Installer · QLD</p>
                </div>
                <div className="text-right">
                  <p className="font-[family-name:var(--font-mono-plex)] text-xs text-brand-steel">SWMS-2026-4821</p>
                  <p className="text-xs text-brand-steel mt-0.5">5 June 2026</p>
                </div>
              </div>
            </div>
            {/* Mock sections list */}
            <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                '⚠ High-Risk Work flags',
                '🦺 Required PPE',
                '📄 Permits & Licences',
                '🔧 7 Work Activities',
                '🚨 Emergency Procedures',
                '⚖️ Legislation & Standards',
                '✍️ Worker Sign-off table',
                '📊 Risk ratings (initial → residual)',
                '🏢 Your business details',
              ].map(item => (
                <div key={item} className="flex items-center gap-2 text-sm text-brand-charcoal">
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="max-w-4xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-[family-name:var(--font-archivo-black)] text-center mb-12">
          Everything a tradie needs
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {FEATURES.map(f => (
            <div key={f.title} className="bg-white border border-brand-line rounded-xl p-6">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-[family-name:var(--font-archivo-black)] text-brand-ink mb-2">
                {f.title}
              </h3>
              <p className="text-sm text-brand-steel leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Disclaimer note */}
      <section className="max-w-3xl mx-auto px-4 pb-8">
        <div className="bg-brand-paper border border-brand-line rounded-xl p-5 text-center">
          <p className="text-sm text-brand-steel">
            <strong className="text-brand-ink">Important:</strong> RapidSWMS generates a draft SWMS using AI.
            Always review the output before use on site. You remain responsible for ensuring the SWMS
            is accurate and appropriate for the specific work and conditions.
          </p>
        </div>
      </section>

      {/* CTA footer */}
      <section className="bg-brand-charcoal py-20">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-[family-name:var(--font-archivo-black)] text-white mb-4">
            Stop writing SWMS by hand.
          </h2>
          <p className="text-lg text-brand-steel mb-8">
            Join tradies across Australia who generate compliant SWMS in under a minute.
          </p>
          <Link
            href="/signup"
            className="inline-block h-13 px-10 rounded-lg bg-brand-amber hover:bg-brand-amber-deep text-brand-ink font-semibold text-lg leading-[52px] transition-colors"
          >
            Start your free 7-day trial
          </Link>
          <p className="text-sm text-brand-steel mt-4">No credit card required.</p>
        </div>
      </section>

    </div>
  );
}
