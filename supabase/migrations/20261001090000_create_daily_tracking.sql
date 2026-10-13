create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  category text not null check (category in ('career', 'lifestyle', 'fitness')),
  priority smallint not null check (priority between 1 and 10),
  daily_target_minutes integer not null check (daily_target_minutes between 1 and 1440),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.daily_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null,
  entry_date date not null,
  focused_minutes integer not null check (focused_minutes between 0 and 1440),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (task_id, entry_date),
  unique (id, user_id),
  foreign key (task_id, user_id) references public.tasks(id, user_id) on delete cascade
);

create table public.daily_outputs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  daily_entry_id uuid not null,
  content text not null check (char_length(trim(content)) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (daily_entry_id),
  foreign key (daily_entry_id, user_id) references public.daily_entries(id, user_id) on delete cascade
);

create table public.entry_audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  daily_entry_id uuid not null,
  previous_value jsonb not null,
  new_value jsonb not null,
  changed_at timestamptz not null default now(),
  foreign key (daily_entry_id, user_id) references public.daily_entries(id, user_id) on delete cascade
);

create index tasks_user_active_idx on public.tasks (user_id, is_active);
create index daily_entries_user_date_idx on public.daily_entries (user_id, entry_date);
create index daily_outputs_user_entry_idx on public.daily_outputs (user_id, daily_entry_id);
create index entry_audit_log_user_entry_idx on public.entry_audit_log (user_id, daily_entry_id);

alter table public.tasks enable row level security;
alter table public.daily_entries enable row level security;
alter table public.daily_outputs enable row level security;
alter table public.entry_audit_log enable row level security;

create policy "Users manage their own tasks" on public.tasks
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their own daily entries" on public.daily_entries
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their own daily outputs" on public.daily_outputs
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users view their own entry audit history" on public.entry_audit_log
  for select to authenticated
  using ((select auth.uid()) = user_id);

create function public.set_updated_at()
returns trigger
language plpgsql
security invoker set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tasks_set_updated_at before update on public.tasks
  for each row execute procedure public.set_updated_at();
create trigger daily_entries_set_updated_at before update on public.daily_entries
  for each row execute procedure public.set_updated_at();
create trigger daily_outputs_set_updated_at before update on public.daily_outputs
  for each row execute procedure public.set_updated_at();

create function public.audit_past_daily_entry_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if old.entry_date < current_date and (old.focused_minutes is distinct from new.focused_minutes or old.entry_date is distinct from new.entry_date) then
    insert into public.entry_audit_log (user_id, daily_entry_id, previous_value, new_value)
    values (
      old.user_id,
      old.id,
      jsonb_build_object('entry_date', old.entry_date, 'focused_minutes', old.focused_minutes),
      jsonb_build_object('entry_date', new.entry_date, 'focused_minutes', new.focused_minutes)
    );
  end if;
  return new;
end;
$$;

create trigger daily_entries_audit_past_updates after update on public.daily_entries
  for each row execute procedure public.audit_past_daily_entry_update();
