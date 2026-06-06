'use client';

import { useRef, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { motion, useInView, animate } from 'framer-motion';

// ─── Data ─────────────────────────────────────────────────────────────────────

const HEADLINE = ['SWMS', 'in', '60', 'seconds.'];

const TRADES = [
  'Electricians', 'Plumbers', 'Roofers', 'Solar Installers', 'Concreters',
  'Carpenters', 'Painters', 'HVAC Techs', 'Scaffolders', 'Steel Fixers',
  'Waterproofers', 'Tilers', 'Bricklayers', 'Glaziers', 'Excavators', 'Demolition',
];

const STEPS = [
  {
    n: '01', title: 'Describe the job',
    body: "Type what you're doing, where, and any key details — in plain English. No forms, no templates.",
  },
  {
    n: '02', title: 'We handle the WHS law',
    body: 'Our AI applies the WHS Act, Regs 291–306, and the right state regulator rules automatically.',
  },
  {
    n: '03', title: 'Download and sign on site',
    body: 'Get a complete, print-ready PDF with hazard controls, risk ratings, and a worker sign-off table.',
  },
];

const FEATURES = [
  { icon: '⚡', title: 'Under 60 seconds', body: 'From job description to finished SWMS faster than you can find a blank template.', wide: true },
  { icon: '⚖️', title: 'WHS aligned', body: 'Every SWMS follows WHS Reg 291 high-risk categories and the hierarchy of controls.', wide: false },
  { icon: '📍', title: 'State-specific', body: 'Legislation tailored to NSW, VIC, QLD, WA, SA, TAS, ACT or NT automatically.', wide: false },
  { icon: '📋', title: 'Print-ready PDF', body: 'Professional layout with risk ratings, PPE lists, and an 8-worker sign-off table.', wide: false },
  { icon: '🔒', title: 'Your docs, your data', body: 'Every SWMS saved to your account. Re-download any past document anytime.', wide: true },
];

const PLANS = [
  {
    key: 'solo', name: 'Solo', price: 22, desc: '1 user', hot: false,
    features: ['Unlimited SWMS (20/day)', 'PDF export', 'SWMS history', '7-day free trial'],
  },
  {
    key: 'crew', name: 'Small Crew', price: 48, desc: 'Up to 5 workers', hot: true,
    features: ['Everything in Solo', 'Up to 5 worker sign-offs', '7-day free trial'],
  },
  {
    key: 'business', name: 'Business', price: 76, desc: 'Unlimited workers', hot: false,
    features: ['Everything in Crew', 'Unlimited workers', 'White-label PDF', '7-day free trial'],
  },
];

// ─── Animation variants ────────────────────────────────────────────────────────

const fu = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const sg = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Btn({ href, children, primary }: { href: string; children: ReactNode; primary?: boolean }) {
  return (
    <motion.div className="inline-block"
      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}>
      <Link href={href} className={`inline-flex items-center justify-center px-8 py-4 rounded-xl font-semibold text-base transition-colors ${
        primary
          ? 'bg-brand-amber hover:bg-brand-amber-deep text-brand-ink'
          : 'border border-brand-line-dark hover:border-brand-steel text-white'
      }`}>
        {children}
      </Link>
    </motion.div>
  );
}

