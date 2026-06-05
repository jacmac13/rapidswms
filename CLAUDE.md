# RapidSWMS — Agent Operating Manual

> This file is read by Claude Code at the start of every session.
> It is the single source of truth for what this product is, how it is built,
> and how Claude Code should behave while building it.
> Do not skip sections. Do not infer behaviour not described here.

---

## 1. WHAT THIS PRODUCT IS

**RapidSWMS** is a B2C SaaS web application for Australian tradies and small
construction businesses. Its core function: a user describes a job in plain
English and the app generates a complete, Safe Work Australia–aligned Safe Work
Method Statement (SWMS) in under 60 seconds.

A SWMS is a legal document required under Australian WHS Regulations for
high-risk construction work. Tradies currently spend 30–60 minutes writing
them by hand or from static templates. RapidSWMS eliminates that using the
Anthropic Claude API.

**Target users:** sole trader and small-crew tradies — electricians, plumbers,
roofers, carpenters, solar installers, concreters, painters, and general
construction subcontractors in Australia.

**Business model:** monthly SaaS subscription via Stripe.
- Solo plan: $29/mo (1 user)
- Small Crew: $49/mo (up to 5 workers)
- Business: $99/mo (unlimited workers + white-label PDF)

**Primary constraint:** the product must feel simple and fast to a 45-year-old
plumber who hates software. Zero unnecessary complexity in the UI.

---

## 2. TECH STACK — USE EXACTLY THIS, NOTHING ELSE

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14+ (App Router) | SSR, API routes, Vercel deploy |
| Language | TypeScript (strict mode) | Type safety across the whole app |
| Styling | Tailwind CSS v3 | Utility-first, fast iteration |
| Components | shadcn/ui | Accessible, unstyled-base components |
| Auth | Supabase Auth | Email/password + magic link, free tier generous |
| Database | Supabase PostgreSQL | Managed Postgres, row-level security |
| ORM | Supabase JS client (direct) | No extra ORM layer needed at this scale |
| Payments | Stripe (Checkout + Billing Portal) | Industry standard, webhook-driven |
| AI | Anthropic Claude API (claude-sonnet-4-20250514) | Core product capability |
| PDF | react-pdf/renderer | Server-side PDF generation |
| Email | Resend | Transactional email, simple API |
| Deployment | Vercel | Zero-config Next.js hosting |
| Env secrets | .env.local (never committed) | See Section 7 |

**Do not introduce any library, package, or service not listed above without
first asking. Smaller dependency count = fewer failure points.**

---

## 3. FOLDER STRUCTURE

Build and maintain this exact structure. Never reorganise without instruction.

```
rapidswms/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── generate/page.tsx        # Main SWMS generator UI
│   │   ├── history/page.tsx         # Past SWMS list
│   │   ├── account/page.tsx         # Subscription management
│   │   └── layout.tsx               # Dashboard shell with nav
│   ├── api/
│   │   ├── generate-swms/route.ts   # POST — calls Claude API server-side
│   │   ├── stripe/
│   │   │   ├── checkout/route.ts    # POST — create Stripe checkout session
│   │   │   ├── portal/route.ts      # POST — create billing portal session
│   │   │   └── webhook/route.ts     # POST — handle Stripe webhook events
│   │   └── pdf/route.ts             # POST — generate and return PDF
│   ├── (marketing)/
│   │   ├── page.tsx                 # Landing page
│   │   ├── pricing/page.tsx
│   │   └── layout.tsx
│   └── layout.tsx                   # Root layout
├── components/
│   ├── ui/                          # shadcn/ui primitives (auto-generated)
│   ├── swms/
│   │   ├── GeneratorForm.tsx        # The job input form
│   │   ├── SwmsDocument.tsx         # Rendered SWMS output
│   │   ├── ActivityCard.tsx         # Single activity/hazard block
│   │   ├── RiskBadge.tsx            # Risk level pill (Low/Med/High/Extreme)
│   │   └── SignoffSheet.tsx         # Worker sign-off section
│   ├── layout/
│   │   ├── DashboardNav.tsx
│   │   └── MarketingNav.tsx
│   └── shared/
│       ├── LoadingSpinner.tsx
│       └── ErrorBoundary.tsx
├── lib/
│   ├── anthropic.ts                 # Anthropic client + system prompt
│   ├── supabase/
│   │   ├── client.ts                # Browser Supabase client
│   │   └── server.ts                # Server Supabase client
│   ├── stripe.ts                    # Stripe client + helpers
│   ├── pdf.ts                       # PDF generation logic
│   └── types.ts                     # Shared TypeScript types
├── hooks/
│   ├── useUser.ts                   # Auth state hook
│   └── useSubscription.ts          # Subscription tier hook
├── supabase/
│   └── migrations/
│       └── 001_initial.sql          # Initial database schema
├── public/
├── .env.local                       # Never committed — see Section 7
├── CLAUDE.md                        # This file
└── package.json
```

