-- Migration 002: Subscription tier feature tables

-- Worker profiles (crew+ feature): save crew member names/roles for sign-off auto-populate
create table public.worker_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  role text not null,
  created_at timestamptz default now()
);
alter table public.worker_profiles enable row level security;
create policy "Users manage own worker profiles"
  on public.worker_profiles for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- SWMS templates (crew+ feature): save any generated SWMS as a reusable template
create table public.swms_templates (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  trade text not null,
  swms_json jsonb not null,
  created_at timestamptz default now()
);
alter table public.swms_templates enable row level security;
create policy "Users manage own templates"
  on public.swms_templates for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- SWMS version history (business feature): each regeneration saves a new version
create table public.swms_versions (
  id uuid default gen_random_uuid() primary key,
  swms_document_id uuid references public.swms_documents(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  version_number integer not null default 1,
  swms_json jsonb not null,
  created_at timestamptz default now()
);
alter table public.swms_versions enable row level security;
create policy "Users manage own versions"
  on public.swms_versions for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- QR code signatures (business feature): workers scan a QR and sign without an account
create table public.qr_signatures (
  id uuid default gen_random_uuid() primary key,
  swms_document_id uuid references public.swms_documents(id) on delete cascade not null,
  qr_token text not null,
  worker_name text not null,
  worker_role text,
  signed_at timestamptz default now()
);
alter table public.qr_signatures enable row level security;
-- Workers sign without an account; token validity is enforced server-side
create policy "Public can insert QR signatures"
  on public.qr_signatures for insert with check (true);
-- Document owners can view signatures for their documents
create policy "Document owners view their signatures"
  on public.qr_signatures for select using (
    exists (
      select 1 from public.swms_documents d
      where d.id = swms_document_id and d.user_id = auth.uid()
    )
  );

-- Add company logo URL to profiles (business feature: white-label PDF)
alter table public.profiles
  add column if not exists company_logo_url text;

-- Add QR token to SWMS documents (business feature: QR sign-off)
alter table public.swms_documents
  add column if not exists qr_token text unique;
