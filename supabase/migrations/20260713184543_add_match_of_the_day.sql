alter table public.analyses
  add column if not exists featured_type text;

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

create index if not exists analyses_featured_type_idx
  on public.analyses (featured_type);

create unique index if not exists analyses_single_match_of_the_day_idx
  on public.analyses (featured_type)
  where featured_type = 'match_of_the_day';