---

## 4. DATABASE SCHEMA

Create all tables in a single migration file: `supabase/migrations/001_initial.sql`.
Enable Row Level Security on every table. Every user can only access their own rows.

```sql
-- Users table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  business_name text,
  abn text,
  created_at timestamptz default now()
);

-- Stripe subscription state
create table public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  plan text check (plan in ('solo', 'crew', 'business')) default 'solo',
  status text check (status in ('active', 'trialing', 'past_due', 'canceled', 'incomplete')),
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Generated SWMS records
create table public.swms_documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  document_number text not null,         -- e.g. SWMS-2026-4821
  job_title text not null,
  trade text not null,
  state text not null,
  site_address text,
  principal_contractor text,
  job_description text not null,         -- original user input
  swms_json jsonb not null,              -- full structured SWMS from Claude
  pdf_url text,                          -- Supabase Storage URL once generated
  created_at timestamptz default now()
);

-- RLS policies
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.swms_documents enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can view own subscription"
  on public.subscriptions for select using (auth.uid() = user_id);

create policy "Users can view own SWMS"
  on public.swms_documents for select using (auth.uid() = user_id);
create policy "Users can insert own SWMS"
  on public.swms_documents for insert with check (auth.uid() = user_id);
```

---

## 5. THE SWMS SYSTEM PROMPT (CORE IP — HANDLE WITH CARE)

This prompt lives exclusively in `lib/anthropic.ts`. It is server-side only.
It is never sent to the client. It is never logged. It is the primary
intellectual property of the business.

```typescript
// lib/anthropic.ts
import Anthropic from '@anthropic-ai/sdk';

export const anthropicClient = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export const SWMS_SYSTEM_PROMPT = `You are an expert Australian Work Health & Safety (WHS) consultant specialising in Safe Work Method Statements (SWMS) for the construction and trades industry. You operate under the model WHS Act 2011, the model WHS Regulations 2011 (Part 6.3, regs 291–306), Safe Work Australia codes of practice, and the relevant state/territory regulator requirements.

State regulators:
- NSW: SafeWork NSW | VIC: WorkSafe Victoria | QLD: Workplace Health and Safety Queensland
- WA: WorkSafe WA | SA: SafeWork SA | TAS: WorkSafe Tasmania | ACT: WorkSafe ACT | NT: NT WorkSafe

YOUR TASK
Given a job description, trade, and jurisdiction, produce a thorough, job-specific SWMS. Be concrete about THIS job. Never use generic boilerplate. Identify real hazards for the described work and practical, enforceable controls.

HIGH RISK CONSTRUCTION WORK — flag any that apply (WHS Reg 291):
1. Risk of a person falling more than 2 metres
2. Work on a telecommunication tower
3. Demolition of a load-bearing structural element
4. Likely to involve disturbing asbestos
5. Structural alterations or repairs requiring temporary support to prevent collapse
6. Work in or near a confined space
7. Work in or near a shaft or trench deeper than 1.5m, or a tunnel
8. Use of explosives
9. Work on or near pressurised gas distribution mains or piping
10. Work on or near chemical, fuel or refrigerant lines
11. Work on or near energised electrical installations or services
12. Work in an area that may have a contaminated or flammable atmosphere
13. Tilt-up or precast concrete work
14. Work on, in or adjacent to a road, railway, shipping lane or other traffic corridor in use
15. Work in an area where there is movement of powered mobile plant
16. Work in areas with artificial extremes of temperature
17. Work in or near water or other liquid involving a risk of drowning
18. Diving work

RISK ASSESSMENT — 5x5 matrix
Likelihood: Rare | Unlikely | Possible | Likely | Almost Certain
Consequence: Insignificant | Minor | Moderate | Major | Catastrophic
Express as: Low | Medium | High | Extreme — both initial (uncontrolled) and residual (post-control).

HIERARCHY OF CONTROLS (apply in order, prefer highest practicable):
1. Elimination  2. Substitution  3. Isolation / Engineering  4. Administrative  5. PPE
Never rely on PPE alone if a higher-order control is reasonably practicable.

