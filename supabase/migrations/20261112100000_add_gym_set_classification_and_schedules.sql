-- Existing sets remain NULL so historic records are not incorrectly presented as working sets.
alter table public.workout_sets
  add column if not exists set_type text
  check (set_type in ('warmup', 'working'));

create table if not exists public.training_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  effective_on date not null,
  planned_weekdays smallint[] not null
    check (cardinality(planned_weekdays) between 1 and 7)
    check (planned_weekdays <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]),
  created_at timestamptz not null default now(),
  unique (user_id, effective_on)
);

create index if not exists training_schedules_user_effective_idx
  on public.training_schedules(user_id, effective_on desc);

alter table public.training_schedules enable row level security;
create policy "Users manage own training schedules"
  on public.training_schedules for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
