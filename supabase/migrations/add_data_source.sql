-- Rozszerzenie istniejącej bazy AnalityQ bez usuwania ani modyfikowania danych analiz.
alter table public.analyses
add column if not exists data_source jsonb;

create table if not exists public.api_cache (
  cache_key text primary key,
  payload jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

create index if not exists api_cache_expires_at_idx
on public.api_cache (expires_at);

alter table public.api_cache enable row level security;

comment on table public.api_cache is
'Opcjonalny trwały cache danych dostawców sportowych. Obecna integracja korzysta z bezpiecznego cache in-memory.';