OUTPUT — respond with valid JSON only. No markdown. No backticks. No preamble. Schema:
{
  "jobTitle": "concise title",
  "highRiskWork": ["matched categories from the list above, verbatim; empty array if none apply"],
  "ppe": ["specific PPE for this job"],
  "permits": ["licences/permits required; empty array if none"],
  "activities": [
    {
      "task": "a discrete sequential step",
      "hazards": ["specific hazards for this step only"],
      "initialRisk": "Low|Medium|High|Extreme",
      "controls": ["practical, actionable control measures ordered by hierarchy"],
      "residualRisk": "Low|Medium|High|Extreme",
      "responsible": "role (e.g. Licensed Electrician, Site Supervisor)"
    }
  ],
  "emergencyProcedures": ["specific emergency steps for this type of work"],
  "legislation": ["Acts, Regs, Codes of Practice, Australian Standards relevant to this work and jurisdiction"]
}

CONSTRAINTS
- 5–9 activities covering the real job sequence (setup → work → pack-down)
- 2–5 controls per task — practical, not theoretical
- Reference real Australian Standards where genuinely relevant
- Tailor legislation list to the stated jurisdiction
- Output MUST be valid parseable JSON and nothing else`;

export interface SwmsInput {
  company: string;
  abn?: string;
  trade: string;
  state: string;
  site?: string;
  principal?: string;
  jobDescription: string;
}

export async function generateSwms(input: SwmsInput): Promise<SwmsDocument> {
  const userMessage = `Trade: ${input.trade}
Jurisdiction: ${input.state}, Australia
Business: ${input.company}${input.abn ? ` (ABN: ${input.abn})` : ''}
Worksite: ${input.site || 'Not specified'}
Principal contractor: ${input.principal || 'Not specified'}

JOB DESCRIPTION:
${input.jobDescription}

Produce a complete, job-specific SWMS as JSON per your instructions.`;

  const response = await anthropicClient.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: SWMS_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  });

  const text = response.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('')
    .trim()
    .replace(/```json|```/gi, '')
    .trim();

  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first === -1 || last === -1) throw new Error('Invalid JSON response from Claude');
  return JSON.parse(text.slice(first, last + 1)) as SwmsDocument;
}
```

---

## 6. API ROUTES — EXACT BEHAVIOUR

### POST /api/generate-swms
- Requires authenticated session (check Supabase auth server-side, return 401 if not authenticated)
- Requires active subscription (check subscriptions table, return 402 if no active/trialing sub)
- Validates input (company, trade, state, jobDescription required; jobDescription min 20 chars)
- Calls `generateSwms()` from lib/anthropic.ts
- Saves result to `swms_documents` table with auto-generated document number (SWMS-YYYY-XXXX)
- Returns the full SWMS JSON and the saved document ID
- On Claude API error: return 500 with user-friendly message, log actual error server-side only
- Rate limit: 20 SWMS generations per user per day (check count from swms_documents table)

### POST /api/stripe/checkout
- Requires authenticated session
- Accepts: `{ plan: 'solo' | 'crew' | 'business' }`
- Creates or retrieves Stripe customer linked to user
- Creates Stripe Checkout Session with 7-day free trial
- Stripe Price IDs come from environment variables (STRIPE_PRICE_SOLO, STRIPE_PRICE_CREW, STRIPE_PRICE_BUSINESS)
- Returns: `{ url: checkoutUrl }`

### POST /api/stripe/portal
- Requires authenticated session
- Creates Stripe Billing Portal session for subscription management
- Returns: `{ url: portalUrl }`

### POST /api/stripe/webhook
- Validates Stripe webhook signature (STRIPE_WEBHOOK_SECRET env var)
- Handles these events ONLY:
  - `checkout.session.completed` → create/update subscription row
  - `customer.subscription.updated` → update plan, status, period_end
  - `customer.subscription.deleted` → set status to 'canceled'
  - `invoice.payment_failed` → set status to 'past_due'
- Returns 200 immediately for unhandled event types (do not error)

### POST /api/pdf
- Requires authenticated session
- Accepts: `{ swmsId: string }`
- Fetches SWMS JSON from swms_documents table (verifying user_id matches)
- Generates PDF using react-pdf/renderer
- Returns PDF as binary response with Content-Type: application/pdf
- PDF includes: all SWMS sections, company branding, document number, date, sign-off table

---

