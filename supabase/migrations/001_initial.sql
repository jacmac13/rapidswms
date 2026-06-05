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
  document_number text not null,
  job_title text not null,
  trade text not null,
  state text not null,
  site_address text,
  principal_contractor text,
  job_description text not null,
  swms_json jsonb not null,
  pdf_url text,
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
