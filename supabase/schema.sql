-- AnalityQ / Supabase
-- Wklej cały ten plik w Supabase SQL Editor i uruchom go w nowym projekcie Supabase.
-- Publiczny klient ma wyłącznie odczyt opublikowanych analiz.
-- Operacje Studio wykonują chronione Route Handlers z serwerowym service role.

create extension if not exists pgcrypto;

create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  slot_number integer,
  slug text unique not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  source_mode text default 'manual',
  data_source jsonb,
  publication_status text default 'draft',
  featured_type text,
  basic jsonb,
  manual_stats jsonb,
  odds jsonb,
  user_probabilities jsonb,
  settings jsonb,
  notes jsonb,
  premium_sections jsonb
);

alter table public.analyses add column if not exists featured_type text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'analyses_featured_type_check'
      and conrelid = 'public.analyses'::regclass
  ) then
    alter table public.analyses
      add constraint analyses_featured_type_check
      check (featured_type is null or featured_type = 'match_of_the_day');
  end if;
end
$$;

create index if not exists analyses_publication_status_idx on public.analyses (publication_status);
create index if not exists analyses_slug_idx on public.analyses (slug);
create index if not exists analyses_slot_number_idx on public.analyses (slot_number);
create index if not exists analyses_created_at_idx on public.analyses (created_at);
create index if not exists analyses_featured_type_idx on public.analyses (featured_type);
create unique index if not exists analyses_single_match_of_the_day_idx
  on public.analyses (featured_type)
  where featured_type = 'match_of_the_day';

create table if not exists public.api_cache (
  cache_key text primary key,
  payload jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists api_cache_expires_at_idx on public.api_cache (expires_at);
alter table public.api_cache enable row level security;
revoke all on table public.api_cache from anon, authenticated;
grant select, insert, update, delete on table public.api_cache to service_role;

revoke all on table public.analyses from anon, authenticated;
grant select on table public.analyses to anon;
grant select, insert, update, delete on table public.analyses to service_role;

create or replace function public.update_analyses_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists analyses_updated_at_trigger on public.analyses;

create trigger analyses_updated_at_trigger
before update on public.analyses
for each row
execute function public.update_analyses_updated_at();

alter table public.analyses enable row level security;

drop policy if exists "Prototypowy odczyt wszystkich analiz dla anon" on public.analyses;
drop policy if exists "Prototypowy zapis analiz dla anon" on public.analyses;
drop policy if exists "Prototypowa edycja analiz dla anon" on public.analyses;
drop policy if exists "Prototypowe usuwanie analiz dla anon" on public.analyses;

drop policy if exists "Publiczny odczyt opublikowanych analiz" on public.analyses;
create policy "Publiczny odczyt opublikowanych analiz"
on public.analyses
for select
to anon
using (publication_status = 'published');