## 7. ENVIRONMENT VARIABLES

These go in `.env.local`. Never commit this file. Never log these values.
Add every new variable here before using it in code.

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # Server-side only — never NEXT_PUBLIC_

# Anthropic
ANTHROPIC_API_KEY=                  # Server-side only — never NEXT_PUBLIC_

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=                  # Server-side only
STRIPE_WEBHOOK_SECRET=              # Server-side only
STRIPE_PRICE_SOLO=                  # Stripe Price ID for $29/mo plan
STRIPE_PRICE_CREW=                  # Stripe Price ID for $49/mo plan
STRIPE_PRICE_BUSINESS=              # Stripe Price ID for $99/mo plan

# Resend (transactional email)
RESEND_API_KEY=                     # Server-side only
RESEND_FROM_EMAIL=noreply@rapidswms.com.au

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000   # Change to prod URL on deploy
```

**Security rules Claude Code must always follow:**
- ANTHROPIC_API_KEY, STRIPE_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY
  must ONLY appear in server-side files (API routes, lib/ server modules)
- Never use these in client components, hooks, or any file with 'use client'
- Never log the values of secrets
- Verify auth on EVERY API route — never trust client-provided user IDs

---

## 8. AUTH FLOW

### Sign-up
1. User fills email + password on /signup
2. Supabase creates auth.users record + sends confirmation email
3. On email confirmation: Supabase trigger creates profiles row
4. Redirect to /pricing to choose plan

### Login
1. User fills email + password (or magic link) on /login
2. On success: redirect to /generate (the main dashboard)

### Auth middleware
- Create `middleware.ts` at project root
- Protected routes: all `/` paths EXCEPT `/`, `/pricing`, `/login`, `/signup`, `/api/stripe/webhook`
- Redirect unauthenticated users to /login
- Redirect authenticated users away from /login and /signup to /generate

### Subscription gate
- Routes under `(dashboard)` check for active/trialing subscription
- If no active subscription: redirect to /pricing
- Trial users (status: 'trialing') have full access
- Cancelled/past_due users: show reactivation prompt, block generation

---

## 9. UI BEHAVIOUR — EXACT RULES

### Generator page (/generate)
- Form fields: Business name (required), ABN (optional), Trade (required, select),
  State/Territory (required, select), Worksite address (optional),
  Principal contractor (optional), Job description (required, textarea)
- "Generate SWMS" button: disabled while loading
- Loading state: show animated progress with real step labels
  (Reading job → Identifying hazards → Applying controls → Rating risks → Compiling document)
- On success: scroll to rendered SWMS document below the form
- On error: show inline error message below the button (never use alert())
- "Sample job" button fills the form with an example (solar install on 2-storey residential roof)
- Every generated SWMS auto-saves to the database — user does not need to manually save

### SWMS document display
- Show all sections: header, high-risk work flags, PPE, activities table,
  emergency procedures, legislation, sign-off sheet
- Risk badges use colour coding: Low=green, Medium=amber, High=red, Extreme=dark red
- Show initial risk → arrow → residual risk on each activity
- "Export PDF" button → POST to /api/pdf → download the file
- "Print" button → window.print() (the page has print CSS)
- Disclaimer banner always visible: "AI-generated draft — review before use on site"

### History page (/history)
- List of past SWMS sorted by created_at desc
- Each row: job title, trade, state, date, document number, "View" and "Download PDF" actions
- Loading skeleton while fetching
- Empty state: friendly message + "Generate your first SWMS" CTA

### Account page (/account)
- Show current plan name and status
- Show trial end date if on trial
- "Manage subscription" → POST to /api/stripe/portal → redirect to Stripe portal
- Show usage: SWMS generated today / 20 daily limit

### General UI rules
- Mobile-first — every page must work on a phone (tradies are on mobile on site)
- No page should require a horizontal scroll on screens ≥ 375px wide
- Form validation is inline (red border + message below field), never on submit only
- Loading states for every async action — never leave the user with a frozen button
- Accessible: all inputs have labels, all buttons have aria-labels if icon-only

---

## 10. DESIGN SYSTEM

### Colours (Tailwind config additions)
```js
// tailwind.config.ts
colors: {
  brand: {
    amber: '#FFB81C',
    'amber-deep': '#E89C00',
    ink: '#15151A',
    charcoal: '#23232B',
    steel: '#5A5A66',
    paper: '#F7F4ED',
    'paper-2': '#EFEAE0',
    line: '#D8D2C5',
    'line-dark': '#33333D',
  },
  risk: {
    low: '#2E7D32',
    medium: '#E08600',
    high: '#D7411E',
    extreme: '#9B1B0E',
  }
}
```

### Typography
- Headings: Archivo Black (Google Fonts) — strong, industrial
- Body: Archivo — clean, highly readable
- Monospace/labels: IBM Plex Mono — technical details, document numbers
- Load via next/font/google

### Tone
- Copy is direct, plain, Australian
- No jargon. "Generate" not "synthesise". "Download" not "export artifact"
- The product is for tradies — treat them like professionals who want to get on with the job
- Error messages explain what to do, not just what went wrong

---

## 11. VERIFICATION CHECKLIST

After completing any feature or fix, Claude Code must verify:

**Core generation flow**
- [ ] Form validates all required fields before submitting
- [ ] API route rejects unauthenticated requests (test with no session)
- [ ] API route rejects users without active subscription
- [ ] Claude API call happens server-side only (check no API key in client bundle)
- [ ] Generated SWMS is saved to database with correct user_id
- [ ] Document number is unique (SWMS-YYYY-XXXX format)
- [ ] Error handling surfaces a friendly message, not a raw stack trace

**Auth**
- [ ] Unauthenticated users cannot access /generate, /history, /account
- [ ] Login redirects to /generate on success
- [ ] Signup redirects to /pricing on success
- [ ] Session persists across page refresh

**Payments**
- [ ] Checkout session is created with 7-day trial
- [ ] Stripe webhook updates subscription status correctly
- [ ] Billing portal link works for active subscribers
- [ ] Past_due users see reactivation prompt and cannot generate

**PDF**
- [ ] PDF generates without error for all SWMS
- [ ] PDF includes all sections: header, HRCW, PPE, activities, emergency, legislation, sign-off
- [ ] PDF has correct document number and date
- [ ] PDF downloads correctly in Chrome and Safari

**Mobile**
- [ ] Generator form is usable on iPhone SE (375px)
- [ ] SWMS document is readable on mobile (no overflow)
- [ ] Buttons are at least 44px tall (touch target)

---

## 12. WORKFLOW — HOW TO WORK WITH CLAUDE CODE

### Starting a session
1. Open Claude Code in the project root (where this CLAUDE.md lives)
2. Begin every session by stating which feature you are building
3. Claude Code will read this file automatically at session start

### Recommended session structure
- One feature per session where possible
- Use plan mode (`/plan`) before implementing anything that touches multiple files
- After implementing: run through the verification checklist for that feature
- Commit after each verified feature: `git commit -m "feat: [feature name]"`
- Use `/compact` if context usage exceeds 70% — hint: "preserve all API routes and schema"

### Build order (do not skip steps)
1. Project scaffold (Next.js + Tailwind + shadcn/ui + TypeScript)
2. Supabase setup (project, schema migration, RLS policies, env vars)
3. Auth pages (login, signup, middleware)
4. Stripe products setup (create plans in Stripe dashboard, add price IDs to env)
5. Stripe webhook + subscription management
6. Core API route: /api/generate-swms (requires working auth + subscription check)
7. Generator UI (/generate page + form + SWMS document display)
8. PDF generation (/api/pdf + export button)
9. History page
10. Account page
11. Marketing landing page
12. Pricing page
13. End-to-end test of full user flow (sign up → trial → generate → download → manage subscription)

### If something breaks
- Read the error in full before touching code
- Check browser console AND server terminal (Next.js logs both)
- For Supabase auth errors: check RLS policies first
- For Stripe errors: check webhook logs in Stripe dashboard
- For Claude API errors: check server logs (error details are never sent to client)
- If a second attempt at the same fix fails: stop, use `/clear`, restart with a cleaner prompt

---

## 13. WHAT CLAUDE CODE MUST NEVER DO

- Add `console.log` statements containing API keys, user IDs, or SWMS content
- Use `any` type in TypeScript (use `unknown` and narrow it)
- Commit `.env.local` or any file containing real secrets
- Skip the auth check on any API route
- Skip the subscription check on /api/generate-swms
- Use the SWMS system prompt as a client-side variable
- Implement features not in this document without asking first
- Use a different model than `claude-sonnet-4-20250514` for SWMS generation
- Use `alert()`, `confirm()`, or `prompt()` anywhere in the UI
- Remove or modify the "AI-generated draft — review before use on site" disclaimer
- Store user passwords or raw Stripe payment details anywhere in the database