function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const c = animate(0, to, { duration: 2.2, ease: 'easeOut', onUpdate: v => setVal(Math.floor(v)) });
    return () => c.stop();
  }, [inView, to]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const stepRef = useRef(null);
  const stepInView = useInView(stepRef, { once: true, amount: 0.3 });
  const marqueeItems = [...TRADES, ...TRADES];

  return (
    <div className="bg-brand-ink text-white overflow-x-hidden">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-20 overflow-hidden">
        {/* Ambient glow */}
        <motion.div className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5 }}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-[700px] h-[420px] rounded-full bg-brand-amber opacity-[0.07] blur-[130px]" />
          <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] rounded-full bg-blue-600 opacity-[0.04] blur-[110px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] rounded-full bg-brand-amber opacity-[0.03] blur-[90px]" />
        </motion.div>

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          {/* Badge */}
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}>
            <span className="inline-flex items-center gap-2.5 bg-brand-charcoal border border-brand-line-dark text-brand-amber text-xs font-semibold px-4 py-2 rounded-full mb-10 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-amber animate-pulse" />
              Built for Australian tradies
            </span>
          </motion.div>

          {/* Word-by-word headline */}
          <motion.h1
            className="text-[clamp(3.5rem,10vw,96px)] font-[family-name:var(--font-archivo-black)] leading-none tracking-tight mb-8"
            variants={sg} initial="hidden" animate="visible">
            {HEADLINE.map((w) => (
              <motion.span key={w} variants={fu}
                className={`inline-block mr-[0.22em] last:mr-0 ${
                  w === '60' || w === 'seconds.' ? 'text-brand-amber' : 'text-white'
                }`}>
                {w}
              </motion.span>
            ))}
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            className="text-xl sm:text-2xl text-brand-steel max-w-2xl mx-auto mb-10 leading-relaxed"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9, delay: 0.75 }}>
            Describe the job in plain English. RapidSWMS generates a complete,
            Safe Work Australia–aligned SWMS — ready to print and sign on site.
          </motion.p>

          {/* CTAs */}
          <motion.div className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.95 }}>
            <Btn href="/signup" primary>Start free — 7-day trial</Btn>
            <Btn href="/pricing">See pricing</Btn>
          </motion.div>

          <motion.p className="text-sm text-brand-steel mt-5"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.15 }}>
            No credit card required. Cancel anytime.
          </motion.p>
        </div>

        <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-brand-ink to-transparent pointer-events-none" />
      </section>

      {/* ── Trades marquee ────────────────────────────────────────────────── */}
      <div className="border-y border-brand-line-dark bg-brand-charcoal py-4 overflow-hidden select-none">
        <motion.div
          className="flex items-center"
          style={{ width: 'max-content' }}
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 32, ease: 'linear', repeat: Infinity, repeatType: 'loop' }}>
          {marqueeItems.map((t, i) => (
            <span key={i} className="flex items-center text-[11px] font-semibold text-brand-steel uppercase tracking-[0.2em] whitespace-nowrap">
              <span className="px-7">{t}</span>
              <span className="text-brand-amber opacity-40">✦</span>
            </span>
          ))}
        </motion.div>
      </div>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-28">
        <motion.div className="text-center mb-20"
          initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.4 }} variants={sg}>
          <motion.p variants={fu} className="text-brand-amber text-xs font-semibold uppercase tracking-widest mb-4">
            How it works
          </motion.p>
          <motion.h2 variants={fu} className="text-4xl sm:text-5xl font-[family-name:var(--font-archivo-black)]">
            Three steps, done.
          </motion.h2>
        </motion.div>

        <div ref={stepRef} className="relative">
          {/* Connecting line — desktop */}
          <div className="hidden md:block absolute top-12 left-[calc(16.67%+3rem)] right-[calc(16.67%+3rem)] h-px">
            <motion.div className="h-full bg-gradient-to-r from-brand-amber via-brand-amber-deep to-brand-amber rounded-full"
              style={{ transformOrigin: 'left' }}
              initial={{ scaleX: 0 }}
              animate={stepInView ? { scaleX: 1 } : {}}
              transition={{ duration: 1.4, delay: 0.4, ease: [0.22, 1, 0.36, 1] }} />
          </div>

          <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-12"
            variants={sg} initial="hidden" animate={stepInView ? 'visible' : 'hidden'}>
            {STEPS.map((s) => (
              <motion.div key={s.n} variants={fu} className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full border border-brand-line-dark bg-brand-charcoal flex items-center justify-center mb-6 relative z-10">
                  <span className="font-[family-name:var(--font-mono-plex)] text-3xl font-bold text-brand-amber">
                    {s.n}
                  </span>
                </div>
                <h3 className="text-xl font-[family-name:var(--font-archivo-black)] mb-3">{s.title}</h3>
                <p className="text-brand-steel leading-relaxed text-sm">{s.body}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <div className="border-y border-brand-line-dark bg-brand-charcoal">
        <motion.div
          className="max-w-4xl mx-auto px-4 py-16 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center"
          variants={sg} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.4 }}>
          {[
            { to: 12400, suffix: '+', label: 'SWMS generated' },
            { to: 60, suffix: 's', label: 'seconds average' },
            { to: 8, suffix: '', label: 'states covered' },
          ].map((st) => (
            <motion.div key={st.label} variants={fu}>
              <p className="text-5xl font-[family-name:var(--font-archivo-black)] text-brand-amber">
                <Counter to={st.to} suffix={st.suffix} />
              </p>
              <p className="text-brand-steel mt-2 text-xs uppercase tracking-widest">{st.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* ── Features bento ────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-28">
        <motion.div className="text-center mb-16"
          initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={sg}>
          <motion.p variants={fu} className="text-brand-amber text-xs font-semibold uppercase tracking-widest mb-4">
            Features
          </motion.p>
          <motion.h2 variants={fu} className="text-4xl sm:text-5xl font-[family-name:var(--font-archivo-black)]">
            Everything a tradie needs.
          </motion.h2>
        </motion.div>

        <motion.div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
          variants={sg} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}>
          {FEATURES.map((f) => (
            <motion.div key={f.title} variants={fu}
              className={`bg-brand-charcoal border border-brand-line-dark rounded-2xl p-7 flex flex-col cursor-default${f.wide ? ' md:col-span-2' : ''}`}
              whileHover={{ y: -6, boxShadow: '0 20px 48px rgba(0,0,0,0.5)', transition: { duration: 0.2 } }}>
              <div className="text-3xl mb-5">{f.icon}</div>
              <h3 className="font-[family-name:var(--font-archivo-black)] text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-brand-steel leading-relaxed">{f.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-28">
        <motion.div className="text-center mb-16"
          initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={sg}>
          <motion.p variants={fu} className="text-brand-amber text-xs font-semibold uppercase tracking-widest mb-4">
            Pricing
          </motion.p>
          <motion.h2 variants={fu} className="text-4xl sm:text-5xl font-[family-name:var(--font-archivo-black)]">
            Simple, honest pricing.
          </motion.h2>
          <motion.p variants={fu} className="text-brand-steel mt-4">
            7-day free trial on every plan. No credit card required.
          </motion.p>
        </motion.div>

        <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-5"
          variants={sg} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}>
          {PLANS.map((p) => (
            <motion.div key={p.key} variants={fu}
              className={`rounded-2xl p-7 flex flex-col border ${
                p.hot ? 'bg-brand-amber border-brand-amber' : 'bg-brand-charcoal border-brand-line-dark'
              }`}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}>
              {p.hot && (
                <div className="mb-4">
                  <span className="bg-brand-ink text-brand-amber text-xs font-semibold px-3 py-1 rounded-full">
                    Most popular
                  </span>
                </div>
              )}
              <h3 className={`text-xl font-[family-name:var(--font-archivo-black)] ${p.hot ? 'text-brand-ink' : 'text-white'}`}>
                {p.name}
              </h3>
              <p className={`text-sm mt-1 ${p.hot ? 'text-brand-charcoal' : 'text-brand-steel'}`}>{p.desc}</p>
              <div className="mt-5 mb-6">
                <span className={`text-5xl font-[family-name:var(--font-archivo-black)] ${p.hot ? 'text-brand-ink' : 'text-white'}`}>
                  ${p.price}
                </span>
                <span className={`text-sm ${p.hot ? 'text-brand-charcoal' : 'text-brand-steel'}`}>/mo</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {p.features.map((f) => (
                  <li key={f} className={`flex items-start gap-2.5 text-sm ${p.hot ? 'text-brand-charcoal' : 'text-brand-steel'}`}>
                    <span className={`mt-0.5 flex-shrink-0 ${p.hot ? 'text-brand-ink font-bold' : 'text-brand-amber'}`}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}>
                <Link href="/signup"
                  className={`block text-center py-3.5 rounded-xl font-semibold text-sm transition-colors ${
                    p.hot
                      ? 'bg-brand-ink text-white hover:bg-brand-charcoal'
                      : 'bg-brand-amber text-brand-ink hover:bg-brand-amber-deep'
                  }`}>
                  Start free trial
                </Link>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── CTA footer ────────────────────────────────────────────────────── */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[320px] rounded-full bg-brand-amber opacity-[0.07] blur-[110px]" />
        </div>
        <motion.div className="relative max-w-3xl mx-auto px-4 text-center"
          initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={sg}>
          <motion.p variants={fu} className="text-brand-amber text-xs font-semibold uppercase tracking-widest mb-6">
            Get started today
          </motion.p>
          <motion.h2 variants={fu}
            className="text-4xl sm:text-5xl md:text-[clamp(2.5rem,7vw,64px)] font-[family-name:var(--font-archivo-black)] mb-6">
            Stop writing SWMS by hand.
          </motion.h2>
          <motion.p variants={fu} className="text-xl text-brand-steel mb-10">
            Join tradies across Australia who generate compliant SWMS in under a minute.
          </motion.p>
          <motion.div variants={fu} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Btn href="/signup" primary>Start your free 7-day trial</Btn>
            <Btn href="/swms">Browse SWMS templates</Btn>
          </motion.div>
          <motion.p variants={fu} className="text-sm text-brand-steel mt-6">
            No credit card required.
          </motion.p>
          <motion.div variants={fu}
            className="mt-12 p-5 bg-brand-charcoal border border-brand-line-dark rounded-2xl text-left">
            <p className="text-xs text-brand-steel leading-relaxed">
              <strong className="text-white font-semibold">Important:</strong>{' '}
              RapidSWMS generates a draft SWMS using AI. Always review the output before use on site.
              You remain responsible for ensuring the SWMS is accurate and appropriate for the specific
              work and conditions.
            </p>
          </motion.div>
        </motion.div>
      </section>

    </div>
  );
}
