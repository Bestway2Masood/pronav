-- ============================================
-- ProNav Platform — Supabase Schema
-- Run this in your Supabase SQL editor
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- ============================================
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  headline text,
  summary text,
  location text,
  years_experience integer,
  career_status text default 'seeking' check (career_status in ('seeking', 'open', 'active')),
  sectors text[] default '{}',
  themes text[] default '{}',
  skills text[] default '{}',
  languages text[] default '{}',
  education jsonb default '[]',
  experience jsonb default '[]',
  avatar_url text,
  cv_parsed boolean default false,
  subscription_plan text default 'pro' check (subscription_plan in ('trial', 'pro', 'enterprise')),
  subscription_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS: users can only see and edit their own profile
alter table profiles enable row level security;
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================
-- DOCUMENTS TABLE
-- ============================================
create table documents (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  category text default 'general' check (category in ('cv', 'cover_letter', 'reference', 'certificate', 'report', 'general')),
  path text not null,
  url text,
  size integer,
  type text,
  created_at timestamptz default now()
);

alter table documents enable row level security;
create policy "Users manage own documents" on documents for all using (auth.uid() = user_id);

-- ============================================
-- ESCALATIONS TABLE
-- ============================================
create table escalations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  question text not null,
  conversation_context jsonb default '[]',
  ai_attempt text,
  status text default 'pending' check (status in ('pending', 'in_progress', 'resolved')),
  advisor_response text,
  advisor_note_sent_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Users can see their own escalations; advisor (you) needs service role or a special policy
alter table escalations enable row level security;
create policy "Users view own escalations" on escalations for select using (auth.uid() = user_id);
create policy "Users create escalations" on escalations for insert with check (auth.uid() = user_id);
-- Advisor update policy: use service role key in advisor studio, or set up a separate advisor_id column

-- ============================================
-- ADVISORY SESSIONS TABLE
-- ============================================
create table advisory_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  session_type text not null,
  messages jsonb default '[]',
  escalated boolean default false,
  escalation_id uuid references escalations(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table advisory_sessions enable row level security;
create policy "Users manage own sessions" on advisory_sessions for all using (auth.uid() = user_id);

-- ============================================
-- STORAGE BUCKET
-- ============================================
insert into storage.buckets (id, name, public) values ('documents', 'documents', true);
create policy "Users upload own documents" on storage.objects for insert with check (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users view own documents" on storage.objects for select using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users delete own documents" on storage.objects for delete using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);
