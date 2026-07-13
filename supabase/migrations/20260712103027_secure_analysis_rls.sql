-- Niedestrukcyjne uszczelnienie publicznego dostępu do analiz.
-- Nie usuwa ani nie modyfikuje istniejących rekordów.

begin;

alter table public.analyses enable row level security;

revoke all on table public.analyses from anon, authenticated;
grant select on table public.analyses to anon;
grant select, insert, update, delete on table public.analyses to service_role;

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

commit;
