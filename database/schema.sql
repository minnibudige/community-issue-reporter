-- Community Issue Reporter database schema
-- Run this entire script in Supabase Dashboard -> SQL Editor -> New query.

create table if not exists public.reports (
  id bigint generated always as identity primary key,
  title text not null check (char_length(trim(title)) between 1 and 120),
  location text not null check (char_length(trim(location)) between 1 and 180),
  category text not null check (category in ('Roads', 'Lighting', 'Waste', 'Water', 'Public safety', 'Other')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  description text not null check (char_length(trim(description)) between 1 and 2000),
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reports_created_at_idx on public.reports (created_at desc);
create index if not exists reports_status_idx on public.reports (status);
create index if not exists reports_priority_idx on public.reports (priority);
create index if not exists reports_category_idx on public.reports (category);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_reports_updated_at on public.reports;
create trigger set_reports_updated_at
before update on public.reports
for each row execute function public.set_updated_at();

-- This starter application accesses the database only through its Express server
-- using a privileged server-side key. Do not expose that key in browser code.
-- Enable RLS to block direct access through public/anon API keys.
alter table public.reports enable row level security;
-- No anon/authenticated policies are intentionally created: direct client access is denied.
-- Server-side service-role access bypasses RLS, so backend authorization becomes critical.
