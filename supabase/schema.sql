-- AnalityQ / Supabase
-- Wklej cały ten plik w Supabase SQL Editor i uruchom go w nowym projekcie Supabase.
-- To jest konfiguracja prototypowa dla prywatnego narzędzia /studio.
-- Uwaga produkcyjna:
-- Obecna blokada /studio hasłem w aplikacji jest zabezpieczeniem prototypowym.
-- Docelowo panel administracyjny powinien korzystać z Supabase Auth, zabezpieczonych API routes
-- i polityk RLS ograniczających zapis tylko do zalogowanego administratora.

create extension if not exists pgcrypto;

create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  slot_number integer,
  slug text unique not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  source_mode text default 'manual',
  publication_status text default 'draft',
  basic jsonb,
  manual_stats jsonb,
  odds jsonb,
  user_probabilities jsonb,
  settings jsonb,
  notes jsonb,
  premium_sections jsonb
);

create index if not exists analyses_publication_status_idx on public.analyses (publication_status);
create index if not exists analyses_slug_idx on public.analyses (slug);
create index if not exists analyses_slot_number_idx on public.analyses (slot_number);
create index if not exists analyses_created_at_idx on public.analyses (created_at);

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

-- Polityki RLS do prototypu.
-- Aplikacja publiczna i tak pobiera tylko publication_status = 'published'.
-- Dodatkowa polityka odczytu wszystkich rekordów dla anon jest prototypowym kompromisem,
-- żeby /studio bez Supabase Auth widziało szkice i archiwum.
-- Produkcyjnie usuń prototypowe polityki anon, zostaw publiczny odczyt published
-- i przenieś studio do Supabase Auth albo zabezpieczonych API routes.

alter table public.analyses enable row level security;

drop policy if exists "Publiczny odczyt opublikowanych analiz" on public.analyses;
create policy "Publiczny odczyt opublikowanych analiz"
on public.analyses
for select
to anon
using (publication_status = 'published');

drop policy if exists "Prototypowy odczyt wszystkich analiz dla anon" on public.analyses;
create policy "Prototypowy odczyt wszystkich analiz dla anon"
on public.analyses
for select
to anon
using (true);

drop policy if exists "Prototypowy zapis analiz dla anon" on public.analyses;
create policy "Prototypowy zapis analiz dla anon"
on public.analyses
for insert
to anon
with check (true);

drop policy if exists "Prototypowa edycja analiz dla anon" on public.analyses;
create policy "Prototypowa edycja analiz dla anon"
on public.analyses
for update
to anon
using (true)
with check (true);

drop policy if exists "Prototypowe usuwanie analiz dla anon" on public.analyses;
create policy "Prototypowe usuwanie analiz dla anon"
on public.analyses
for delete
to anon
using (true);
